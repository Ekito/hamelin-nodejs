devicesApp.controller('devicesCtrl', function($scope, $window, $interval, devicesSocket) {

	$scope.device = {
			id : 1,
			status : "pending", // pending, ready, onAir
	};
	
	$scope.deviceOrientation = {
			enabled : false,
			sendRawData : true,
	};

	$scope.deviceMotion = {
			enabled : true,
			sendRawData : true,
	};

	$scope.prevDeviceMotion = {};
	
	$scope.debug = {
			enabled : true
	};
	
	var lastOscTime = new Date().getTime();
	
	/**
	 * Device info management
	 */
	devicesSocket.on('connect', function(){
		devicesSocket.emit('device:connect');
	});

	devicesSocket.on('device:id', function(data) {
		$scope.device.id = data;
	});
	
	devicesSocket.on('device:joinSession', function(data) {
		$scope.device.status = "onAir";
		$scope.currentTime = data.currentTime;
		$scope.timeLimit = data.timeLimit;
		$scope.device.meneur = data.meneur;
		$('.timer')
	    .trigger(
	        'configure',
	        {
	        "max":$scope.timeLimit
	        });
		$scope.startTimer();
	});
	
	/**
	 * Timer (Knob) settings
	 */
    $scope.knobOptions = {
      'width':150,
      'skin': 'tron',
      'thickness': .2,
      'displayInput': false,
      'readOnly': true
    };
    
    $scope.startTimer = function() {
	    var timer = setInterval(function() {
	    	$scope.$apply(function(){
		    	$scope.currentTime++;
		    	
		    	if ($scope.currentTime == $scope.timeLimit)
				{
			    	clearInterval(timer);
			    	$scope.device.status = "pending";
				}
	    	});
	    	
	    }, 1000);
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
    
    //Send data in real-time. Comment this if sending orientation data must be async.
    $scope.$watch('deviceOrientation.time', function(newValue, oldValue){
		if ($scope.device.id != -1) {
			devicesSocket.emit('deviceOrientation', {
				id : $scope.device.id,
				time : $scope.deviceOrientation.time,
				tiltLR : $scope.deviceOrientation.tiltLR,
				tiltFB : $scope.deviceOrientation.tiltFB
			});
		}
    });
    
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
    	var xratioThreshold = 0.2;
	    var xrange = $scope.deviceMotion.x - $scope.prevDeviceMotion.x;
		var timerange = $scope.deviceMotion.time - $scope.prevDeviceMotion.time;
		
		var xratio = xrange/timerange;
		
		var oscTime = new Date().getTime();
		
		if ($scope.deviceMotion.x > 15
				&& oscTime - lastOscTime > 500
				&& xratio > xratioThreshold)
		{				
				devicesSocket.osc("/meneur", [1]);
				lastOscTime = oscTime;
		}
	};
    
	var sendXRate = function(motion)
	{
		var xrange = $scope.deviceMotion.x - $scope.prevDeviceMotion.x;
//		var timerange = $scope.deviceMotion.time - $scope.prevDeviceMotion.time;
		
//		var xratio = xrange/timerange;
	
		devicesSocket.emit('deviceMotionRate', Math.abs(xrange));
	};
	
    //Send data in real-time. Comment this if sending orientation data must be async.
    $scope.$watch('deviceMotion.time', function(newValue, oldValue){
		
    	if ($scope.device.meneur){
    		detectPercussion();
    	}
    	
    	if ($scope.device.id != -1) {
			
    		sendXRate($scope.deviceMotion);
			
    		if ($scope.deviceMotion.sendRawData)
    		{
	    		devicesSocket.emit('deviceMotion', {
					id : $scope.device.id,
					time : $scope.deviceMotion.time,
					x : $scope.deviceMotion.x,
					y : $scope.deviceMotion.y,
					z : $scope.deviceMotion.z
				});
    		}
		}
    });

    if ($scope.deviceMotion.enabled)
	{
    	$scope.enableDeviceMotion();
	}
    
});
