var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
  res.render('index', {title: 'Home'});
});

router.get('/deviceOrientationCharts', function(req, res){
  res.render('deviceOrientationCharts', {title: 'Monitoring', chartType: 'deviceOrientation'});
});

router.get('/deviceOrientationSynchroCharts', function(req, res){
	  res.render('deviceOrientationCharts', {title: 'Monitoring', chartType: 'deviceOrientationSynchro'});
});

router.get('/deviceMotionCharts', function(req, res){
	  res.render('deviceMotionCharts', {title: 'Monitoring', chartType: 'deviceMotion'});
});

router.get('/configuration', function(req, res){
  res.render('configuration', {title: 'Configuration'});
});

router.get('/mobileDemo', function(req, res){
  res.render('mobileDemo', {title: 'Hamelin'});
});

module.exports = router;