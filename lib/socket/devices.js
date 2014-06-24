'use strict';

var logger = require('../config/log'),
	config = require('../config/config'),
	osc = require('../osc/osc');

module.exports = function(io) {
	
	var monitors = io.of('/monitors');
	var devices = io.of('/devices');
	//Init the map of active devices
	devices.indexes = [];

	var session = {
			status : "ended",
			timeLimit : config.session.timeLimit,
	};
	
	var timerInterval = {};
	
	var startSession = function(){
		logger.info("Starting new session");
		session.status = "started";
		session.currentTime = 0;
		
		timerInterval = setInterval(function(){
			//Every 1 second, increment the timer
			session.currentTime++;
			
			if (session.currentTime == session.timeLimit)
			{
				stopSession();
			}
		}, 1000);
		
		populateSession();
	};
	
	var stopSession = function(){
		logger.info("Stopping session");
		session.status = "ended";
		clearInterval(timerInterval);
		
		devices.emit('session:leave');
		
		var onAirDevices = devices.onAir();
		var onAirDevicesKeys = Object.keys(onAirDevices);
		
		onAirDevicesKeys.forEach(function(key){
			var socket = devices.connected[key];
			socket.onAir = false;
		});
		
		monitors.emit('session:stopped', session);
	};
	
	var populateSession = function() {
		var activeDevices = devices.active();
		var activeDevicesKeys = Object.keys(activeDevices);
		
		activeDevicesKeys.forEach(function(key){
			var socket = devices.connected[key];
			joinSession(socket);
		});
		
	};
	
	var joinSession = function(socket){
		if (session.status == 'started' && !socket.onAir) {
			//If a slot is available, the device can join 
			if (Object.keys(devices.onAir()).length < config.session.maxParticipant){
				logger.info("Device " + socket.index + " joined the session");
				socket.onAir = true;
				socket.emit('session:join', {currentTime : session.currentTime, timeLimit : session.timeLimit, leader : socket.leader});
			}else {
				logger.warn("Too many participants. Device " + socket.index + " can not join the session.");
			}
		} else{
			logger.debug("Session not started. Device " + socket.index + " waiting for new session.");
		}
	};
	
	var setActiveSocket = function(socket){
		socket.time = new Date().getTime();
		socket.active = true;
		
		joinSession(socket);
		
	};
	
	Object.filter = function( obj, predicate) {
		var result = {}, key;

		for (key in obj) {
			if (obj.hasOwnProperty(key) && predicate(obj[key])) {
				result[key] = obj[key];
			}
		}

		return result;
	};
	
	devices.active = function(){
		return Object.filter(this.connected, function(socket){
			return socket.active;
		});
	};
	
	devices.onAir = function(){
		return Object.filter(this.connected, function(socket){
			return socket.active && socket.onAir;
		});
	};
	
	devices.manifestants = function(){
		return Object.filter(this.connected, function(socket){
			return socket.active && socket.onAir && !socket.leader;
		});
	};
	
	var getDeviceStatus = function(socket){
		return socket.onAir == true ? 'onAir' : 'pending';
	};
	
	monitors.on('connection', function(socket){
		
		socket.emit("session:info", session);
		
		socket.on('session:maxParticipants', function(data){
			
			config.session.maxParticipant = data;
			logger.info("MaxParticipant setting : " + config.session.maxParticipant);
		});
		
		socket.on('session:start', function(){
			startSession();
			monitors.emit('session:started', session);
		});
		
		socket.on('session:stop', function(){
			stopSession();
		});
		
		socket.on('leaderSelect', function(socket){
			logger.info("Leader selected : smartphone n°" + socket.index);
			devices.connected[socket.id].leader = true;
			devices.connected[socket.id].emit('device:leader', true);
		});
		
		socket.on('leaderUnselect', function(socket){
			logger.info("Leader unselected : smartphone n°" + socket.index);
			devices.connected[socket.id].leader = false;
			devices.connected[socket.id].emit('device:leader', false);
		});
		
		
	});
	
	devices.on('connection', function(socket) {

		var index = devices.indexes.push(socket.id);
		socket.index = index;
		
		logger.info("Connecting device " + index + " with ID: " + socket.id);

		socket.on('device:connect', function(data) {
			logger.info("Device " + socket.index + " connected");
			
			setActiveSocket(socket);

			socket.emit('device:id', index);
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
			
			osc.sendMessage(data.address, data.message);
		});
				
	});
	
	return devices;
};