'use strict';

module.exports = {
		session : {
			maxParticipant : 3,
			timeLimit : 30
		},
		socket : {
			port : process.env.PORT || 8080,
		},
		osc : {
			server : "192.168.5.117",
			port : 8200,
			address : "/hamelin"
		},
		log : {
			level : 'info'
		}
};