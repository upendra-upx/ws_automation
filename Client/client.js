"use strict";

const STATUS_YELLOW = 0;
const STATUS_GREEN = 1;
const STATUS_RED = 2;
const FUNC_SEND = `SEND_WS_MESSAGE`;
const FUNC_BROADCAST = `BROADCAST`;
const FROM_WS_AUTO_CLIENT = `Web Auto-Client`;
const FROM_WS_AUTO_SERVER = `Web Auto-Server`;
const MESSAGE_TYPE_CHAT = 0;
const MESSAGE_TYPE_STATUS = 1;
const MESSAGE_TYPE_GROUP = 2;
const MESSAGE_TYPE_AUTO = 3;

var message_object = {
  timestamp: ``,
  auth_token: ``,
  function: FUNC_SEND,
  from: FROM_WS_AUTO_CLIENT,
  to: ``,
  message_type: MESSAGE_TYPE_CHAT,
  message: ``,
  status: STATUS_YELLOW,
};

var socket;
var loginstate = true;
var gv_auth_token;

function displayMessage(message, style) {
  var chat = document.getElementById("chat");
  let chatmessage = document.createElement("div");
  let chit = document.createElement("div");

  chatmessage.className = `chat_messages`;
  chatmessage.style.alignItems = style.alignItems;
  chit.className = `chit`;
  chit.innerHTML = message;
  chit.style.backgroundColor = style.backgroundColor;
  chatmessage.appendChild(chit);
  chat.appendChild(chatmessage);
}

window.onload = function () {
  document.body.addEventListener("submit", (event) => {
    event.preventDefault();
    switch (event.submitter.id) {
      case `login_button`:
        Authenticate(event, window);
        break;
      case `signup_button`:
        SignUp(event, window);
        break;
    }
  });
  /* document
    .getElementById("login_button")
    .addEventListener("click", (event) => Authenticate(event, window));
  document
    .getElementById("signup_button")
    .addEventListener("click", (event) => SignUp(event, window)); */
  document
    .getElementById("msg_ip_btn")
    .addEventListener("click", (event) => SendMsg(event, window));
  document.getElementById("open_eye").style.display = `block`;
  document.getElementById("closed_eye").style.display = `none`;
  document
    .getElementById("open_eye")
    .addEventListener("click", togglePasswordEye);
  document
    .getElementById("closed_eye")
    .addEventListener("click", togglePasswordEye);
};

function togglePasswordEye() {
  var open_eye = document.getElementById("open_eye");
  var closed_eye = document.getElementById("closed_eye");
  var password = document.getElementById("password");
  if (open_eye.style.display == `block`) {
    open_eye.style.display = `none`;
    closed_eye.style.display = `block`;
    password.type = "text";
  } else {
    open_eye.style.display = `block`;
    closed_eye.style.display = `none`;
    password.type = "password";
  }
}

function Authenticate(event, window) {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (username == null) {
    alert(`Please enter Mobile no`);
    return;
  } else if (password == null) {
    alert(`Please enter Password`);
    return;
  }

  var credentials = {
    mobile: parseInt(username),
    password: password,
  };

  var credentialsString = JSON.stringify(credentials);

  const AuthHeaders = new Headers();

  AuthHeaders.append("Content-Type", "application/json");
  AuthHeaders.append("Content-Length", credentialsString.length.toString());
  AuthHeaders.append("x-authenticate", `${credentialsString}`);

  const AuthRequest = new Request(`https://diytests.ddns.net/authenticate`, {
    method: "GET",
    headers: AuthHeaders,
    mode: "cors",
    cache: "default",
  });

  fetch(AuthRequest)
    .then((response) => onAuthenticateResponse(response))
    .then((auth_token) => startConnection(auth_token, window));
}

function onAuthenticateResponse(response) {
  if (response.ok) {
    return response.text();
  } else {
    console.error(`Error in Authenticating: ${response.status}`);
    throw "Error in Authenticating";
  }
}

function SignUp(event, window) {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (username == null) {
    alert(`Please enter Mobile no`);
    return;
  } else if (password == null) {
    alert(`Please enter Password`);
    return;
  }

  var credentials = {
    mobile: parseInt(username),
    password: password,
  };

  var credentialsString = JSON.stringify(credentials);

  const SignUpHeaders = new Headers();

  SignUpHeaders.append("Content-Type", "application/json");
  SignUpHeaders.append("Content-Length", credentialsString.length.toString());
  SignUpHeaders.append("x-authenticate", `${credentialsString}`);

  const SignUpRequest = new Request(`https://diytests.ddns.net/signup`, {
    method: "POST",
    headers: SignUpHeaders,
    mode: "cors",
    cache: "default",
  });

  fetch(SignUpRequest)
    .then((response) => onSignupResponse(response))
    .then((auth_token) => startConnection(auth_token, window));
}

