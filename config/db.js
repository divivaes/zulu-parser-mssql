require('dotenv').config()

module.exports = {
  connection: {
    user: process.env.APP_DB_USER,
    password: process.env.APP_DB_PASSWORD,
    server: process.env.APP_DB_HOST,
    database: process.env.APP_DB_DATABASE
  }
}
