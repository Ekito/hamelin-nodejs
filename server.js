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
//list of currently connected clients (users)
var clients = [ ];

//Device orientation data are split in arrays for easier calculation
var tiltLRs = [ ];
var tiltFBs = [ ];
var times = [ ];

//list of currently connected monitors
var monitors = [ ];

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
var monitor;

io.set('log level', 1);
io.sockets.on('connection', function(socket) {

	var index = registerClient(socket);
	var isMonitor = false;
	
	
	console.log(new Date() + "Connected on socket.io with ID: " + socket.id);

	socket.on('getId', function(data) {
		console.log(new Date() + "Send new id for client " + socket.id);
		socket.emit('id', index + 1);
	});
	
	socket.on('registerMonitor', function(data) {
		console.log(new Date() + "Receive register monitor: " + socket.id);
		//Remove from the clients list and add it to the monitors
		unregisterClient(index);
		index = monitors.push(socket) - 1;
		isMonitor = true;
		
	});
	
	socket.on('unregisterMonitor', function(data) {
		console.log(new Date() + "Receive unregister monitor: " + socket.id);
		//Remove from the monitors list
		monitors.splice(index, 1);
	});

	socket.on('deviceOrientation', function(data) {
//		console.log(new Date() + "Receive device orientation: " + socket.id);
		
		recordDeviceOrientation(index, data);
		
		sendToMonitors('deviceOrientation', data);
		
	});
	
	socket.on('disconnect', function(){
		if (isMonitor) {
			//Nothing to do the monitor is unregistered when leaving the page
		}else {
			console.log(new Date() + "Removing client at index " + index);
			unregisterClient(index);
		}
		
	});
	
});

//Refresh statistics
setInterval(function() {
	sendStatsToMonitors();
}, statsFrequency);

//Refresh statistics
setInterval(function() {
	console.log("Connected clients : " + clients.length);
	clients.forEach(function(socket){
		console.log(socket.id);
	})
	console.log("Connected monitors : " + monitors.length);
	monitors.forEach(function(socket){
		console.log(socket.id);
	})
	console.log("tiltLRs : " + tiltLRs.length);
	console.log("tiltFBs : " + tiltFBs.length);
	console.log("times : " + times.length);
	
}, 5000);

registerClient = function(socket){
	var index = clients.push(socket) - 1;
	time = Math.round(new Date().getTime());
	tiltLRs.push(0);
	tiltFBs.push(0);
	times.push(time);
	return index;
};

unregisterClient = function(index){
	clients.splice(index, 1);
	tiltLRs.splice(index, 1);
	tiltFBs.splice(index, 1);
	times.splice(index, 1);
	return index;
};

/**
 * Monitoring functions
 */
sendToMonitors = function(event, data){
//	console.log("Send " + event + " to " + monitors.length + " monitor(s).");
	for (var i = 0; i < monitors.length; i ++) { // broad cast on all monitors
        if (monitors[i]) {
        	monitors[i].emit(event, data);
        }
    }
};

sendStatsToMonitors = function(){
	var time = new Date().getTime();
	var stdDevTiltLR = standardDeviation(tiltLRs);
//	console.log("stdDevTiltLR" + stdDevTiltLR);
	var stdDevTiltFB = standardDeviation(tiltFBs);
//	console.log("stdDevTiltFB" + stdDevTiltFB);
	sendToMonitors('standardDeviation', {stdDevTiltLR: stdDevTiltLR, stdDevTiltFB: stdDevTiltFB, time: time});
	
//	console.log('LR : ' + stdDevTiltLR + ' / FB : ' + stdDevTiltFB);
	sendOSC(stdDevTiltLR, stdDevTiltFB);
};

/**
 * DeviceOrientation management
 */
recordDeviceOrientation = function(index, data){
//	console.log("Record deviceOrientation : " + data);
	tiltLRs[index] = data.tiltLR;
	tiltFBs[index] = data.tiltFB;
	times[index] = data.time;
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
