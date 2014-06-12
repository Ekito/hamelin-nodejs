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
	var devices = require('./devices')(io);
	
	require('./ping')(io);

	//Send "suiveur" data
	var suiveurFrequency = 100;
	var sendSuiveurData = function(){

		var activeDevices = devices.active();
		var participants = Object.keys(activeDevices).length;
		if (participants > 0)
		{
			var avgXRate = math.avgXRate(activeDevices);
			logger.debug("avgXRate : " + avgXRate);

			//avgXRate can go up to 20. The value send via osc canal must be between 0 and 1 
			var xRateValue = avgXRate / 20;
			
			var participantRate = participants / config.session.maxParticipant;
			
			var rateValue = (xRateValue + participantRate)/2;
			logger.debug("Server send OSC message '" + rateValue + "' on address '/suiveur'");
			
			logger.debug("Value : " + rateValue);
			osc.sendMessage("/suiveur", rateValue);
		}
	};

	setInterval(function() {
		sendSuiveurData();
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
				socket.onAir = false;
			}
		}
	}, 1000);
	
	//Display connection stats in the log file
	setInterval(function() {
		logger.info('**** Connection statistics ****');
		logger.info('* Connected devices  : ' + Object.keys(devices.connected).length);
		logger.info('* Active devices     : ' + Object.keys(devices.active()).length);
		logger.info('* OnAir devices     : ' + Object.keys(devices.onAir()).length);
		logger.info('*******************************');
	}, 5000);

};