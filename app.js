const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const logs = require('./config/logger').logger

// Initializing express to => app
const app = express()

// CORS
app.use(cors())

// Initializing morgan
app.use(morgan('combined'))

// Importing parsers
const flowmeter = require('./flowmeter')
const pressure = require('./pressure')
flowmeter()
pressure()

// Starting server
const port = process.env.PORT || 5000

app.listen(port, () => logs.info(`Magic is happening on port ${port}`))
