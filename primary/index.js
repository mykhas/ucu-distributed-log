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

const callSecondaryHost = (body, h) => {
    fetch(`${h.url}/`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }).then(_ => {
        eventEmitter.emit(getKey(body, h))
    })

    return new Promise(resolve => eventEmitter.once(getKey(body, h), resolve))
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
