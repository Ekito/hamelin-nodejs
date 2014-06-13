monitorsApp.controller('devicesMonitorCtrl', function($scope, $filter, monitorsSocket) {

	$scope.connectedDevices = [];
	$scope.leaderDevice = {};
	
	monitorsSocket.on('connectedDevices', function(data){
		$scope.connectedDevices = data;
		$scope.leaderDevice = $scope.connectedDevices.filter(function(device){
			return device.leader;
		})[0];
	});
	
	$scope.selectLeader = function(device){
		$scope.leaderDevice = device;
		monitorsSocket.emit('leaderSelect', $scope.leaderDevice);
	};
	
	$scope.unSelectLeader = function(){
		monitorsSocket.emit('leaderUnselect', $scope.leaderDevice);
		$scope.leaderDevice = {};
	};
});