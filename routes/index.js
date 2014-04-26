exports.index = function(req, res){
  res.render('index', {title: 'Home'});
};
exports.deviceOrientationCharts = function(req, res){
  res.render('deviceOrientationCharts', {title: 'Monitoring', chartType: 'deviceOrientation'});
};
exports.deviceOrientationSynchroCharts = function(req, res){
	  res.render('deviceOrientationCharts', {title: 'Monitoring', chartType: 'deviceOrientationSynchro'});
	};
exports.deviceMotionCharts = function(req, res){
	  res.render('deviceMotionCharts', {title: 'Monitoring', chartType: 'deviceMotion'});
};
exports.configuration = function(req, res){
  res.render('configuration', {title: 'Configuration'});
};