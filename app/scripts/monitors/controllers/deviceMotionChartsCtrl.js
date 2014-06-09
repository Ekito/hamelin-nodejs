monitorsApp.controller('deviceMotionChartsCtrl', function($scope, $interval, monitorsSocket, chartFactory) {

	$scope.chartsControls = {
			isResume : true,
			pauseLength : 0,
			resumeLength : 0,
			timelineFrequency : 100,
			resumeTime : new Date().getTime(),
			pauseTime : 0,
			devices : [],
	};
	
	$scope.xChart = chartFactory.createChart("xChart", "X", "Motion", "");
	$scope.yChart = chartFactory.createChart("yChart", "Y", "Motion", "");
	$scope.zChart = chartFactory.createChart("zChart", "Z", "Motion", "");
	
	$scope.xChart.render(); //render the chart for the first time
	$scope.yChart.render(); //render the chart for the first time
	$scope.zChart.render(); //render the chart for the first time

	monitorsSocket.on('connect', function () {
		console.log("Connect to socket.io");
	});

	monitorsSocket.on('deviceMotion', deviceMotionListener);

	function deviceMotionListener(eventData) {
//		console.log("deviceOrientation for mobile : " + eventData.id);
			if ($scope.chartsControls.isResume) {
				var id = eventData.id;
	
				if (id != 0) {
					var currentLength = new Date();
					currentLength.setTime(new Date().getTime() - $scope.chartsControls.resumeTime);
					var timeInSeconds = (currentLength.getTime() / 1000)
					+ $scope.chartsControls.resumeLength;
	
					var device = null;
					$scope.chartsControls.devices.map(function(element){
						if (element.id == id) {
							device = element;
						}
					});
	
					if (device == null)
					{
						var deviceName = "s" + id;
						index = chartFactory.createSerie($scope.xChart, deviceName);
						index = chartFactory.createSerie($scope.yChart, deviceName);
						index = chartFactory.createSerie($scope.zChart, deviceName);
	
						device = {id: id, index:index, name: deviceName };
						$scope.chartsControls.devices.push(device);
					}
					chartFactory.pushData($scope.xChart, device.index, timeInSeconds, eventData.x);
					chartFactory.pushData($scope.yChart, device.index, timeInSeconds, eventData.y);
					chartFactory.pushData($scope.zChart, device.index, timeInSeconds, eventData.z);
	
					$scope.xChart.render();
					$scope.yChart.render();
					$scope.zChart.render();
				}
			}
	};
	
	//Refresh the chart every timelineFrequency
	$interval(
			function() {
				if ($scope.chartsControls.isResume) {
					
					var currentLength = new Date().getTime() - $scope.chartsControls.resumeTime;
					var timeInSeconds = (currentLength / 1000)
							+ $scope.chartsControls.resumeLength;

					chartFactory.refreshChart($scope.xChart, timeInSeconds);
					chartFactory.refreshChart($scope.yChart, timeInSeconds);
					chartFactory.refreshChart($scope.zChart, timeInSeconds);
				}
			}, $scope.chartsControls.timelineFrequency
	);
	
	$scope.pause = function() {
		$scope.chartsControls.pauseTime = new Date().getTime();
		$scope.chartsControls.resumeLength = $scope.chartsControls.resumeLength + ($scope.chartsControls.pauseTime - $scope.chartsControls.resumeTime) / 1000;
		$scope.chartsControls.isResume = false;
	};

	$scope.resume = function() {
		$scope.chartsControls.resumeTime = new Date().getTime();
		$scope.chartsControls.pauseLength = $scope.chartsControls.pauseLength + ($scope.chartsControls.pauseLength + $scope.chartsControls.resumeTime - $scope.chartsControls.pauseTime) / 1000;
		$scope.chartsControls.isResume = true;
	};

});
