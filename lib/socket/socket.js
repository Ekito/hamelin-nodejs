'use strict';

var	logger = require('../config/log'),
	config = require('../config/config'),
	math = require('../math/math'),
	osc = require('../osc/osc'),
	http = require('http'),
	SocketIO = require('socket.io');

module.exports = function(app) {
	
	var server = http.createServer(app);
	server.listen(app.get('port'), function(){
		logger.info((new Date()) + " Server is listening on port " + config.socket.port);
	});

	var io = SocketIO.listen(server);
	
	/**
	 * Sockets management
	 */
	var monitors = require('./monitors')(io);
	var devices = require('./devices')(io);
	
	//Send "suiveur" data
	var suiveurFrequency = 100;
	var sendManifestantsData = function(){

		var manifestants = devices.manifestants();
		var participants = Object.keys(manifestants).length;
		if (participants > 0)
		{
			var avgXRate = math.avgXRate(manifestants);
			logger.debug("avgXRate : " + avgXRate);

			//avgXRate can go up to 20. The value send via osc channel must be between 0 and 1 
			var xRateValue = avgXRate / 20;
			
			var participantRate = participants / config.session.maxParticipant;
			
//			var rateValue = (xRateValue + participantRate)/2;
			logger.info("Server send OSC message '" + xRateValue + "','" + participantRate + "' on address '/manifestant'");
			
			osc.sendMessage("/manifestant", [xRateValue,participantRate]);
		}
	};

	setInterval(function() {
		sendManifestantsData();
	}, suiveurFrequency);

	//Manage active devices
	setInterval(function() {
		var currentTime = new Date().getTime();
		var activeDevices = devices.active();
		for (var key in activeDevices){
			var socket = activeDevices[key];
			var elapsedTime = currentTime - socket.time;
			
			if (elapsedTime > 1000)
			{
				logger.info("Device " + socket.index + " is not active anymore.");
				socket.active = false;
			}
		}
	}, 1000);
	
	setInterval(function() {
		//Send connection information to monitors
		logger.debug("Send connected devices to monitors");
		
		var devicesData = Object.keys(devices.connected).map(function(value) {
				var socket = devices.connected[value];
			    return { index : socket.index, id : socket.id, active : socket.active, onAir : socket.onAir, leader : socket.leader };
			});
		
		monitors.emit('connectedDevices', devicesData);
		
	}, 1000);

	//Display connection stats in the log file
	setInterval(function() {
		logger.info('**** Connection statistics ****');
		logger.info('* Connected devices  : ' + Object.keys(devices.connected).length);
		logger.info('* Active devices     : ' + Object.keys(devices.active()).length);
		logger.info('* OnAir devices     : ' + Object.keys(devices.onAir()).length);
		logger.info('* Manifestants devices     : ' + Object.keys(devices.manifestants()).length);
		logger.info('*******************************');
		
	}, 5000);
};