'use strict';

module.exports = {
		session : {
			maxParticipant : 5,
			timeLimit : 1000
		},
		socket : {
			port : process.env.PORT || 8080,
		},
		osc : {
			server : "192.168.5.109",
			port : 8200,
			address : "/hamelin"
		},
		log : {
			level : 'info'
		}
};