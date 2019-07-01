const mysql = require('mysql')
const request = require('request')
const cron = require('cron')
const moment = require('moment')
const logs = require('./config/logger').logger
require('dotenv').config()

// Connection to DB
const db_config = require('./config/db')
const connection = mysql.createConnection(db_config.connection)
connection.query(`USE ${db_config.database}`)

const presure = () => {
  const setInitialStats = () => {
    logs.server('Initializing -=PRESSURE=- stats getter method')
    connection.query('SELECT id, name FROM PRESSURE', (err, rows) => {
      if (err) logs.info(`Error on selecting from table PRESSURE => - ${err}`)
      if (rows.length === 96) {
        logs.info('Server rebooted. Updating pressure stats')
        updateStats()
      } else if (rows.length > 97) {
        resetStats()
        insertStats()
      } else if (rows.length === 0) {
        logs.info('Table -=pressure=- is empty. Inserting new data')
        insertStats()
      }
    })
  }

  const resetStats = async () => {
    connection.query('TRUNCATE TABLE pressure', err => {
      if (err) logs.info(`Error on truncating table PRESSURE => - ${err}`)
      logs.info('Too much data and table will be truncated. Inserting new data')
    })
  }

  const insertStats = async () => {
    await request(
      {
        url: process.env.APP_WRM_PRESSURE_URL,
        method: 'GET',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json'
          }
        ]
      },
      (error, response, body) => {
        if (error) logs.info(`Error on request WRM_PRESSURE_URL - ${error}`)

        let time = moment()
          .format('YYYY-MM-DD hh:mm:ss')
          .trim()
        body = JSON.parse(body)
        body.forEach(obj => {
          connection.query('INSERT INTO pressure SET ?', obj, (err, rows) => {
            if (err)
              logs.info(`Error on inserting to table PRESSURE => - ${err}`)
          })
        })
        logs.info(`Inserted new values to table PRESSURE on - ${time}`)
      }
    )
  }

  const updateStats = async () => {
    await request(
      {
        url: process.env.APP_WRM_PRESSURE_URL,
        method: 'GET',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json'
          }
        ]
      },
      (error, response, body) => {
        if (error) logs.info(`Error on request WRM_PRESSURE_URL - ${error}`)

        let time = moment()
          .format('YYYY-MM-DD hh:mm:ss')
          .trim()
        body = JSON.parse(body)
        body.forEach(obj => {
          connection.query(
            `UPDATE pressure SET ? WHERE id_sensor = ${obj.id_sensor} `,
            obj,
            (err, rows) => {
              if (err)
                logs.info(`Error on updating to table PRESSURE => - ${err}`)
            }
          )
        })
        logs.info(`Updated values in table PRESSURE on - ${time}`)
      }
    )
  }

  const cronJob_getStats_after_start = cron.job('0 */15 * * * *', () => {
    let time = moment()
      .format('YYYY-MM-DD hh:mm:ss')
      .trim()
    logs.info(`-=cronJob_PRESSURE_getStats_after_start=- started at - ${time}`)
    getStats()
  })

  setInitialStats()

  cronJob_getStats_after_start.start()
}

module.exports = presure
