const config = {}

config.logger = {}
config.logger.debugFileName = 'debug.log'
config.logger.customLevels = {
  levels: {
    info: 0,
    server: 1,
    database: 2,
    warn: 3,
    error: 4
  },
  colors: {
    info: 'cyan',
    server: 'green',
    database: 'magenta',
    warn: 'yellow',
    error: 'red',
    monitoring: 'grey'
  }
}

module.exports = config
