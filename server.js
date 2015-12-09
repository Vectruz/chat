var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

var users = [];

io.on("connect", function (socket) {
	var _channel;
	var _nickname;
	socket.on("message", function (data) {
		for(var i in users) {
			if (users[i].name == _nickname && data.nickname != _nickname && users[i].channel == _channel) {
				io.to(_channel).emit('message', {
					date: new Date(),
					nickname: 'Server',
					message: _nickname + ' changed name to ' + data.nickname
				});
				users[i].name = data.nickname;
				_nickname = data.nickname;
				io.to(_channel).emit('users', users);
			};
		}
		io.to(_channel).emit("message", data);
	});
	socket.on("join", function (data) {
		_channel = data.channel;
		_nickname = data.nickname;
		users.push({name: _nickname, channel: _channel});
		socket.join(data.channel);
		io.to(_channel).emit("users", users);
	});
	socket.on('disconnect', function () {
		for(var i in users) {
			if (users[i].name == _nickname && users[i].channel == _channel) {
				users.splice(i, 1);
			};
		}
		io.to(_channel).emit('message', {
			date: new Date(),
			nickname: 'Server',
			message: _nickname + ' saiu!'
		});
		io.to(_channel).emit('users', users);
	});
});

app.use(express.static("client"));

app.get("/messages", function (req, res) {
	res.json(messages);
});

app.post("/messages", function (req, res) {
	var message = req.body;
	messages.push(message);
	res.json(message);
});

server.listen(process.env.PORT || 3000);