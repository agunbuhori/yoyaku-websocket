const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 80;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('something', data => {
    io.sockets.emit('something', data);
  });
});

http.listen(port, function(){
  console.log('listening on *'+port);
});