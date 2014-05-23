devicesApp.controller('devicesCtrl', function($scope, $window) {

	$scope.deviceSocket = {
			id : 1,
			status : "onAir",
			socket : {}
	};
	
	/**
	 * Timer (Knob) settings
	 */
	$scope.data = 1;
	$scope.max = 60;
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
		    	$scope.data++;
		    	
		    	if ($scope.data == 60)
				{
			    	clearInterval(timer);
			    	$scope.deviceSocket.status = "pending";
				}
	    	});
	    	
	    }, 1000);
    };
    
});
