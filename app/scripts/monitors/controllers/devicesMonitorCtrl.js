monitorsApp.controller('devicesMonitorCtrl', function($scope, $interval, monitorsSocket) {

	$scope.connectedDevices = [];
	$scope.participantsNb = 0;
	$scope.leaderDevice = {};
	$scope.maxParticipants = 0;
	$scope.session = {
			status : "ended",
			currentTime : 0,
	}
	$scope.timer = {};
	
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
	
	monitorsSocket.on('connectedDevices', function(data){
		$scope.connectedDevices = data;
		$scope.participantsNb = $scope.connectedDevices.filter(function(device){
			return device.onAir;
		}).length;
		$scope.leaderDevice = $scope.connectedDevices.filter(function(device){
			return device.leader;
		})[0];
	});
	
	monitorsSocket.on('session:maxParticipants', function(data){
		$scope.maxParticipants = data;
	});
	
	monitorsSocket.on('session:info', function(data){
		$scope.session = data;
		$('.timer')
		.trigger(
				'configure',
				{
					"max":data.timeLimit
				});
		if ($scope.session.status == "started" && !$scope.timer.started)
		{
			startTimer();
		}
	});

	monitorsSocket.on('session:started', function(data){
		$scope.session = data;
		$('.timer')
		.trigger(
				'configure',
				{
					"max":data.timeLimit
				});
		startTimer();
	});
	
	monitorsSocket.on('session:stopped', function(data){
		$scope.session = data;
		stopTimer();
	});
	
	$scope.sendMaxParticipants = function(maxParticipants)
	{
		monitorsSocket.emit('session:maxParticipants', maxParticipants);
	};
	
	$scope.selectLeader = function(device){
		monitorsSocket.emit('leaderSelect', device);
		$scope.leaderDevice = device;
	};
	
	$scope.unSelectLeader = function(){
		monitorsSocket.emit('leaderUnselect', $scope.leaderDevice);
		$scope.leaderDevice = {};
	};
	
	var startTimer = function() {
		$scope.timer.started = true;
		$scope.timer.interval = $interval(function(){
				$scope.session.currentTime++;

				if ($scope.session.currentTime == $scope.session.timeLimit)
				{
					stopTimer();
				}
		}, 1000, 0, true);
	};
	
	var stopTimer = function() {
		$interval.cancel($scope.timer.interval);
		$scope.timer.started = false;
		$scope.session.status = "ended";
		$scope.session.currentTime = 0;
	}

	$scope.startSession = function(){
		monitorsSocket.emit('session:start');
	};
		
	$scope.stopSession = function(){
		monitorsSocket.emit('session:stop');
	};
});