const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 9000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const logs = []

app.get('/', (req, res) => {
    res.send(logs)
})

app.post('/', (req, res) => {
    logs.push(req.body.message)
    res.send(logs)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
