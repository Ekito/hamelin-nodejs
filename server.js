/**
 * Init all modules and servers
 */
var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	SocketIO = require('socket.io');

var osc = require('osc-min');
var dgram = require('dgram');
var udp = dgram.createSocket("udp4");

/**
 * Init socket clients registries  
 */
var connectedDevices = {};
var indexes = [];

//Device orientation data are split in arrays for easier calculation
//var tiltLRs = [ ];
//var tiltFBs = [ ];
//var times = [ ];

//statistics variable
var statsFrequency = 300;

/**
 * Init Web Application
 */
var serverPort = process.env.PORT || 8080;
var app = express();

app.configure(function(){
  app.set('port', serverPort);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
    app.locals.pretty = true;
});

app.get('/', routes.index);
app.get('/deviceCharts', routes.deviceCharts);
app.get('/synchroCharts', routes.synchroCharts);
app.get('/console', routes.console);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log((new Date()) + " Server is listening on port " + serverPort);
});

var io = SocketIO.listen(server);

/**
 * Send OSC message
 */

sendOSC = function(myValue1, myValue2) {
	var buf;
	buf = osc.toBuffer({
		address : "/hamelin/deviation",
		args : [ myValue1, myValue2 ]
	});
	return udp.send(buf, 0, buf.length, 8200, "192.168.5.109");
};

/**
 * Socket.io connection management
 */
io.set('log level', 1);

var monitors = io.of('/monitor');

var devices = io.of('/devices');
devices.on('connection', function(socket) {

	var index = indexes.push(socket.id);
	
	console.log(new Date() + "Connected on socket.io with ID: " + socket.id);

	socket.on('getId', function(data) {
		console.log(new Date() + "Send new id for client " + socket.id);
		socket.emit('id', index);
	});
	
	
	socket.on('deviceOrientation', function(data) {
		connectedDevices[socket.id] = socket;
		socket.tiltLR = data.tiltLR;
		socket.tiltFB = data.tiltFB;
		socket.time = new Date().getTime();
		
		sendToMonitors('deviceOrientation', data);
		
	});
	
});

//Refresh statistics
setInterval(function() {
	sendStatsToMonitors();
}, statsFrequency);

//Manage connected devices
setInterval(function() {
	var currentTime = new Date().getTime();
	Object.keys(connectedDevices).forEach(function(key){
		var socket = connectedDevices[key];
		var elapsedTime = currentTime - socket.time;
		
		if (elapsedTime > 1000)
		{
			console.log("Remove socket :" + key + " from connected devices and disconnect.");
			delete connectedDevices[key];
			devices.sockets[key].disconnect();
		}
	});
	console.log("Connected devices : " + Object.keys(connectedDevices).length);
	console.log("Connected monitors : " + monitors.clients().length);
}, 1000);

/**
 * Monitoring functions
 */
sendToMonitors = function(event, data){
	monitors.emit(event, data);
};

sendStatsToMonitors = function(){
	var time = new Date().getTime();
	//TODO : manage standard deviation for sockets
//	var stdDevTiltLR = standardDeviation(tiltLRs);
//	console.log("stdDevTiltLR" + stdDevTiltLR);
//	var stdDevTiltFB = standardDeviation(tiltFBs);
//	console.log("stdDevTiltFB" + stdDevTiltFB);
//	sendToMonitors('standardDeviation', {stdDevTiltLR: stdDevTiltLR, stdDevTiltFB: stdDevTiltFB, time: time});
	
//	console.log('LR : ' + stdDevTiltLR + ' / FB : ' + stdDevTiltFB);
//	sendOSC(stdDevTiltLR, stdDevTiltFB);
};


/**
 * Statistics computation
 */
standardDeviation = function(array){
	var avg = average(array);
	var sum = 0;
	
	for ( var int = 0; int < array.length; int++) {
		sum += Math.pow((array[int] - avg), 2);
	}
	
	stdDev = Math.sqrt(sum / array.length);
	var dev = 1;
	if (stdDev > 1) {
		dev = 1 / stdDev;
	}
	
	return dev;
};

average = function(array){
	//Compute the average of values
	var sum = 0;
	for ( var int = 0; int < array.length; int++) {
		sum += array[int];
	}
	return sum / array.length;
};
