/**
 * Init all modules and servers
 */
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var osc = require('osc-min');
var dgram = require('dgram');

var udp = dgram.createSocket("udp4");

var serverPort = process.env.PORT || 8080;

server.listen(serverPort, function() {
	console.log((new Date()) + " Server is listening on port " + serverPort);
});

/**
 * Init socket clients registries  
 */
//list of currently connected clients (users)
var clients = [ ];

//list of currently connected monitors
var monitors = [ ];

/**
 * Init static resources path
 */
app.get('/:resource', function(req, res) {
	res.sendfile(__dirname + '/web/' + req.params.resource);
});

app.get('/js/:resource', function(req, res) {
	res.sendfile(__dirname + '/web/js/' + req.params.resource);
});

app.get('/icons/:resource', function(req, res) {
	res.sendfile(__dirname + '/web/icons/' + req.params.resource);
});

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
var id = 0;
var monitor;

io.set('log level', 1);
io.sockets.on('connection', function(socket) {

	var index = clients.push(socket) - 1;
	var isMonitor = false;
	
	
	console.log(new Date() + "Connected on socket.io with ID: " + socket.id);

	socket.on('getId', function(data) {
		socket.emit('id', index);
	});
	
	socket.on('registerMonitor', function(data) {
		console.log(new Date() + "Receive register monitor: " + socket.id);
		//Remove from the clients list and add it to the monitors
		clients.splice(index, 1);
		index = monitors.push(socket) - 1;
		
	});

	socket.on('deviceOrientation', function(data) {
		console.log(new Date() + "Receive device orientation: " + socket.id);
		
        for (var i = 0; i < monitors.length; i ++) { // broad cast on all monitors
            if (monitors[i]) {
            	monitors[i].emit('deviceOrientation', data);
            }
        }
		
		//Send OSC message to the server
		//	sendOSC(data.tiltLR, data.tiltFB);
		

	});
	
	socket.on('disconnect', function(){
		if (isMonitor) {
			monitors.splice(index, 1);
		}else {
			clients.splice(index, 1);	
		}
		
	});
});
