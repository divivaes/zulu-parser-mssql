const sql = require('mssql')
const request = require('request')
const cron = require('cron')
const moment = require('moment')
const logs = require('./config/logger').logger
require('dotenv').config()

// Connection to DB
const db_config = require('./config/db').connection

const flowmeter = () => {
    const setInitialStats = () => {
        logs.info('Initializing -=FLOWMETER=- stats getter method')
        
        new sql.ConnectionPool(db_config).connect().then(pool => {
            return pool.request().query("SELECT * FROM flowmeter")
        }).then(result => {
            if (result.rowsAffected[0] === 4) {
                logs.info('Server rebooted. Updating flowmeter stats')
                updateStats()
            } else if (result.rowsAffected[0] > 4) {
                logs.info("Too much data in flowmeter table. Table will be truncated")
                resetStats()
                insertStats()
            } else if (result.rowsAffected < 4) {
                logs.info('Table -=flowmeter=- doesnt fill requirements. Inserting new data')
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
            url: process.env.APP_WRM_FLOWMETER_URL,
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
                pool.request().query(`insert into flowmeter(flowmeter_id, address, value, time, status) values (${obj.flowmeter_id}, '${obj.address}', ${obj.value}, '${obj.time}', '${obj.status}')`)
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
            url: process.env.APP_WRM_FLOWMETER_URL,
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
                    pool.request().query(`update flowmeter set flowmeter_id = ${obj.flowmeter_id}, address = '${obj.address}', value = '${obj.value}', time = '${obj.time}', status = '${obj.status}' where flowmeter_id = ${obj.flowmeter_id} `)
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
            pool.request().query("truncate table flowmeter")
            logs.info("Table FLOWMETER truncated succesfully")
            sql.close()  
        }).catch(err => {
            logs.info("Error on connection to DB on truncating => ", err)
            sql.close()
        })
    }

  const cronJob_getStats_after_start = cron.job(
    process.env.APP_CRON_TIME,
    () => {
      let time = moment()
        .format('YYYY-MM-DD hh:mm:ss')
        .trim()
      logs.info(
        `-=cronJob_FLOWMETER_getStats_after_start=- started at - ${time}`
      )
      updateStats()
    }
  )

  setInitialStats()

  cronJob_getStats_after_start.start()


}

module.exports = flowmeter
