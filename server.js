/**
 * Init all modules and servers
 */
var express = require('express'),
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
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
    app.locals.pretty = true;
});

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
		address : "/Fader",
		args : [ myValue1, myValue2 ]
	});
	return udp.send(buf, 0, buf.length, 8200, "192.168.5.118");
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
		clients.splice(index, 1);
		index = monitors.push(socket) - 1;
		
	});

	socket.on('deviceOrientation', function(data) {
//		console.log(new Date() + "Receive device orientation: " + socket.id);
		
		recordDeviceOrientation(index, data);
		
		sendToMonitors('deviceOrientation', data);
		
		//Send OSC message to the server
		//	sendOSC(data.tiltLR, data.tiltFB);
		

	});
	
	socket.on('disconnect', function(){
		if (isMonitor) {
			console.log(new Date() + "Removing monitor at index " + index);
			monitors.splice(index, 1);
		}else {
			console.log(new Date() + "Removing client at index " + index);
			clients.splice(index, 1);	
		}
		
	});
	
	//Refresh statistics
	setInterval(function() {
		sendStatsToMonitors();
	}, statsFrequency);
});

registerClient = function(socket){
	var index = clients.push(socket) - 1;
	time = Math.round(new Date().getTime());
	tiltLRs.push(0);
	tiltFBs.push(0);
	times.push(time);
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
	
	stdDev = sum / array.length;
	
	return stdDev;
};

average = function(array){
	//Compute the average of values
	var sum = 0;
	for ( var int = 0; int < array.length; int++) {
		sum += array[int];
	}
	return sum / array.length;
};
