exports.index = function(req, res){
  res.render('index', {title: 'Home'});
};
exports.deviceOrientationCharts = function(req, res){
  res.render('deviceOrientationCharts', {title: 'Monitoring'});
};
exports.synchroCharts = function(req, res){
  res.render('synchroCharts', {title: 'Monitoring'});
};
exports.configuration = function(req, res){
  res.render('configuration', {title: 'Configuration'});
};