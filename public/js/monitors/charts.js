	var createChart = function (chartName, title, axisYTitle, axisYUnit) {
		var chart = new CanvasJS.Chart(chartName, {
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
				title : axisYTitle,
				margin : 20,
				suffix : axisYUnit,
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

		return chart;
	};

	var createSerie = function(chart, name) {
		return chart.options.data.push({
			markerType : "circle",
			type : "spline",
			xValueType : "number",
			showInLegend : true,
			name : name,
			dataPoints : []
		}) - 1;
	};
	
	var pushData = function (chart, index, xValue, yValue) {
		chart.options.data[index].dataPoints.push({
			x : xValue,
			y : yValue,
		});
	};

	//Refresh the chart every timelineFrequency
	var refreshChart = function(chart, time, onRemove) {

			//Push Timeline data
			chart.options.data[0].dataPoints.push({
				x : time,
				y : 0,
			});

			for ( var i = 0; i < chart.options.data.length; i++) {
				if (chart.options.data[i] != null){
					if (chart.options.data[i].dataPoints.length > 50){
						var dataPointsLength = chart.options.data[i].dataPoints.length;
						
						chart.options.data[i].dataPoints.splice(0, dataPointsLength - 50);
					}else if (chart.options.data[i].dataPoints[0] != null
							//For each datapoint, removes values older than 5s
							&& chart.options.data[i].dataPoints[0].x < time - 5) {
						chart.options.data[i].dataPoints.shift();
						onRemove(chart, i);
					}
					
				}
			}
			
			chart.render();
	};
