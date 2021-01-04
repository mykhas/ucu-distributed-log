const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const app = express()
const port = 9000
const secondaryHosts = [
    'http://host.docker.internal:9001',
    'http://host.docker.internal:9002'
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

const callSecondaryHost = (body, h) => {
    return fetch(`${h}/`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
}

app.post('/', asyncMiddleware(async (req, res, next) => {
    logs.push(req.body.message)
    if(req.body.w <= 1) {
        // we're not waiting for response here
        Promise.all(secondaryHosts.map(callSecondaryHost.bind(this, req.body)))
    } else {
        const handler = req.body.w == 2 ? Promise.race.bind(Promise) : Promise.all.bind(Promise)
        await handler(secondaryHosts.map(callSecondaryHost.bind(this, req.body)))
    }
    
    res.send(logs)
}))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
