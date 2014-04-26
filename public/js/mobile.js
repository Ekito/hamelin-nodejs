var sampleFrequency = 100;
var tiltLR = 0;
var tiltFB = 0;
var x = 0;
var y = 0;
var z = 0;

var offsetTiltFB = 0;
var offsetTiltLR = 0;
var time = 0;
var id = -1;

var deviceOrientationStatus = document.getElementById("doEvent");
var deviceMotionStatus = document.getElementById("dmEvent");
var xElem = document.getElementById("x");
var yElem = document.getElementById("y");
var zElem = document.getElementById("z");

var socket = io.connect(document.location.host + '/devices');

socket.on('connect', function(){
	socket.emit('getId');
});

socket.on('id', function(data) {
	id = data;
	var idField = window.document.getElementById('idField');
	if (idField != null){
		idField.innerHTML = id;
	}
});

if (window.DeviceOrientationEvent) {
	
	
	if (deviceOrientationStatus != null) {
		deviceOrientationStatus.innerHTML = "DeviceOrientation";
	}
	// Listen for the deviceorientation event and handle the raw data
	window.addEventListener('deviceorientation',
			deviceOrientationListener, false);

} else if (window.OrientationEvent) {

	if (deviceOrientationStatus != null) {
	deviceOrientationStatus.innerHTML = "MozOrientation";
	}
	window.addEventListener('MozOrientation', mozOrientationListener,
			false);

} else if (deviceOrientationStatus != null) {
		deviceOrientationStatus.innerHTML = "Not supported on your device or browser.";
}

if (window.DeviceMotionEvent) {
	window.addEventListener('devicemotion', deviceMotionListener, false);
} else {
	deviceMotionStatus.innerHTML = "Not supported.";
}

function deviceOrientationListener(eventData) {

	//if device doesn't support orientation, this listener is called only once with null event
	//check http://www.html5rocks.com/en/tutorials/device/orientation/ for more details

	if (eventData.gamma == null && eventData.beta == null) {
		//deviceOrientation is not managed, deviceorientation listener is called only one time
		if (window.DeviceMotionEvent) {
			if (deviceOrientationStatus != null) {
				deviceOrientationStatus.innerHTML = "DeviceMotion";
			}
			window.addEventListener('devicemotion',
					deviceMotionListenerForOrientation, false);
		} else if (deviceOrientationStatus != null) {
			deviceOrientationStatus.innerHTML = "Not supported on your device or browser."
		}

	} else {
		// gamma is the left-to-right tilt in degrees, where right is positive
		tiltLR = Math.round(eventData.gamma);

		// beta is the front-to-back tilt in degrees, where front is positive
		tiltFB = Math.round(eventData.beta);

	}
}

function mozOrientationListener(eventData) {
	// x is the left-to-right tilt from -1 to +1, so we need to convert to degrees
	tiltLR = Math.round(eventData.x * 90);

	// y is the front-to-back tilt from -1 to +1, so we need to convert to degrees
	// We also need to invert the value so tilting the device towards us (forward) 
	// results in a positive value. 
	tiltFB = Math.round(eventData.y * -90);

}

function deviceMotionListenerForOrientation(eventData) {
	// Grab the acceleration including gravity from the results
	var accelerationIncludingGravity = eventData.accelerationIncludingGravity;

	// Z is the acceleration in the Z axis, and if the device is facing up or down
	var facingUp = -1;
	if (accelerationIncludingGravity.z > 0) {
		facingUp = +1;
	}

	// Convert the value from acceleration to degrees acceleration.x|y is the 
	// acceleration according to gravity, we'll assume we're on Earth and divide 
	// by 9.81 (earth gravity) to get a percentage value, and then multiply that 
	// by 90 to convert to degrees.                                
	tiltLR = Math.round(((accelerationIncludingGravity.x) / 9.81) * -90);
	tiltFB = Math.round(((accelerationIncludingGravity.y) / 9.81) * 90
			* facingUp);

}

function deviceMotionListener(eventData) {
	
	deviceMotionStatus.innerHTML = "DeviceMotion";
	//Acceleration and rotation will not be supported on all browsers
	// Grab the acceleration including gravity from the results
	var acceleration = eventData.accelerationIncludingGravity;
	
	x = acceleration.x;
	y = acceleration.y;
	z = acceleration.z;
	
	if (xElem != null)
	{
		xElem.innerHTML = acceleration.x;
		yElem.innerHTML = acceleration.y;
		zElem.innerHTML = acceleration.z;
	}
	
}


function deviceOrientationHandler(tiltLR, tiltFB) {

	time = Math.round(new Date().getTime());

	if (id != -1) {
		socket.emit('deviceOrientation', {
			id : id,
			time : time,
			tiltLR : tiltLR + offsetTiltLR,
			tiltFB : tiltFB + offsetTiltFB
		});
		
		
	}
}

function deviceMotionHandler(tiltLR, tiltFB) {

	time = Math.round(new Date().getTime());

	if (id != -1) {
		socket.emit('deviceMotion', {
			id : id,
			time : time,
			x : x,
			y : y,
			z : z
		});
		
		
	}
}

function calibrate() {
	offsetTiltLR = -tiltLR;
	offsetTiltFB = -tiltFB;
}

function FormatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

//Displaying and sending data to the websocket is rated in order to avoid client/server overload
setInterval(function() {
	var tiltLRElem = document.getElementById("doTiltLR");
	
	if (tiltLRElem != null) {
		tiltLRElem.innerHTML = tiltLR + offsetTiltLR;
		document.getElementById("doTiltFB").innerHTML = tiltFB + offsetTiltFB;
	}
	
	deviceOrientationHandler(tiltLR, tiltFB);
	deviceMotionHandler(x, y, z);
	
	var seconds = new Date().getSeconds();

	$( "#bg" ).css(
        'backgroundColor', "rgb(" + Math.abs(tiltFB * 2) + "," + Math.abs(tiltLR * 2) + ", " + seconds * 4 + ")"
      );
}, sampleFrequency);

function sendOSCMessage(message) {
	
	socket.emit('osc:message', {
		message : message
	});
}
