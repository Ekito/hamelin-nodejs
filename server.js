/**
 * Init all modules and servers
 */
var express = require('express'),
	routes = require('./lib/config/routes'),
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
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

/**
 * Routes initialization
 */
logger.info('Routes initialization...');
app.use('/', routes);

//Bootstrap socket
require('./lib/socket/socket')(app);

