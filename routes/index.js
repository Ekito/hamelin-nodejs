exports.index = function(req, res){
  res.render('index', {title: 'Home'});
};
exports.charts = function(req, res){
  res.render('charts', {title: 'Monitoring'});
};
exports.console = function(req, res){
  res.render('console', {title: 'Console'});
};