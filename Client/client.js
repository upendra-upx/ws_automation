"use strict";

const STATUS_YELLOW = 0;
const STATUS_GREEN = 1;
const STATUS_RED = 2;
const FUNC_SEND = `SEND_WS_MESSAGE`;
const FUNC_BROADCAST = `BROADCAST`;
const FUNC_WS_AUTO_CLIENT_AUTH = `WS_AUTH`;
const FUNC_WS_AUTO_CLIENT_STATE = `WS_STATE`;
const WS_AUTO_CLIENT_STATE_CONNECTING = `WS_CONNECTING`;
const WS_AUTO_CLIENT_STATE_AUTH = `WS_AUTH_REQUIRED`;
const WS_AUTO_CLIENT_STATE_READY = `WS_CLIENT_READY`;
const FROM_WS_AUTO_CLIENT = `Web Auto-Client`;
const FROM_WS_AUTO_SERVER = `Web Auto-Server`;
const MESSAGE_TYPE_CHAT = 0;
const MESSAGE_TYPE_STATUS = 1;
const MESSAGE_TYPE_GROUP = 2;
const MESSAGE_TYPE_AUTO = 3;

var message_object = {
  timestamp: ``,
  auth_token: window.gv_auth_token,
  function: FUNC_SEND,
  from: FROM_WS_AUTO_CLIENT,
  to: ``,
  message_type: MESSAGE_TYPE_CHAT,
  message: ``,
  status: STATUS_YELLOW,
};

var socket;
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
  initialize_style(window);
  attachEvents(window);
};

function initialize_style(window) {
  let application = document.getElementById(`application`);
  application.style.opacity = 0.3;
  let login = document.getElementById(`login`);
  login.style.display = `flex`;
  login.style.opacity = 1;
  let login_form = document.getElementById("login_form");
  login_form.style.display = `flex`;
  let qrcode_div = document.getElementById("qrcode_div");
  qrcode_div.style.display = `none`;
  qrcode_div.style.opacity = 1;
  let login_loading_div = document.getElementById(`login_loading_div`);
  login_loading_div.style.display = `none`;
  login_loading_div.style.opacity = 1;
  document.getElementById("open_eye").style.display = `block`;
  document.getElementById("closed_eye").style.display = `none`;
}

function attachEvents(window) {
  document.body.addEventListener("submit", (event) =>
    handleSubmit(event, window)
  );
  document
    .getElementById("msg_ip_btn")
    .addEventListener("click", (event) => SendMsg(event, window));
  initialize_style;
  document
    .getElementById("open_eye")
    .addEventListener("click", togglePasswordEye);
  document
    .getElementById("closed_eye")
    .addEventListener("click", togglePasswordEye);
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
    .then((auth_token) => startConnection(auth_token, window))
    .catch((error) => onAuthenticateError(error));
}

function onAuthenticateResponse(response) {
  if (response.ok) {
    return response.text();
  } else {
    throw `Login Error.`;
  }
}

