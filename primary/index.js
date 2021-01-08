const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const events = require('events')
const app = express()
const eventEmitter = new events.EventEmitter()
const port = 9000
const basicDelay = 5
const secondaryHosts = [
    {
        'url': 'http://host.docker.internal:9001',
        'queue': [],
        'delay': 5,
        'status': 'healthy'
    },
    {
        'url': 'http://host.docker.internal:9002',
        'queue': [],
        'delay': 5,
        'status': 'healthy'
    }
]

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const logs = []

app.get('/', (req, res) => {
    res.send(logs)
})

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next)
}

const getKey = (body, h) => {
    return `resolved:${body.ts}_${body.message}_${h.url}`
}

const getQueuePromise = h => {
    if(h.queue.length === 0) return new Promise(r => r())
    return Promise.all(h.queue.map(eventName => {
        return new Promise(resolve => eventEmitter.once(eventName, resolve))
    }))
}

const runRecursiveCalls = (body, h) => {
    const delay = h.delay * 1000
    h.delay *= 2
    const timeout = setTimeout(runRecursiveCalls, delay, body, h)
    fetch(`${h.url}/`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }).then(response => {
        if(response.ok) return response
        throw new Error(`Data wasn't replicated to ${h.url}`)
    }).then(_ => {
        h.delay = basicDelay
        h.queue.shift()
        clearTimeout(timeout)
        console.log(getKey(body, h))
        eventEmitter.emit(getKey(body, h))
    }).catch(e => {
        console.log('error', h.url)
    })
}

const callSecondaryHost = (body, h) => {
    getQueuePromise(h).then(_ => runRecursiveCalls(body, h))
    h.queue.push(getKey(body, h))
    return new Promise(resolve => eventEmitter.once(getKey(body, h), resolve))
}

const sendHeartbeat = h => {
    
}

app.post('/', asyncMiddleware(async (req, res, next) => {
    req.body.ts = Date.now()
    logs.push({ ts: req.body.ts, message: req.body.message })
    const calls = secondaryHosts.map(callSecondaryHost.bind(this, req.body))
    if(req.body.w <= 1) {
        // we're not waiting for response here
        Promise.all(calls)
    } else {
        const handler = req.body.w == 2 ? Promise.race.bind(Promise) : Promise.all.bind(Promise)
        await handler(calls)
    }
    
    res.send(logs)
}))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
