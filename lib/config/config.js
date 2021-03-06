'use strict';

module.exports = {
		session : {
			maxParticipant : 20,
			timeLimit : 270
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