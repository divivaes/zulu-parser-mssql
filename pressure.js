const sql = require('mssql')
const request = require('request')
const cron = require('cron')
const moment = require('moment')
const logs = require('./config/logger').logger
require('dotenv').config()

// Connection to DB
const db_config = require('./config/db').connection

const pressure = () => {
    const setInitialStats = () => {
        logs.info('Initializing -=PRESSURE=- stats getter method')
        
        new sql.ConnectionPool(db_config).connect().then(pool => {
            return pool.request().query("SELECT * FROM pressure")
        }).then(result => {
            if (result.rowsAffected[0] === 4) {
                logs.info('Server rebooted. Updating pressure stats')
                updateStats()
            } else if (result.rowsAffected[0] > 4) {
                logs.info("Too much data in pressure table. Table will be truncated")
                resetStats()
                insertStats()
            } else if (result.rowsAffected < 4) {
                logs.info('Table -=pressure=- doesnt fill requirements. Inserting new data')
                resetStats()
                insertStats()
            }
            sql.close()
        }).catch(err => {
            logs.info("Error on connection to DB on selecting => ", err)
            sql.close()
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

        new sql.ConnectionPool(db_config).connect().then(pool => {
            let time = moment()
                    .format('YYYY-MM-DD hh:mm:ss')
                    .trim()
            body = JSON.parse(body)
            body.forEach(obj => {
                pool.request().query(`insert into pressure(name, id_sensor, type_int, overValue, underValue, value, time, previous, cp_value, cp_time, cp_previous, position, status) values ('${obj.name}', '${obj.id_sensor}',  '${obj.type_int}', '${obj.overValue}', '${obj.underValue}', '${obj.value}', '${obj.time}', '${obj.previous}', '${obj.cp_value}', '${obj.cp_time}', '${obj.cp_previous}', '${obj.position}', '${obj.status}' )`)
            })
            sql.close() 
            }).catch(err => {
                logs.info("Error on connection to DB on inserting => ", err)
                sql.close()
            })
        })
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
            if (error) logs.info(`Error on request WRM_FLOWMETER_URL - ${error}`)

            new sql.ConnectionPool(db_config).connect().then(pool => {
                let time = moment()
                    .format('YYYY-MM-DD hh:mm:ss')
                    .trim()
                body = JSON.parse(body)
                body.forEach(obj => {
                    pool.request().query(`update pressure set name = '${obj.name}', type_int = '${obj.type_int}', id_sensor = '${obj.id_sensor}', overValue = '${obj.overValue}', underValue = '${obj.underValue}', value = '${obj.value}', time = '${obj.time}', previous = '${obj.previous}', cp_value = '${obj.cp_value}', cp_time = '${obj.cp_time}', cp_previous = '${obj.cp_previous}', position = '${obj.position}', status = '${obj.status}' where id_sensor = ${obj.id_sensor} `)
                })
                sql.close() 
            }).catch(err => {
                logs.info("Error on connection to DB on inserting => ", err)
                sql.close()
            })
        })
    }


    const resetStats = () => {
        new sql.ConnectionPool(db_config).connect().then(pool => {
            pool.request().query("truncate table pressure")
            logs.info("Table PRESSURE truncated succesfully")
            sql.close()  
        }).catch(err => {
            logs.info("Error on connection to DB on truncating => ", err)
            sql.close()
        })
    }

  const cronJob_getStats_after_start = cron.job('0 */15 * * * *', () => {
    let time = moment()
      .format('YYYY-MM-DD hh:mm:ss')
      .trim()
    logs.info(`-=cronJob_PRESSURE_getStats_after_start=- started at - ${time}`)
    updateStats()
  })

  setInitialStats()

  cronJob_getStats_after_start.start()


}

module.exports = pressure
