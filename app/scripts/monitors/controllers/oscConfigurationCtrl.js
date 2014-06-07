monitorsApp.controller('oscConfigurationCtrl', function($scope, $window, $interval, monitorsSocket) {

	$scope.osc = {
			serverIp : "",
			serverPort : 0,
			rootAddress : ""
	};
	
	monitorsSocket.on('connect', function(){
		monitorsSocket.emit('osc:getParams');
	});
	
	monitorsSocket.on('osc:params', function(osc){
		$scope.osc = osc;
	});

	//Send OSC Server parameters to NodeJS
	$scope.updateOscServerParams = function() {
		monitorsSocket.emit('osc:setParams', $scope.osc);
	};

	$scope.sendOSCMessage = function(address, message) {
	
		monitorsSocket.emit('osc:message', {
			address : address, 
			message : message
		});
};

});