monitorsApp.controller('devicesMonitorCtrl', function($scope, monitorsSocket) {

	$scope.connectedDevices = [];
	
	monitorsSocket.on('connectedDevices', function(data){
		$scope.connectedDevices = data;
	});
	
});