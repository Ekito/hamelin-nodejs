var oscServerIpElem = document.getElementById("oscServerIp");
var oscServerPortElem = document.getElementById("oscServerPort");
var oscRootAddressElem = document.getElementById("oscRootAddress");

var oscAddressElem = document.getElementById("oscAddress");
var oscMessageElem = document.getElementById("oscMessage");

var socket = io.connect(document.location.host + '/monitors');

socket.on('connect', function(){
	socket.emit('osc:getParams');
});

socket.on('osc:params', function(osc){
	oscServerIpElem.value = osc.serverIp;
	oscServerPortElem.value = osc.serverPort;
	oscRootAddressElem.value = osc.rootAddress;
});

//Send OSC Server parameters to NodeJS
var updateOscServerParams = function() {
	var oscServerIp = oscServerIpElem.value;
	var oscServerPort = oscServerPortElem.value;
	var oscRootAddress = oscRootAddressElem.value;
	
	socket.emit('osc:setParams', {
		serverIp : oscServerIp,
		serverPort : oscServerPort,
		rootAddress : oscRootAddress
	});
};

var sendOSCMessage = function(message) {
	var address = oscAddressElem.value;
	var message = oscMessageElem.value;
	
	socket.emit('osc:message', {
		address : address, 
		message : message
	});
};