var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , osc = require('osc-min')
  , dgram = require('dgram');

var udp = dgram.createSocket("udp4");

sendHeartbeat = function(myValue1, myValue2) {
  var buf;
  buf = osc.toBuffer({
    address: "/Fader",
    args: [
      myValue1, myValue2
    ]
  });
  return udp.send(buf, 0, buf.length, 8200, "192.168.5.118");
};

//setInterval(sendHeartbeat, 2000);


server.listen(process.env.PORT || 8080);

app.get('/:resource', function (req, res) {
  res.sendfile(__dirname+'/web/'+req.params.resource);
});

app.get('/js/:resource', function (req, res) {
  res.sendfile(__dirname+'/web/js/'+req.params.resource);
});

app.get('/icons/:resource', function (req, res) {
  res.sendfile(__dirname+'/web/icons/'+req.params.resource);
});

var id = 0;
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    socket.on('getId', function (data){
        socket.emit('id', id++);
    });

    socket.on('deviceOrientation',function (data){
	sendHeartbeat(data.tiltLR, data.tiltFB);
         socket.broadcast.emit('deviceOrientation', data);
     });
});
