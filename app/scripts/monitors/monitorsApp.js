var monitorsApp = angular.module('hamelinMonitors', ['ngRoute']);

monitorsApp.config(
		  function($routeProvider) {
			$routeProvider.
		      when('/home', {
		          templateUrl: 'views/home.html',
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
//				          controller: 'deviceOrientationChartsController'
		        }).
		      otherwise({
		        redirectTo: '/home'
		      });
		  });