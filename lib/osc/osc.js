'use strict';

var oscMin = require('osc-min');
var dgram = require('dgram');
var udp = dgram.createSocket("udp4");
var config = require('../config/config');

exports.sendMessage = function(address, message) {
	var buf;
	buf = oscMin.toBuffer({
		address : config.osc.address + (address ? address : ""),
		args : message
	});
	return udp.send(buf, 0, buf.length, config.osc.port, config.osc.server);
};