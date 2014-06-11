'use strict';

var logger = require('../config/log'),
	config = require('../config/config'),
	osc = require('../osc/osc');

module.exports = function(io) {
	
	var monitors = io.of('/monitors');
	var devices = io.of('/devices');
	//Init the map of active devices
	devices.active = {};
	devices.onAir = {};
	devices.indexes = [];

	var session = {
			status : "ended"
	};
	
	var startSession = function(endSession){
		logger.info("Starting new session");
		session.status = "started";
		session.currentTime = 0;
		
		var interval = setInterval(function(){ 
			session.currentTime++;
		}, 1000);
		
		setTimeout(function(){
			clearInterval(interval);
			endSession();
		}, config.session.timeLimit * 1000);
	};
	
	var joinSession = function(socket){
		
		socket.meneur = false;
		//If no session running, start a new one
		if (session.status == "ended"){
			startSession(function(){
				logger.info("Ending session");
				session.status = "ended";
				devices.onAir = {}; 
				socket.emit('device:endSession');
			});
			socket.meneur = true;
		}
		logger.info("Device " + socket.index + " joined the session");
		devices.onAir[socket.id] = socket;
		socket.emit('device:joinSession', {currentTime : session.currentTime, timeLimit : config.session.timeLimit, meneur : socket.meneur});
	};
	
	var setActiveSocket = function(socket){
		socket.time = new Date().getTime();
		devices.active[socket.id] = socket;
	};
	
	devices.on('connection', function(socket) {

		var index = devices.indexes.push(socket.id);
		socket.index = index;
		
		logger.info("Connecting device " + index + " with ID: " + socket.id);

		socket.on('device:connect', function(data) {
			logger.info("Device " + socket.index + " connected");
			
			setActiveSocket(socket);

			socket.emit('device:id', index);
			
			//If a slot is available, the device can join automatically 
			if (Object.keys(devices.onAir).length < config.session.maxParticipant){
				joinSession(socket);
			}else {
				logger.warn("Too many participants. Device " + socket.index + " can not join the session");
			}
	
		});
		
		socket.on('deviceOrientation', function(data) {
			logger.debug('Receive deviceOrientation');
			
			//Filter devices in sleep mode.
			//Sometimes data are send to the server even if not active
			//In this case, orientation data are not changed
			if (socket.tiltLR != data.tiltLR) {
				setActiveSocket(socket);
				
				socket.tiltLR = data.tiltLR;
				socket.tiltFB = data.tiltFB;
				
				monitors.emit('deviceOrientation', data);
			}
		});
		
		socket.on('deviceMotion', function(data) {
			logger.debug('Receive deviceMotion');

			//Filter devices in sleep mode.
			//Sometimes data are send to the server even if not active
			//In this case, motion data are not changed
			if (socket.x != data.x) {
				setActiveSocket(socket);
	
				socket.x = data.x;
				socket.y = data.y;
				socket.z = data.z;
				
				monitors.emit('deviceMotion', data);
			}
		});

		socket.on('deviceMotionRate', function(data){
			logger.debug('Receive deviceMotionRate : ' + data);
			
			setActiveSocket(socket);

			socket.xRate = data;
			
		});
		
		socket.on('osc:message', function(data) {
			logger.info("Device send OSC message '" + data.message + "' on address '" + data.address + "'");
			
//			setActiveSocket(socket);
			
			osc.sendMessage(data.address, data.message);
		});
				
	});
	
	return devices;
};