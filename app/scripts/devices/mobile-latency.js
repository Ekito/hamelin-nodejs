var pings = [];

var minLatencyElem = document.getElementById("minLatency");
var maxLatencyElem = document.getElementById("maxLatency");
var avgLatencyElem = document.getElementById("avgLatency");

var socket = io.connect(document.location.host + '/test');

socket.on('connect', function(){
	var i = 1;
	//Send ping every 100ms
	var pingInterval = setInterval(function() {
		pings[i] = {};
		pings[i].start = new Date().getTime();
		socket.emit('ping', i);
		i++;
	}, 100);
	
	setTimeout(function(){
		clearInterval(pingInterval);
		displayResults();
	},10000);
});

socket.on('pong', function(idx) {
	pings[idx].stop = new Date().getTime();
});

var displayResults = function(){
	
	var latencies = pings.map(function(data){
		return data.stop - data.start;
	});
	console.log(latencies);
	delete latencies[1];
	console.log(latencies);
	
	var min = latencies.reduce(function(a, b) { return Math.min(a,b); });
	var max = latencies.reduce(function(a, b) { return Math.max(a,b); });
	var sum = latencies.reduce(function(a, b) { return a + b; });
	var avg = sum / latencies.length;
	
	minLatencyElem.innerHTML = min;
	maxLatencyElem.innerHTML = max;
	avgLatencyElem.innerHTML = avg;
};
