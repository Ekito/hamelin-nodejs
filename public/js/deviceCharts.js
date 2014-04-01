	var isResume = true;
	var pauseLength = 0;
	var resumeLength = 0;
	var timelineFrequency = 100;
	var resumeTime = 0;
	var pauseTime = 0;
	var lrChart;
	var fbChart;

	var socket = io.connect(document.location.host);
	socket.emit('registerMonitor');
	
	window.onbeforeunload = function (e) {
		socket.emit('unregisterMonitor');
	};
	
	socket.on('deviceOrientation', deviceOrientationListener);
	
	$( function() {

		var playSpan = document.getElementById('play');
		playSpan.style.display = 'none';

		lrChart = createChart("lrChart", "Left-Right", "Orientation");
		fbChart = createChart("fbChart", "Front-Back", "Orientation");

		resumeTime = new Date().getTime();

		lrChart.render();
		fbChart.render();

	});

	function deviceOrientationListener(eventData) {
		console.log("deviceOrientation for mobile : " + eventData.id);
		if (isResume) {
			var id = eventData.id;

			if (id != 0) {
				var currentLength = new Date();
				currentLength.setTime(new Date().getTime() - resumeTime);
				var timeInSeconds = (currentLength.getTime() / 1000)
						+ resumeLength;

				tiltLRValue = eventData.tiltLR;
				tiltFBValue = eventData.tiltFB;

				pushData(lrChart, "Smartphone " + id, id, timeInSeconds, tiltLRValue);
				pushData(fbChart, "Smartphone " + id, id, timeInSeconds, tiltFBValue);

			}
		}
	};
	
	//Refresh the chart every timelineFrequency
	setInterval(
			function() {
				if (isResume) {
					var currentLength = new Date();
					currentLength.setTime(new Date().getTime() - resumeTime);
					var timeInSeconds = (currentLength.getTime() / 1000)
							+ resumeLength;

					refreshChart(lrChart, timeInSeconds);
					refreshChart(fbChart, timeInSeconds);
				}
			}, timelineFrequency);

	function pause() {
		isResume = false;
		pauseTime = new Date().getTime();
		var resumeLengthDate = new Date();
		resumeLengthDate.setTime(pauseTime - resumeTime);
		resumeLength = resumeLength + resumeLengthDate.getTime() / 1000;
		togglePauseResume();
	};

	function resume() {
		resumeTime = new Date().getTime();
		var pauseLengthDate = new Date();
		pauseLengthDate.setTime(pauseLength + resumeTime - pauseTime);
		pauseLength = pauseLength + pauseLengthDate.getTime() / 1000;
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
