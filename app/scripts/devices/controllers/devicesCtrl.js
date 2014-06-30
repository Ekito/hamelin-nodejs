devicesApp.controller('devicesCtrl', function($scope, $window, $interval, devicesSocket) {

	$scope.device = {
			id : 1,
			status : "pending", // pending, onAir
	};

	$scope.deviceOrientation = {
			enabled : false,
			sendRawData : false,
	};

	$scope.deviceMotion = {
			enabled : true,
			sendRawData : false,
	};

	$scope.prevDeviceMotion = {};
	$scope.sampleDeviceMotion = {};
	
	$scope.debug = {
			enabled : true
	};
	
	$scope.timer = {};

	$scope.platform = navigator.platform;

	var lastOscTime = new Date().getTime();

	/**
	 * Device info management
	 */
	devicesSocket.on('connect', function(){
		devicesSocket.emit('device:connect');
	});

	devicesSocket.on('reconnect', function(){
		devicesSocket.emit('device:reconnect');
	});
	
	devicesSocket.on('device:id', function(data) {
		$scope.device.id = data;
	});

	devicesSocket.on('device:leader', function(data) {
		$scope.device.leader = data;
	});

	devicesSocket.on('session:join', function(data) {
		$scope.device.status = 'onAir';
		$scope.currentTime = data.currentTime;
		$scope.timeLimit = data.timeLimit;
		$scope.device.leader = data.leader;
		
		$('.timer')
		.trigger(
				'configure',
				{
					"max":$scope.timeLimit
				});
		
		startTimer();
	});

	devicesSocket.on('session:leave', function() {
		stopTimer();
		$scope.device.status = 'pending';
		$scope.currentTime = 0;
	});
	
	/**
	 * Timer (Knob) settings
	 */
	$scope.knobOptions = {
			'width':100,
			'skin': 'tron',
			'thickness': .2,
			'displayInput': false,
			'readOnly': true
	};

	var startTimer = function() {
		$scope.timer = $interval(function() {
				$scope.currentTime++;

				if ($scope.currentTime == $scope.timeLimit)
				{
					stopTimer();
				}
		}, 1000, 0, true);
	};
	
	var stopTimer = function() {
		$interval.cancel($scope.timer);
		$scope.device.status = 'pending';
		$scope.currentTime = 0;
	};

	/*****************************************************************
	 * Device Orientation management
	 */

	var deviceMotionListenerForOrientation = function(eventData) {
		$scope.$apply(function(){
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
			$scope.deviceOrientation.tiltLR = Math.round(((accelerationIncludingGravity.x) / 9.81) * -90);
			$scope.deviceOrientation.tiltFB = Math.round(((accelerationIncludingGravity.y) / 9.81) * 90
					* facingUp);

			$scope.deviceOrientation.time = Math.round(new Date().getTime());
		});

	};

	var deviceOrientationListener = function (eventData) {
		$scope.$apply(function(){

			//if device doesn't support orientation, this listener is called only once with null event
			//check http://www.html5rocks.com/en/tutorials/device/orientation/ for more details
			if (eventData.gamma == null && eventData.beta == null) {
				//deviceOrientation is not managed, deviceorientation listener is called only one time
				if ($window.DeviceMotionEvent) {
					if ($scope.deviceOrientation.status != null) {
						$scope.deviceOrientation.status = "CompatibilityMode";
					}
					$window.addEventListener('devicemotion',
							deviceMotionListenerForOrientation, false);
				} else if ($scope.deviceOrientation.status != null) {
					$scope.deviceOrientation.status = "Not supported on your device or browser.";
				}

			} else {
				// gamma is the left-to-right tilt in degrees, where right is positive
				$scope.deviceOrientation.tiltLR = Math.round(eventData.gamma);

				// beta is the front-to-back tilt in degrees, where front is positive
				$scope.deviceOrientation.tiltFB = Math.round(eventData.beta);

				$scope.deviceOrientation.time = Math.round(new Date().getTime());
			}
		});
	};

	var mozOrientationListener = function(eventData) {
		$scope.$apply(function(){
			// x is the left-to-right tilt from -1 to +1, so we need to convert to degrees
			$scope.deviceOrientation.tiltLR = Math.round(eventData.x * 90);

			// y is the front-to-back tilt from -1 to +1, so we need to convert to degrees
			// We also need to invert the value so tilting the device towards us (forward) 
			// results in a positive value. 
			$scope.deviceOrientation.tiltFB = Math.round(eventData.y * -90);

			$scope.deviceOrientation.time = Math.round(new Date().getTime());
		});
	};


	$scope.enableDeviceOrientation = function() {
		if ($window.DeviceOrientationEvent) {

			$scope.deviceOrientation.status = "DeviceOrientation";
			$window.addEventListener('deviceorientation', deviceOrientationListener, false);

		} else if ($window.OrientationEvent) {

			$scope.deviceOrientation.status = "MozOrientation";
			$window.addEventListener('MozOrientation', mozOrientationListener, false);

		} else if (deviceOrientationStatus != null) {
			$scope.deviceOrientation.status = "Not supported on your device or browser.";
		}
	};

	if ($scope.deviceOrientation.enabled)
	{
		$scope.enableDeviceOrientation();
	}

	/*****************************************************************
	 * Device Motion management
	 */
	function deviceMotionListener(eventData) {
		$scope.$apply(function(){
			$scope.deviceMotion.status = "DeviceMotion";
			//Acceleration and rotation will not be supported on all browsers
			// Grab the acceleration including gravity from the results
			var acceleration = eventData.accelerationIncludingGravity;
			
			//Acceleration is null on some Android devices
//			var acceleration = eventData.acceleration;
			
			//Keep previous values
			$scope.prevDeviceMotion = angular.copy($scope.deviceMotion);

			$scope.deviceMotion.x = acceleration.x;
			$scope.deviceMotion.y = acceleration.y;
			$scope.deviceMotion.z = acceleration.z;

			$scope.deviceMotion.time = Math.round(new Date().getTime());
		});
	}

	$scope.enableDeviceMotion = function() {
		if ($window.DeviceMotionEvent) {
			$window.addEventListener('devicemotion', deviceMotionListener, false);
		} else {
			$scope.deviceMotion.status = "Not supported.";
		}
	};

	//Detect percussion movement
	var detectPercussion = function(){
		var xratioThreshold = 0.15;
		var xrange = $scope.deviceMotion.x - $scope.prevDeviceMotion.x;
		var timerange = $scope.deviceMotion.time - $scope.prevDeviceMotion.time;

		if (navigator.platform == "iPhone" || navigator.platform == "iPad")
		{
			xrange = xrange / 2.5;
		}
		
		var xratio = xrange/timerange;

		var oscTime = new Date().getTime();

		if ($scope.deviceMotion.x > 14
				&& oscTime - lastOscTime > 100
				&& xratio > xratioThreshold)
		{				
			devicesSocket.osc("/menant", [xratio]);
			lastOscTime = oscTime;
		}
	};

	var sendXRate = function(motion)
	{
		var xrange = $scope.deviceMotion.x - $scope.sampleDeviceMotion.x;
		
		$scope.sampleDeviceMotion = angular.copy($scope.deviceMotion);
		
		//iPhone deviceMotion data must be factored because motionRange can be multiplied by 3
		//compared to other devices
		if (navigator.platform == "iPhone" || navigator.platform == "iPad")
		{
			xrange = xrange / 2.5;
		}

		devicesSocket.emit('deviceMotionRate', Math.abs(xrange));
	};

	//Send data in real-time. Comment this if sending orientation data must be async.
	$scope.$watch('deviceMotion.time', function(newValue, oldValue){

		if ($scope.device.leader){
			detectPercussion();
		}
	});

	if ($scope.deviceMotion.enabled)
	{
		$scope.enableDeviceMotion();
	}


	//Device motion data are sampled every 100ms,
	//because some devices send more data than others
	setInterval(function() {

		if ($scope.device.id != -1) {

			sendXRate($scope.deviceMotion);

			if ($scope.deviceMotion.sendRawData){
				devicesSocket.emit('deviceMotion', {
					id : $scope.device.id,
					time : $scope.deviceMotion.time,
					x : $scope.deviceMotion.x,
					y : $scope.deviceMotion.y,
					z : $scope.deviceMotion.z
				});
			}

			if ($scope.deviceOrientation.sendRawData){
				devicesSocket.emit('deviceOrientation', {
					id : $scope.device.id,
					time : $scope.deviceOrientation.time,
					tiltLR : $scope.deviceOrientation.tiltLR,
					tiltFB : $scope.deviceOrientation.tiltFB
				});
			}
		}
	},100);
});
