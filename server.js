/**
 * Init all modules and servers
 */
var express = require('express'),
	path = require('path'),
	logger = require('./lib/config/log');

logger.info("Logging initialized !");

/**
 * Init Web Application
 */
var env = process.env.NODE_ENV || 'development';
var serverPort = process.env.PORT || 8080;
var app = express();


app.set('port', serverPort);
app.use(express.static(path.join(__dirname, 'app')));
app.use(express.static(path.join(__dirname, 'app/bower_components')));

//Bootstrap socket
require('./lib/socket/socket')(app);

