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
	
	socket.on('deviceOrientation', deviceOrientationListener);
	
	socket.on('standardDeviation', standardDeviationListener);
	
	$( function() {

		var playSpan = document.getElementById('play');
		playSpan.style.display = 'none';

		lrChart = createOrientationChart("lrChart", "Left-Right");
		fbChart = createOrientationChart("fbChart", "Front-Back");

		resumeTime = new Date().getTime();

		lrChart.render();
		fbChart.render();

	});

	function createOrientationChart(chartName, title) {
		var orientationChart = new CanvasJS.Chart(chartName, {
			zoomEnabled : true,
			title : {
				text : title
			},
			toolTip : {
				shared : true
			},
			legend : {
				verticalAlign : "top",
				horizontalAlign : "center",
				fontSize : 14,
				fontWeight : "bold",
				fontFamily : "calibri",
				fontColor : "dimGrey"
			},
			axisX : {
				title : "Time",
				margin : 20,
				suffix : "s",
				titleFontSize : 14,
			},
			axisY : {
				title : "Orientation",
				margin : 20,
				suffix : "°",
				titleFontSize : 14,
			},
			data : [ {
				markerType : "none",
				type : "spline",
				xValueType : "number",
				showInLegend : false,
				name : "Timeline",
				dataPoints : []
			} ]
		});

		return orientationChart;
	};

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

				pushData(lrChart, id, timeInSeconds, tiltLRValue);
				pushData(fbChart, id, timeInSeconds, tiltFBValue);

			}
		}
	};
	
	function standardDeviationListener(eventData) {
		console.log("standardDeviation : tiltLR = " + eventData.stdDevTiltLR + ", tiltFB = " + eventData.stdDevTiltFB + ", time = " + eventData.time);
	};

	function pushData(chart, id, xValue, yValue) {
		if (chart.options.data[id] == null) {
			chart.options.data[id] = {
				// dataSeries n°id
				markerType : "circle",
				type : "spline",
				xValueType : "number",
				showInLegend : true,
				name : "Smartphone " + id,
				dataPoints : []
			};
		}

		chart.options.data[id].dataPoints.push({
			x : xValue,
			y : yValue,
		});
	};

	//Refresh the chart every timelineFrequency
	setInterval(
			function() {
				if (isResume) {
					var currentLength = new Date();
					currentLength.setTime(new Date().getTime() - resumeTime);
					var timeInSeconds = (currentLength.getTime() / 1000)
							+ resumeLength;

					lrChart.options.data[0].dataPoints.push({
						x : timeInSeconds,
						y : 0,
					});

					fbChart.options.data[0].dataPoints.push({
						x : timeInSeconds,
						y : 0,
					});

					//For each datapoint, removes values older than 5s
					for ( var i = 0; i < lrChart.options.data.length; i++) {
						if (lrChart.options.data[i].dataPoints[0] != null
								&& lrChart.options.data[i].dataPoints[0].x < timeInSeconds - 5) {
							lrChart.options.data[i].dataPoints.shift();
						}
					}

					//For each datapoint, removes values older than 5s
					for ( var i = 0; i < fbChart.options.data.length; i++) {
						if (fbChart.options.data[i].dataPoints[0] != null
								&& fbChart.options.data[i].dataPoints[0].x < timeInSeconds - 5) {
							fbChart.options.data[i].dataPoints.shift();
						}
					}

					lrChart.render();
					fbChart.render();
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