function onSignupResponse(response) {
  if (response.ok) {
    return response.text();
  } else {
    console.error(`Error in Sign Up: ${response.status}`);
    throw "Error in Sign Up";
  }
}

function startConnection(auth_token, window) {
  //console.log(auth_token);

  if (auth_token !== undefined || auth_token !== null || auth_token !== ``) {
    window.gv_auth_token = auth_token;

    history.replaceState(history.state, 'Authenticate')

    let cookie = `x-csrf=${auth_token}`;

    document.cookie = cookie;

    socket = new WebSocket("wss://diytests.ddns.net:443");

    socket.onopen = (event) => onSocketOpen(event);

    socket.onmessage = (message) => onSocketMessage(message);

    socket.onclose = (event) => onSocketClose(event);

    socket.onerror = (error) => onSocketError(error);
  }
}

function toggleLoginPopup() {
  if ((loginstate = true)) {
    var application = document.getElementById(`application`);
    var login = document.getElementById(`login`);

    application.style.opacity = 1;
    login.style.display = `none`;
  } else {
    var application = document.getElementById(`application`);
    var login = document.getElementById(`login`);

    application.style.opacity = 0.5;
    login.style.display = `flex`;
  }
}

function SendMsg(event, window) {
  var message_2_send_to = document.getElementById("contact").value;
  var message_2_send = document.getElementById("message").value;
  message_2_send = message_2_send.replace(/[\n\r]/g, "<br>");
  let multi_send_to = message_2_send_to.split(`;`);
  multi_send_to.forEach((currentValue) => {
    message_object.timestamp = new Date().toLocaleString();
    message_object.auth_token = window.gv_auth_token;
    message_object.to = currentValue;
    message_object.message_type = MESSAGE_TYPE_CHAT;
    message_object.message = message_2_send;

    if (
      socket !== undefined &&
      socket !== null &&
      socket.readyState !== 2 &&
      socket.readyState !== 3 &&
      message_2_send_to !== "" &&
      message_2_send !== ""
    ) {
      socket.send(JSON.stringify(message_object));
    }
  });
}

function onSocketOpen(event) {
  console.log("[WebSocket] Connection established");
  toggleLoginPopup();
}

function onSocketMessage(message) {
  console.log(`[message] Data received from server: ${message.data}`);
  let msg = JSON.parse(message.data);

  let htmlmsg,
    timecolor,
    fromcolor,
    style = { alignItems: ``, backgroundColor: `` };

  if (msg.status == STATUS_GREEN) {
    timecolor = `hsl(100, 100%, 35%)`;
  } else if (msg.status == STATUS_YELLOW) {
    timecolor = `hsl(60, 100%, 50%)`;
  } else if (msg.status == STATUS_RED) {
    timecolor = `hsl(0, 100%, 50%)`;
  }

  style.alignItems = `flex-start`;
  style.backgroundColor = `hsl(0deg 100% 100%)`;

  if (msg.from == FROM_WS_AUTO_CLIENT) {
    fromcolor = `hsl(0deg 100% 50%);`;
    style.alignItems = `flex-end`;
    style.backgroundColor = `hsl(87deg 89% 90%)`;
  } else if (msg.from == FROM_WS_AUTO_SERVER) {
    fromcolor = `hsl(240, 100%, 50%)`;
    style.alignItems = `center`;
    style.backgroundColor = `hsl(50deg 100% 90%)`;
  } else {
    fromcolor = `hsl(0, 0%, 0%)`;
  }
  if (msg.to == "" || msg.to == null || msg.to == undefined) {
    msg.to = `All`;
  }
  if (msg.message_type == MESSAGE_TYPE_STATUS) {
    htmlmsg = `<span style="color: ${timecolor}; font-weight: 500">${msg.timestamp}</span>- <b><span style="color: hsl(300, 100%, 50%)">'Status Update'</span></b> from <b><span style="color: ${fromcolor}">'${msg.from}'</span></b>:<br>${msg.message}`;
  } else {
    htmlmsg = `<span style="color: ${timecolor}; font-weight: 500">${msg.timestamp}</span>- From <b><span style="color: ${fromcolor}">'${msg.from}'</span></b> to <b>'${msg.to}'</b>:<br>${msg.message}`;
  }
  displayMessage(htmlmsg, style);
}

function onSocketClose(event) {
  if (event.wasClean) {
    console.log(
      `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
    );
  } else {
    console.log("[close] Connection died");
  }
}

function onSocketError(error) {
  console.error(error);
}
