var monitorsApp = angular.module('hamelinMonitors', ['ngRoute', 'ui.knob', 'vr.directives.slider']);

monitorsApp.config(
		function($routeProvider) {
			$routeProvider.
			when('/home', {
				templateUrl: 'views/home.html',
			}).
			when('/devicesMonitor', {
				templateUrl: 'views/devicesMonitor.html',
				controller: 'devicesMonitorCtrl'
			}).
			when('/oscConfiguration', {
				templateUrl: 'views/oscConfiguration.html',
				controller: 'oscConfigurationCtrl'
			}).
			when('/deviceMotionCharts', {
				templateUrl: 'views/deviceMotionCharts.html',
				controller: 'deviceMotionChartsCtrl'
			}).
			when('/deviceOrientationCharts', {
				templateUrl: 'views/deviceOrientationCharts.html'
//					controller: 'deviceOrientationChartsController'
			}).
			otherwise({
				redirectTo: '/home'
			});
		});