'use strict';

var logger = require('../config/log'),
	config = require('../config/config'),
	osc = require('../osc/osc');

module.exports = function(io) {
	
	var monitors = io.of('/monitors');
	
	monitors.on('connection', function(socket){
		
		socket.on('osc:getParams', function(data) {
			console.info("Receive OSC parameters request from " + socket.id);
			console.info("Send serverIp : " + config.osc.server + ", serverPort : " + config.osc.port + ", rootAddress : " + config.osc.address);
			socket.emit('osc:params', {
				'serverIp' : config.osc.server,
				'serverPort' : config.osc.port,
				'rootAddress' : config.osc.address
			});
		});
		
		socket.on('osc:setParams', function(data) {
			console.info("Receive new OSC parameters from " + socket.id);
			config.osc.server = data.serverIp;
			config.osc.port = data.serverPort;
			config.osc.address = data.rootAddress;
			
			monitors.emit('osc:params', {
				'serverIp' : config.osc.server,
				'serverPort' : config.osc.port,
				'rootAddress' : config.osc.address
			});
		});
		
		socket.on('osc:message', function(data) {
			console.info("Monitor send OSC message '" + data.message + "' on address '" + data.address + "'");

			osc.sendMessage(data.address, data.message);
		});
		
	});
	
	return monitors;
};