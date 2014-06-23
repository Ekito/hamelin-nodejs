monitorsApp.controller('devicesMonitorCtrl', function($scope, $filter, monitorsSocket) {

	$scope.connectedDevices = [];
	$scope.participantsNb = 0;
	$scope.leaderDevice = {};
	$scope.maxParticipants = 0;
	
	monitorsSocket.on('connectedDevices', function(data){
		$scope.connectedDevices = data;
		$scope.participantsNb = $scope.connectedDevices.filter(function(device){
			return device.onAir;
		}).length;
		$scope.leaderDevice = $scope.connectedDevices.filter(function(device){
			return device.leader;
		})[0];
	});
	
	monitorsSocket.on('maxParticipants', function(data){
		$scope.maxParticipants = data;
	});
	
	$scope.sendMaxParticipants = function(maxParticipants)
	{
		monitorsSocket.emit('maxParticipants', maxParticipants);
	}
	
	$scope.selectLeader = function(device){
		monitorsSocket.emit('leaderSelect', device);
		$scope.leaderDevice = device;
	};
	
	$scope.unSelectLeader = function(){
		monitorsSocket.emit('leaderUnselect', $scope.leaderDevice);
		$scope.leaderDevice = {};
	};
});