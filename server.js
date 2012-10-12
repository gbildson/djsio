var express = require("express"),
    sio     = require("socket.io"),
    request = require("superagent")

console.log("Creating Server ...");
app = express.createServer(express.bodyParser(), express.static("public") );

console.log("Listening ...");
app.listen( 3000); 

var io     = sio.listen(app),
    apiKey = "{ your API key }", 
    currentSong, 
    dj;


function elect (socket) {
  dj = socket;
  io.sockets.emit("announcement", socket.nickname + " is the new dj");
  socket.emit("elected");
  socket.dj = true;
  socket.on("disconnect", function () {
    dj = null;
    io.sockets.emit("announcement", "the dj left - next one to join becomes dj");
  });
}

console.log("Defining io connections ...");
io.sockets.on("connection", function (socket) {
  console.log("defining join ...");
  socket.on("join", function (name) {
    console.log("in join ...");
    socket.nickname = name;
    socket.broadcast.emit("announcement", name + "joined the chat.");
    if (!dj) {
      elect(socket);
    } else {
      socket.emit("song", currentSong);
    }
  });
  socket.on("song", function (song) {
    console.log("in song ...");
    if (socket.dj) {
      currentSong = song;
      socket.broadcast.emit("song", song);
    }
  });
 
  socket.on("search", function (q, fn) {
    console.log("in search ...");
    request("http://tinysong.com/s/" + encodeURIComponent(q) + "?key=" + apiKey + "&format=json", 
      function (res) {
        console.log("in tiny ...");
        if (200 == res.status) 
          fn( JSON.parse( res.text));
      });
  });
 
  socket.on("text", function (msg) {
    console.log("in text ...");
    socket.broadcast.emit("text", socket.nickname, msg);
  });
});
