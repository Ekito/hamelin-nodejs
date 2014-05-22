'use strict';

var logger = require('../config/log');

module.exports = {
		
		standardDeviation : function(connectedDevices){

			logger.debug('Computing standard deviation');
			
			var keys = Object.keys(connectedDevices);
			var stdDevTiltLR = 0;
			var stdDevTiltFB = 0;
			var avgTiltLR = 0;
			var avgTiltFB = 0;
			
			if (keys.length > 0)
			{
				var sumTiltLR = 0;
				var sumTiltFB = 0;
				
				keys.forEach(function(key){
					var device = connectedDevices[key];
					sumTiltLR += device.tiltLR;
					sumTiltFB += device.tiltFB;
				});
				
				avgTiltLR = sumTiltLR / keys.length;
				avgTiltFB = sumTiltFB / keys.length;
				
				sumTiltLR = 0;
				sumTiltFB = 0;
				
				keys.forEach(function(key){
					var device = connectedDevices[key];
					sumTiltLR += Math.pow((device.tiltLR - avgTiltLR), 2);
					sumTiltFB += Math.pow((device.tiltFB - avgTiltFB), 2);
				});
			
				stdDevTiltLR = 1 - (Math.sqrt(sumTiltLR / keys.length) / 90);
				stdDevTiltFB = 1 - (Math.sqrt(sumTiltFB / keys.length) / 90);

			}
			return {avgTiltLR : this.rangeValue(avgTiltLR / 90, -1, 1),
				stdDevTiltLR : this.rangeValue(stdDevTiltLR, 0, 1),
				avgTiltFB : this.rangeValue(avgTiltFB / 90, -1, 1),
				stdDevTiltFB : this.rangeValue(stdDevTiltFB, 0, 1)};
		},
		rangeValue : function(value, min, max){
			var result = 0;
			
			if (value < min){
				result = min;
			}else if (value > max){
				result = max;
			}else{
				result = value;
			}
			return result;
		},
		average : function(array){
			//Compute the average of values
			var sum = 0;
			for ( var int = 0; int < array.length; int++) {
				sum += array[int];
			}
			return sum / array.length;
		}
};