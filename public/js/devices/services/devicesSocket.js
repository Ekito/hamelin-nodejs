devicesApp.factory('devicesSocket', function ($rootScope, $location) {
  var socket = io.connect($location.host() + '/devices');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    },
    osc: function (address, data) {
    	socket.emit('osc:message', {
    		address : address,
    		message : data
    	});
    }
  };
});