const socket = io();

const messageForm = document.querySelector("#message-form");
const messageFormInput = messageForm.querySelector("input");
const messageFormButton = messageForm.querySelector("button");
const sendLocationBtn = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true, // ignore Question mark (?)
}); // this will return object which have key-value pairs like here we get {username:"",room:""}

const autoScroll = () => {
  // new Message element
  const newMessage = messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  // console.log(newMessageStyles);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);

  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;
  console.log(newMessageHeight);

  // visible height
  const visibleHeight = messages.offsetHeight;

  // Height of message container
  const containerHeight = messages.scrollHeight;

  // How fat have i scrolled ?
  const scrollOffset = (messages.scrollTop + visibleHeight) * 2;

  if (containerHeight - newMessageHeight < scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  // rendering dynaic elements(messages)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"), // formatting date with moment.js
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("messageLocation", (obj) => {
  console.log(obj);
  const html = Mustache.render(locationTemplate, {
    username: obj.username,
    url: obj.url,
    createdAt: moment(obj.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});

// message from input field
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  messageFormButton.setAttribute("disabled", "disabled");

  // const message = document.querySelector("input").value;
  const message = e.target.elements.message.value;

  // console.log(message);

  socket.emit("sendMessage", message, (error) => {
    // enabling button when message has been send
    messageFormButton.removeAttribute("disabled");

    //clear input field
    messageFormInput.value = "";

    //focus on input Field
    messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("the message was delivered !");
  });
});

sendLocationBtn.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("geolocation is not supported by your browser");
  }

  // disabling button
  sendLocationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const longg = position.coords.longitude;

    socket.emit(
      "sendLocation",
      {
        latitude: lat,
        longitude: longg,
      },
      () => {
        // re-enabling buttton
        sendLocationBtn.removeAttribute("disabled");

        console.log("location shared !");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  // if there is error while joining the room
  if (error) {
    alert(error);
    location.href = "/"; // push back to home page
  }
}); // sending username and room data to the server

// ----------temp code for count example ----------------
// socket.on("countUpdated", (count) => {
//   // when countUpdated event occurs ,this callback will run
//   console.log("Count has been updated !", count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("clicked");

//   socket.emit("increment"); // send an "increment" event to the server side for incrementing count
// });
