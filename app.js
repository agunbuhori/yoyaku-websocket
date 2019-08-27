const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const db = require('./db');
const md5 = require('md5');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const PORT = 80;

const User = db.model('User', db.Schema({
  name: String,
  password: String,
  date: Date
}));

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/index.html');
});

app.post('/login', function (req, res) {
  const {name, password} = req.query;

  User.findOne({name, password: md5(password)}, function (err, user) {
    if (user) {
      let token = jwt.sign({ user: user._id }, "LoremIpsumDolorSitAmet");
      res.send({token});
    } else {
      res.send("Login failed");
    }
  })
});

app.get('/user', function (req, res) {
  User.find(function (err, result) {
    res.send(result);
  }).limit(100);
});

app.post('/user', function (req, res) {
  User.find({'name': req.query.name}, function (error, result) {
    if (result.length)
      res.send("User exists");
    else {
      new User({ name: req.query.name, password: md5(req.query.password), date: Date.now()}).save();
      res.send("User added");
    }
  });
});

app.get('/user/:id', function (req, res) {
  User.findById(req.params.id, function (req, result) {
    res.send(result);
  });
});

app.put('/user/:id', function (req, res) {
  User.updateOne({ _id: req.params.id }, { name: req.query.name, password: md5(req.query.password) }).exec();
  res.send(req.params.id + " updated");
});

app.delete('/user/:id', function (req, res) {
  User.remove({_id: req.params.id }).exec();
  res.send(req.params.id + " deleted");
});

io.use(function (socket, next) {
  const handshake = socket.request;
  const {client_token} = handshake.headers;
  
  jwt.verify(client_token, "LoremIpsumDolorSitAmet", function (err, decoded) {

    if (decoded)
      User.findById(decoded.user, function (err, user) {
        if (user)
          next();
      });
  });
  
  

  // User.findById(user_id, function (err, user) {
  //   if (user)
  //     next();
  // });
});

io.on('connection', socket => {
  socket.on('something', function (data) {
    io.sockets.emit('something', data);
    console.log(data);
  });
});

app.use(bodyParser);

http.listen(PORT, function (req, res) {
  console.log('listening on *:'+PORT);
});