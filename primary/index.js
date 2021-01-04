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
        .catch(next);
};

app.post('/', asyncMiddleware(async (req, res, next) => {
    logs.push(req.body.message)
    await Promise.race(secondaryHosts.map(h => {
        return fetch(`${h}/`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        })
    }))
        .then(res => res.json())
        .then(json => console.log(json));
    res.send(logs)
}))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
