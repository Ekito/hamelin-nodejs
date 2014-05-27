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
	
	require('./ping')(io);

	/**
	 * Statistics
	 */
	//Send standardDeviation data
	//Uncomment to activate
//	var statsFrequency = 300;
//	var sendStandardDeviation = function(){
//
//		var stdDev = math.standardDeviation(devices.active);
//		stdDev["time"] = new Date().getTime();
//		monitors.emit('standardDeviation', stdDev);
//		
//	};
//
//	setInterval(function() {
//		sendStandardDeviation();
//	}, statsFrequency);
	
	//Send "suiveur" data
	var suiveurFrequency = 100;
	var sendSuiveurData = function(){

		var participants = Object.keys(devices.active).length;
		if (participants > 0)
		{
			var avgXRate = math.avgXRate(devices.active);
			logger.debug("avgXRate : " + avgXRate);
			var logXRate = Math.log(((avgXRate + 1) * 5)) / 6;
			logger.debug("logXRate : " + logXRate);
			
			logger.debug("participants : " + participants);
			logger.debug("participants rate : " + participants / config.session.maxParticipant * 10);
			var logParticipant = Math.log(participants / config.session.maxParticipant * 10) / 2;
			
			logger.info("Server send OSC message '" + [logXRate, logParticipant] + "' on address '/suiveur'");
			
			osc.sendMessage("/suiveur", [logXRate, logParticipant]);
		}
	};

	setInterval(function() {
		sendSuiveurData();
	}, suiveurFrequency);

	//Manage active devices
	setInterval(function() {
		var currentTime = new Date().getTime();
		for (var key in devices.active){
			var socket = devices.active[key];
			var elapsedTime = currentTime - socket.time;
			
			if (elapsedTime > 1000)
			{
				logger.info("Device " + socket.index + " is not active. Removed from the list of active devices");
				delete devices.active[key];
				
			}
		}
	}, 1000);
	
	//Display connection stats in the log file
	setInterval(function() {
		logger.info('**** Connection statistics ****');
		logger.info('* Connected devices  : ' + Object.keys(devices.connected).length);
		logger.info('* Active devices     : ' + Object.keys(devices.active).length);
		logger.info('* Connected monitors : ' + Object.keys(monitors.connected).length);
		logger.info('*******************************');
	}, 5000);

};