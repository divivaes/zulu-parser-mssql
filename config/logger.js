const { createLogger, format, transports } = require('winston')
const settings = require('./config')
const fs = require('fs')
const path = require('path')
const logDir = 'log'

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const filename = path.join(logDir, 'debug.log')

const logger = createLogger({
  exitOnError: false,
  levels: settings.logger.customLevels.levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.prettyPrint(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new transports.Console({
      level: settings.logger.customLevels.levels,
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    new transports.File({
      filename
    })
  ]
})

module.exports = {
  logger: logger
}
module.exports.stream = {
  write: function(message, encoding) {
    logger.server(message.trim())
  }
}
