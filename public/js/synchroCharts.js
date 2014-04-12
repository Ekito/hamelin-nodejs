	var isResume = true;
	var pauseLength = 0;
	var resumeLength = 0;
	var timelineFrequency = 100;
	var resumeTime = 0;
	var pauseTime = 0;
	var lrChart;
	var fbChart;

	var socket = io.connect(document.location.host + '/monitors');
	
	window.onbeforeunload = function (e) {
		socket.emit('unregisterMonitor');
	};
	
	socket.on('connect', function () {
		console.log("Connect to socket.io");
		socket.emit('registerMonitor');
	});
	
	socket.on('standardDeviation', standardDeviationListener);
	
	$( function() {

		var playSpan = document.getElementById('play');
		playSpan.style.display = 'none';

		lrChart = createChart("lrChart", "Left-Right", "Deviation");
		fbChart = createChart("fbChart", "Front-Back", "Deviation");

		//Create default series on init
		createSerie(lrChart, "Deviation");
		createSerie(lrChart, "Average");
		createSerie(fbChart, "Deviation");
		createSerie(fbChart, "Average");
		
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

				pushData(lrChart, 1, timeInSeconds, eventData.stdDevTiltLR);
				pushData(lrChart, 2, timeInSeconds, eventData.avgTiltLR);

				pushData(fbChart, 1, timeInSeconds, eventData.stdDevTiltFB);
				pushData(fbChart, 2, timeInSeconds, eventData.avgTiltFB);

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

					refreshChart(lrChart, timeInSeconds, function(){});
					refreshChart(fbChart, timeInSeconds, function(){});
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
