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
	
	socket.on('standardDeviation', standardDeviationListener);
	
	$( function() {

		var playSpan = document.getElementById('play');
		playSpan.style.display = 'none';

		lrChart = createChart("lrChart", "Left-Right", "Deviation");
		fbChart = createChart("fbChart", "Front-Back", "Deviation");

		resumeTime = new Date().getTime();

		lrChart.render();
		fbChart.render();

	});

	function standardDeviationListener(eventData) {
//		console.log("standardDeviation : left/right = " + eventData.stdDevTiltLR + " front/back = " + eventData.stdDevTiltFB);
		if (isResume) {
				var currentLength = new Date();
				currentLength.setTime(new Date().getTime() - resumeTime);
				var timeInSeconds = (currentLength.getTime() / 1000)
						+ resumeLength;

				tiltLRValue = eventData.stdDevTiltLR;
				tiltFBValue = eventData.stdDevTiltFB;

				pushData(lrChart, "Deviation", 1, timeInSeconds, tiltLRValue);
				pushData(fbChart, "Deviation", 1, timeInSeconds, tiltFBValue);

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
