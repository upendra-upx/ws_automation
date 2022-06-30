const STATUS_YELLOW = 0;
const STATUS_GREEN = 1;
const STATUS_RED = 2;
const FUNC_SEND = `SEND_WS_MESSAGE`;
const FUNC_BROADCAST = `BROADCAST`;
const FROM_WS_AUTO_CLIENT = `From Web Auto-Client`;
const FROM_WS_AUTO_SERVER = `From Web Auto-Server`;
const MESSAGE_TYPE_CHAT = 0;
const MESSAGE_TYPE_STATUS = 1;
const MESSAGE_TYPE_GROUP = 2;
const MESSAGE_TYPE_AUTO = 3;

var message_object = {
  timestamp: ``,
  function: FUNC_SEND,
  from: FROM_WS_AUTO_CLIENT,
  to: ``,
  message_type: MESSAGE_TYPE_CHAT,  
  message: ``,
  status: STATUS_YELLOW,
};

var socket;

function displayMessage(message, style) {
  var chat = document.getElementById("chat");
  let chatmessage = document.createElement("li");
  chatmessage.innerHTML = message; //message.replace(/\\\"/g,`"`);
  chatmessage.className = `chat_messages`;
  chatmessage.style.textAlign = style.textAlign;
  chatmessage.style.backgroundColor = style.backgroundColor;
  chat.appendChild(chatmessage);
}

window.onload = function () {
  document.getElementById("msg_ip_btn").addEventListener("click", SendMsg);

  socket = new WebSocket("wss://localhost:8080");

  socket.onopen = function (event) {
    console.log("[WebSocket] Connection established");
  };

  socket.onmessage = function (message) {
    console.log(`[message] Data received from server: ${message.data}`);
    let msg = JSON.parse(message.data);

    let htmlmsg, timecolor, fromcolor, style = {textAlign:``, backgroundColor:``};

    if ((msg.status == STATUS_GREEN)) {
      timecolor = `hsl(100, 100%, 35%)`;
    } else if ((msg.status == STATUS_YELLOW)) {
      timecolor = `hsl(60, 100%, 50%)`;
    } else if ((msg.status == STATUS_RED)) {
      timecolor = `hsl(0, 100%, 50%)`;
    };

    style.textAlign = `left`;
    style.backgroundColor = `hsl(0deg 100% 100%)`;

    if (msg.from == FROM_WS_AUTO_CLIENT) {
      fromcolor = `hsl(20, 100%, 50%)`;
      style.textAlign = `end`;
      style.backgroundColor = `hsl(87deg 89% 90%)`;      
    } else if (msg.from == FROM_WS_AUTO_SERVER) {
      fromcolor = `hsl(240, 100%, 50%)`;
      style.textAlign = `center`;
      style.backgroundColor = `hsl(50deg 100% 90%)`;
    } else {
      fromcolor = `hsl(0, 0%, 0%)`;
    }
    if (msg.to == '' || msg.to == null || msg.to == undefined) {
      msg.to = `All`;
    }
    if (msg.message_type == MESSAGE_TYPE_STATUS) {
      htmlmsg =
      `<span style="color: ${timecolor}; font-weight: 500">${msg.timestamp}</span>- <b><span style="color: hsl(300, 100%, 50%)">'Status Update'</span></b> from <b><span style="color: ${fromcolor}">'${msg.from}'</span></b>:<br>${msg.message}`;
    } else {
      htmlmsg =
      `<span style="color: ${timecolor}; font-weight: 500">${msg.timestamp}</span>- <b><span style="color: ${fromcolor}">'${msg.from}'</span></b> to <b>'${msg.to}'</b>:<br>${msg.message}`;
    }
    displayMessage(htmlmsg,style);
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      console.log("[close] Connection died");
    }
  };

  socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
  };
};

function SendMsg() {

  var message_2_send_to = document.getElementById("contact").value;
  var message_2_send = document.getElementById("message").value;
  message_2_send = message_2_send.replace(/[\n\r]/g, "<br>");
  //message_2_send = `"From Web Auto" To ${message_2_send_to} - ${message_2_send}`;

  message_object.timestamp = new Date().toLocaleString();
  message_object.to = message_2_send_to;
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
}
