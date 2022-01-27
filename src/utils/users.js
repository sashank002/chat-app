const { use } = require("express/lib/application");

const users = [];

// method to add user
const addUser = ({ id, username, room }) => {
  // clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // validate the data
  if (!username || !room) {
    return {
      error: "username and room are required",
    };
  }

  // check if there are existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  // validate username
  if (existingUser) {
    return {
      error: "user name is used ",
    };
  }

  // store user
  const user = { id, username, room };
  users.push(user);

  return { user };
};

// method to remove user
const removeUser = (id) => {
  // find a user by matching id
  const index = users.findIndex((user) => {
    return user.id === id;
  });

  // if user exist then remove it
  if (index !== -1) {
    return users.splice(index, 1)[0]; // this will return an array of deleted elements ,but here we have deleted only one element, so we explicitly wrote [0]
  }
};

// method to get user by id
const getUser = (id) => {
  const user = users.find((user) => {
    return user.id === id;
  });

  return user;
};

const getUsersInRoom = (room) => {
  return users.filter((user) => {
    return user.room === room;
  });
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
