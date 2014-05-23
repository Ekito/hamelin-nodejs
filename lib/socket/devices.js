'use strict';

var logger = require('../config/log'),
	osc = require('../osc/osc');

module.exports = function(io) {
	
	var monitors = io.of('/monitors');
	var devices = io.of('/devices');
	//Init the map of active devices
	devices.active = {};
	devices.indexes = [];

	devices.on('connection', function(socket) {

		var index = devices.indexes.push(socket.id);
		socket.index = index;
		
		logger.info("Device " + index + " connected with ID: " + socket.id);

		socket.on('getId', function(data) {
			logger.info("Send new id for client " + socket.id);
			socket.time = new Date().getTime();
			devices.active[socket.id] = socket;
			socket.emit('id', index);
		});
		
		
		socket.on('deviceOrientation', function(data) {
			logger.debug('Receive deviceOrientation');
			
			socket.time = new Date().getTime();
			devices.active[socket.id] = socket;
		
			socket.tiltLR = data.tiltLR;
			socket.tiltFB = data.tiltFB;
			
			monitors.emit('deviceOrientation', data);

		});
		
		socket.on('deviceMotion', function(data) {
			logger.debug('Receive deviceMotion');
			
			socket.time = new Date().getTime();
			devices.active[socket.id] = socket;
			
			socket.x = data.x;
			socket.y = data.y;
			socket.z = data.z;
			
			monitors.emit('deviceMotion', data);
			
		});
		
		socket.on('osc:message', function(data) {
			logger.info("Device send OSC message '" + data.message + "' on address '" + data.address + "'");

			osc.sendMessage(data.address, data.message);
		});
				
	});
	
	return devices;
};