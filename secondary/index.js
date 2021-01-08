const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 9000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const logs = []
let isSwitchedOff = false

app.get('/', (req, res) => {
    res.send(logs)
})

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
}

app.post('/', asyncMiddleware(async (req, res) => {
    if(isSwitchedOff) throw new Error('Server is switched off')
    await (new Promise(resolve => setTimeout(resolve, process.env.DELAY * 1000)))
    if(!logs.find(l => l.message === req.body.message && l.ts === req.body.ts)) {
        logs.push({ ts: req.body.ts, message: req.body.message })
    }
    res.send(logs)
}))

app.patch('/', (req, res) => {
    isSwitchedOff = req.body.off === true
    res.send({ isSwitchedOff })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
