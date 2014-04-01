exports.index = function(req, res){
  res.render('index', {title: 'Home'});
};
exports.deviceCharts = function(req, res){
  res.render('deviceCharts', {title: 'Monitoring'});
};
exports.synchroCharts = function(req, res){
  res.render('synchroCharts', {title: 'Monitoring'});
};
exports.console = function(req, res){
  res.render('console', {title: 'Console'});
};