const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app); // just refectoring
const io = socketio(server); // this line will make sure that our server will support websocket

const PORT = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath)); // for listening html file in givev path (static)

let count = 0;

io.on("connection", (socket) => {
  console.log("new websocket connection");

  // Here socket is an object that contain all information about  connected connections , and we can use this to communicate with specific clients ,
  // here this function run as many time as no. of connected clients.
  // if i have 5 clients then this function will run 5 times.

  // -------------temporary code for count example----------------
  // socket.emit("countUpdated", count); // this will send an event to the client side , first argument is the name of the events , and second is data to be passed

  // socket.on("increment", () => {
  //   count++;
  //   // socket.emit("countUpdated", count); // this will emits the event to the specific client.

  //   io.emit("countUpdated", count); // this will emits the event to the all connected clients.
  // });

  socket.emit("message", generateMessage("welcome ! 😎")); // generateMessage will return an object with all required data

  // notify another connected user that a new user has been joined
  socket.broadcast.emit("message", generateMessage("A new user has joined !")); // socket.broadcase.emit emits an event to all the client except current one.

  // receiving msg send by client
  socket.on("sendMessage", (msg, callback) => {
    // if there is bad words in message then we don't send message
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }

    io.emit("message", generateMessage(msg)); // displaying msg to all connected clients
    callback(); //acknowledgement
  });

  // for doing something when client disconnect (close the tab)
  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left !"));
  });

  socket.on("sendLocation", (obj, callback) => {
    io.emit(
      "messageLocation",
      generateLocationMessage(
        `https://google.com/maps?q=${obj.latitude},${obj.longitude}`
      )
    );
    callback();
  });
});

server.listen(PORT, () => {
  console.log("server is running on port", PORT);
});
