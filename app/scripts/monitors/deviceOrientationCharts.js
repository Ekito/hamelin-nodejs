	var isResume = true;
	var pauseLength = 0;
	var resumeLength = 0;
	var timelineFrequency = 100;
	var resumeTime = 0;
	var pauseTime = 0;
	var lrChart;
	var fbChart;
	var devices = [];
	
	var socket = io.connect(document.location.host + '/monitors', {'sync disconnect on unload' : true});
	
	socket.on('connect', function () {
		console.log("Connect to socket.io");
	});
	
	socket.on('deviceOrientation', deviceOrientationListener);
	
	$( function() {

		var playSpan = document.getElementById('play');
		playSpan.style.display = 'none';

		lrChart = createChart("lrChart", "Left-Right", "Orientation", "°");
		fbChart = createChart("fbChart", "Front-Back", "Orientation", "°");

		resumeTime = new Date().getTime();

		lrChart.render();
		fbChart.render();

	});

	function deviceOrientationListener(eventData) {
//		console.log("deviceOrientation for mobile : " + eventData.id);
		if (isResume) {
			var id = eventData.id;

			if (id != 0) {
				var currentLength = new Date();
				currentLength.setTime(new Date().getTime() - resumeTime);
				var timeInSeconds = (currentLength.getTime() / 1000)
						+ resumeLength;

				tiltLRValue = eventData.tiltLR;
				tiltFBValue = eventData.tiltFB;

				var device = null; 
				devices.map(function(element){
					if (element.id == id) {
						device = element;
					}
				});
				
				if (device == null)
				{
					var deviceName = "Smartphone " + id;
					index = createSerie(lrChart, deviceName);
					index = createSerie(fbChart, deviceName);
					
					device = {id: id, index:index, name: deviceName };
					devices.push(device);
				}
				pushData(lrChart, device.index, timeInSeconds, tiltLRValue);
				pushData(fbChart, device.index, timeInSeconds, tiltFBValue);

			}
		}
	};
	
	//Refresh the chart every timelineFrequency
	setInterval(
			function() {
				if (isResume) {
					
					var currentLength = new Date().getTime() - resumeTime;
					var timeInSeconds = (currentLength / 1000)
							+ resumeLength;

					refreshChart(lrChart, timeInSeconds, purgeInactiveDevice);
					refreshChart(fbChart, timeInSeconds, purgeInactiveDevice);
				}
			}, timelineFrequency
	);

	var purgeInactiveDevice = function(chart, index){
		//Purge data when they doesn't exists anymore 
		if (chart.options.data[index] != null
				&& chart.options.data[index].dataPoints.length == 0) {
			chart.options.data.splice(index,1);
			
			//Remove the device 
			devices.map(function(element, i){
				if (element.index == index) {
					devices.splice(i);
				}
			});
			
		}
		
	};
	
	function pause() {
		isResume = false;
		pauseTime = new Date().getTime();
		resumeLength = resumeLength + (pauseTime - resumeTime) / 1000;
		togglePauseResume();
	};

	function resume() {
		resumeTime = new Date().getTime();
		pauseLength = pauseLength + (pauseLength + resumeTime - pauseTime) / 1000;
		isResume = true;
		togglePauseResume();
	};

	function togglePauseResume() {
		var playSpan = document.getElementById('play');
		playSpan.style.display = playSpan.style.display == 'none' ? 'block'
				: 'none';
		var pauseSpan = document.getElementById('pause');
		pauseSpan.style.display = pauseSpan.style.display == 'none' ? 'block'
				: 'none';

	};
