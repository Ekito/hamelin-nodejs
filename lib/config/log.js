'use strict';

var winston = require('winston'),
	config = require('../config/config');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ json: false, timestamp: true, level: config.log.level }),
    new winston.transports.File({ filename: 'debug.log', json: false, level: config.log.level })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true, level: config.log.level }),
    new winston.transports.File({ filename: 'exceptions.log', json: false, level: config.log.level })
  ],
  exitOnError: false
});

module.exports = logger;