function onAuthenticateError(error) {
  if (error) {
    console.error(error);
    alert(`${error} Contact DIY to check if your Account is activated!`);
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
    //.then((auth_token) => startConnection(auth_token, window))
    .catch((error) => onSignupError(error));
}

function onSignupResponse(response) {
  if (response.ok) {
    alert("Sign up Successful! Please Login now.");
  } else {
    throw `Error in Signing Up.`;
  }
}

function onSignupError(error) {
  if (error) {
    console.error(error);
    alert(`${error} Check if there is already an Account with this Mobile!`);
  }
}

function startConnection(auth_token, window) {
  //console.log(auth_token);

  if (auth_token !== undefined || auth_token !== null || auth_token !== ``) {
    window.gv_auth_token = auth_token;

    history.replaceState(history.state, "Authenticate");

    let cookie = `x-csrf=${auth_token}`;

    document.cookie = cookie;

    socket = new WebSocket("wss://diytests.ddns.net:443");

    socket.onopen = (event) => onSocketOpen(event, window);

    socket.onmessage = (message) => onSocketMessage(message, window);

    socket.onclose = (event) => onSocketClose(event);

    socket.onerror = (error) => onSocketError(error);
  }
}

function toggleLoginPopup(window) {
  var application = document.getElementById(`application`);
  var login = document.getElementById(`login`);
  var login_form = document.getElementById(`login_form`);
  var qrcode_div = document.getElementById("qrcode_div");

  application.style.opacity == 0.3
    ? (application.style.opacity = 1)
    : (application.style.opacity = 0.3);
  login.style.display == `flex`
    ? (login.style.display = `none`)
    : (login.style.display = `flex`);
  login.style.opacity == 0.6
    ? (login.style.opacity = 1)
    : (login.style.opacity = 0.6);
  login_form.style.display == `none`
    ? (login_form.style.display = `flex`)
    : (login_form.style.display = `none`);
  qrcode_div.style.display == `none`
    ? (qrcode_div.style.display = `flex`)
    : (qrcode_div.style.display = `none`);
}

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

function toggleQRCode(qrcode_src, window) {
  var login_form = document.getElementById("login_form");
  var qrcode = document.getElementById("qrcode");
  var qrcode_div = document.getElementById("qrcode_div");
  login_form.style.display == `flex`
    ? (login_form.style.display = `none`)
    : (login_form.style.display = `flex`);
  qrcode.src = qrcode_src;
  qrcode_div.style.display == `none`
    ? (qrcode_div.style.display = `flex`)
    : (qrcode_div.style.display = `none`);
}

function toggleConnecting(window) {
  var login_form = document.getElementById(`login_form`);
  var qrcode_div = document.getElementById(`qrcode_div`);
  var login_loading_div = document.getElementById(`login_loading_div`);
  login_form.style.opacity == 1
    ? (login_form.style.opacity = 0.6)
    : (login_form.style.opacity = 1);
  qrcode_div.style.opacity == 1
    ? (qrcode_div.style.opacity = 0.6)
    : (qrcode_div.style.opacity = 1);
  login_loading_div.style.display == `none`
    ? (login_loading_div.style.display = `flex`)
    : (login_loading_div.style.display = `none`);
}

function handleSubmit(event, window) {
  {
    event.preventDefault();
    switch (event.submitter.id) {
      case `login_button`:
        Authenticate(event, window);
        break;
      case `signup_button`:
        SignUp(event, window);
        break;
    }
  }
}

function SendMsg(event, window) {
  var message_2_send_to = document.getElementById("contact").value;
  var message_2_send = document.getElementById("message").value;
  message_2_send = message_2_send.replace(/[\n\r]/g, "<br>");
  let multi_send_to = message_2_send_to.split(`;`);
  multi_send_to.forEach((currentValue) => {
    let message_obj = message_object;
    message_obj.timestamp = new Date().toLocaleString();
    message_obj.auth_token = window.gv_auth_token;
    message_obj.function = FUNC_SEND;
    message_obj.to = currentValue;
    message_obj.message_type = MESSAGE_TYPE_CHAT;
    message_obj.message = message_2_send;

    if (
      socket !== undefined &&
      socket !== null &&
      socket.readyState !== 2 &&
      socket.readyState !== 3 &&
      message_2_send_to !== "" &&
      message_2_send !== ""
    ) {
      socket.send(JSON.stringify(message_obj));
    }
  });
}

function onSocketOpen(event, window) {
  console.log("[WebSocket] Connection established");
  console.log("Checking Client Status");
  // Check WhatsApp Client Status, if Ready then Close login popup
  let message_obj = message_object;
  message_obj.timestamp = new Date().toLocaleString();
  message_obj.auth_token = window.gv_auth_token;
  message_obj.function = FUNC_WS_AUTO_CLIENT_STATE;
  socket.send(JSON.stringify(message_obj));
  toggleConnecting(window);
}

function onSocketMessage(message, window) {
  console.log(`[message] Data received from server: ${message.data}`);
  let msg = JSON.parse(message.data);

  switch (msg.function) {
    case FUNC_WS_AUTO_CLIENT_STATE:
      switch (msg.message) {
        case WS_AUTO_CLIENT_STATE_CONNECTING:
          break;
        case WS_AUTO_CLIENT_STATE_AUTH:
          break;
        case WS_AUTO_CLIENT_STATE_READY:
          toggleConnecting(window);
          toggleLoginPopup(window);
          break;
      }
      break;
    case FUNC_WS_AUTO_CLIENT_AUTH:
      toggleQRCode(msg.message, window);
      break;
    case FUNC_SEND:
      formatInputMessageAndDisplay(msg);
      break;
    case FUNC_BROADCAST:
      formatInputMessageAndDisplay(msg);
      break;
  }
}

function formatInputMessageAndDisplay(msg) {
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
