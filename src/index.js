const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const { use } = require("express/lib/router");

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

  // socket.emit("message", generateMessage("welcome ! 😎")); // generateMessage will return an object with all required data

  // notify another connected user that a new user has been joined
  // socket.broadcast.emit("message", generateMessage("A new user has joined !")); // socket.broadcase.emit emits an event to all the client except current one.

  //   Very important 🔴🔴
  //   io.emit ==> emit an event to everyone (for all)
  //   io.to.emit ==> emit an event to everyone in the room only (for room )
  //  socket.broadcast.emit ==> emit an event to everyone except current one (for all)
  //  socket.broadcast.to.emit ==> emit an event to everyone except current one in the room only (for room)

  // 🔴🏮 OLD CODE
  // // this is for when a user join a room
  // socket.on("join", ({ username, room }, callback) => {
  //   // add user to user array in specific room
  //   const { error, user } = addUser({ id: socket.id, username, room });

  //   if (error) {
  //     return callback(error);
  //   }

  //   socket.join(user.room); // for joining a room

  //   // for sending greeting msg to new joined user
  //   socket.emit("message", generateMessage("Admin", "welcome ! 😎"));

  //   // for sending msg to the users who are already in the room  that new user has joined in the room
  //   socket.broadcast
  //     .to(user.room)
  //     .emit(
  //       "message",
  //       generateMessage("Admin", `${user.username} has joined !`)
  //     );

  //   // for updating the user list on sidebar
  //   io.to(user.room).emit("roomData", {
  //     room: user.room,
  //     users: getUsersInRoom(user.room),
  //   });

  //   callback();
  // });

  // // receiving msg send by client
  // socket.on("sendMessage", (msg, callback) => {
  //   const user = getUser(socket.id);
  //   // if there is bad words in message then we don't send message
  //   const filter = new Filter();
  //   if (filter.isProfane(msg)) {
  //     return callback("Profanity is not allowed");
  //   }

  //   io.to(user.room).emit("message", generateMessage(user.username, msg)); // displaying msg to all connected clients
  //   callback(); //acknowledgement
  // });

  // // for doing something when client disconnect (close the tab)
  // socket.on("disconnect", () => {
  //   const user = removeUser(socket.id);

  //   // if there was a user joined the room then this if will run
  //   if (user) {
  //     // send msg to everyone in the room that specific user has left the room
  //     io.to(user.room).emit(
  //       "message",
  //       generateMessage("Admin", `${user.username} has left  !`)
  //     );

  //     // for updating the user list on sidebar
  //     io.to(user.room).emit("roomData", {
  //       room: user.room,
  //       users: getUsersInRoom(user.room),
  //     });
  //   }
  // });

  // socket.on("sendLocation", (obj, callback) => {
  //   const user = getUser(socket.id);

  //   io.to(user.room).emit(
  //     "messageLocation",
  //     generateLocationMessage(
  //       user.username,
  //       `https://google.com/maps?q=${obj.latitude},${obj.longitude}`
  //     )
  //   );
  //   callback();
  // });

  // 🔴🔴 NEW CODE

  let defaultSender = "Room";
  console.log("New Socket is connected");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit("message", generateMessage("Joined🥳", defaultSender));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined😃`, defaultSender),
        user.username
      );

    io.to(user.room).emit("roomMembers", {
      room: user.room,
      members: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity isn't allowed! (Bad W*rd)");
    }

    const { username, room } = getUser(socket.id);
    socket.emit("message", generateMessage(msg, "me"));
    socket.broadcast.to(room).emit("message", generateMessage(msg, username));
    // io.to(room).emit("message", generateMessage(msg, username));
    callback();
  });
  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const { username, room } = getUser(socket.id);
    socket.emit(
      "location",
      generateMessage(
        `https://google.com/maps/?q=${latitude},${longitude}`,
        "me"
      )
    );
    socket.broadcast
      .to(room)
      .emit(
        "location",
        generateMessage(
          `https://google.com/maps/?q=${latitude},${longitude}`,
          username
        )
      );
    // io.to(room).emit(
    //   "location",
    //   generateMessage(
    //     `https://google.com/maps/?q=${latitude},${longitude}`,
    //     username
    //   )
    // );
    callback();
    io.to(room).emit("mapbox", { latitude, longitude });
    socket.emit("mapboxSet");
  });
  socket.on("sendImage", (file, callback) => {
    const { username, room } = getUser(socket.id);

    socket.emit("image", generateMessage(file, "me"));
    socket.broadcast.to(room).emit("image", generateMessage(file, username));
    // io.to(room).emit("image", generateMessage(file, username));

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left😟`, defaultSender)
      );
      io.to(user.room).emit("roomMembers", {
        room: user.room,
        members: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log("server is running on port", PORT);
});
