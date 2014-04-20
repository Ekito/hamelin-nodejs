var oscMin = require('osc-min');
var dgram = require('dgram');
var udp = dgram.createSocket("udp4");

exports.serverIp = "192.168.1.101";
exports.serverPort = 8200;
exports.rootAddress = "/hamelin/test";

exports.sendMessage = function(address, message) {
	var buf;
	buf = oscMin.toBuffer({
		address : this.rootAddress + address,
		args : [ message ]
	});
	return udp.send(buf, 0, buf.length, this.serverPort, this.serverIp);
};