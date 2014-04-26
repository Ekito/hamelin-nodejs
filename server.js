/**
 * Init all modules and servers
 */
var express = require('express'),
	routes = require('./routes'),
	osc = require('./osc'),
	http = require('http'),
	path = require('path'),
	SocketIO = require('socket.io');

/**
 * Init socket clients registries  
 */
var connectedDevices = {};
var indexes = [];

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
app.get('/deviceOrientationCharts', routes.deviceOrientationCharts);
app.get('/deviceOrientationSynchroCharts', routes.deviceOrientationSynchroCharts);
app.get('/deviceMotionCharts', routes.deviceMotionCharts);
app.get('/configuration', routes.configuration);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log((new Date()) + " Server is listening on port " + serverPort);
});

var io = SocketIO.listen(server);

/**
 * Socket.io connection management
 */
io.set('log level', 1);

console.log(osc);

var monitors = io.of('/monitors');
monitors.on('connection', function(socket){
	
	socket.on('osc:getParams', function(data) {
		console.info("Receive OSC parameters request from " + socket.id);
		console.info("Send serverIp : " + osc.serverIp + ", serverPort : " + osc.serverPort + ", rootAddress : " + osc.rootAddress);
		socket.emit('osc:params', {
			serverIp : osc.serverIp,
			serverPort : osc.serverPort,
			rootAddress : osc.rootAddress
		});
	});
	
	socket.on('osc:setParams', function(data) {
		console.info("Receive new OSC parameters from " + socket.id);
		osc.serverIp = data.serverIp;
		osc.serverPort = data.serverPort;
		osc.rootAddress = data.rootAddress;
		
		monitors.emit('osc:params', {
			serverIp : osc.serverIp,
			serverPort : osc.serverPort,
			rootAddress : osc.rootAddress
		});
	});
	
	socket.on('osc:message', function(data) {
		console.log("Send OSC message '" + data.message + "'");

		osc.sendMessage(data.address, data.message);
	});
	
});

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
			
			if (devices.sockets[key] != null){
				devices.sockets[key].disconnect();
			}
		}
	});
//	console.log("Connected devices : " + Object.keys(connectedDevices).length);
//	console.log("Connected monitors : " + monitors.clients().length);
}, 1000);

/**
 * Monitoring functions
 */
sendToMonitors = function(event, data){
	monitors.emit(event, data);
};

sendStatsToMonitors = function(){

	var stdDev = standardDeviation();
	stdDev["time"] = new Date().getTime();
	sendToMonitors('standardDeviation', stdDev);
	
//	sendOSC(stdDev.stdDevTiltLR, stdDev.avgTiltLR);
};


/**
 * Statistics computation
 */
standardDeviation = function(){

	var keys = Object.keys(connectedDevices);
	var stdDevTiltLR = 0;
	var stdDevTiltFB = 0;
	var avgTiltLR = 0;
	var avgTiltFB = 0;
	
	if (keys.length > 0)
	{
		var sumTiltLR = 0;
		var sumTiltFB = 0;
		
		keys.forEach(function(key){
			var device = connectedDevices[key];
			sumTiltLR += device.tiltLR;
			sumTiltFB += device.tiltFB;
		});
		
		avgTiltLR = sumTiltLR / keys.length;
		avgTiltFB = sumTiltFB / keys.length;
		
		sumTiltLR = 0;
		sumTiltFB = 0;
		
		keys.forEach(function(key){
			var device = connectedDevices[key];
			sumTiltLR += Math.pow((device.tiltLR - avgTiltLR), 2);
			sumTiltFB += Math.pow((device.tiltFB - avgTiltFB), 2);
		});
	
		stdDevTiltLR = 1 - (Math.sqrt(sumTiltLR / keys.length) / 90);
		stdDevTiltFB = 1 - (Math.sqrt(sumTiltFB / keys.length) / 90);

	}
	return {avgTiltLR : rangeValue(avgTiltLR / 90, -1, 1),
		stdDevTiltLR : rangeValue(stdDevTiltLR, 0, 1),
		avgTiltFB : rangeValue(avgTiltFB / 90, -1, 1),
		stdDevTiltFB : rangeValue(stdDevTiltFB, 0, 1)};
};

rangeValue = function(value, min, max){
	var result = 0;
	
	if (value < min){
		result = min;
	}else if (value > max){
		result = max;
	}else{
		result = value;
	}
	return result;
};

average = function(array){
	//Compute the average of values
	var sum = 0;
	for ( var int = 0; int < array.length; int++) {
		sum += array[int];
	}
	return sum / array.length;
};
