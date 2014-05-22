'use strict';

module.exports = function(io){
	var tests = io.of('/test');
	tests.on('connection', function(socket){
		
		socket.on('ping', function(data) {
			socket.emit('pong', data);
		});
	});
};