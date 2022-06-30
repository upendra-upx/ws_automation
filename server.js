const loader = require("./loader");
const http2 = require("http2");
const WebSocketServer = require("websocket").server;
const fs = require("fs");

const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

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
  function: FUNC_BROADCAST,
  from: FROM_WS_AUTO_SERVER,
  to: ``,
  message_type: MESSAGE_TYPE_AUTO,
  message: ``,
  status: STATUS_GREEN,
};

function get_message_object(
  timestamp,
  func,
  from,
  to,
  msg_type,
  message,
  status
) {
  let msg = message_object;
  msg.timestamp = timestamp;
  msg.function = func;
  msg.from = from;
  msg.to = to;
  msg.message_type = msg_type;
  msg.message = message;
  msg.status = status;
  return msg;
}

const wshostname = "ws://localhost";
const httpport = "8080";

var ws_simulator;
var socket_connection;
var ws_status_msg;

const http_server = http2.createSecureServer({
  key: fs.readFileSync("./certificates/localhost-private.pem"),
  cert: fs.readFileSync("./certificates/localhost-cert.pem"),
  origins: "*",
  allowHTTP1: true,
});

http_server.on("connection", (socket) => {
  //console.log(socket);
});

http_server.on("request", (request, response) => {
  //console.log(request + response);
});

http_server.on("session", (session) => {
  //console.log(session);
});

http_server.on("sessionError", (error, session) => {
  console.error(`${error}; ${session}`);
});

http_server.on("timeout", (error, session) => {
  console.log(`HTTP Server timed Out! - ${error} - ${session}`);
});

http_server.on("unknownProtocol", (socket) => {
  console.error(`Unknown Protocol error - ${socket}`);
});

http_server.on("stream", (stream, headers) => on_HTTP_Stream(stream, headers));

const socket_server = new WebSocketServer({
  httpServer: http_server,
});

socket_server.on("request", (request) => on_Socket_Request(request));

socket_server.on("connect", (connection) => {
  console.log(`Web Socket Server Connected!`); //to : ${connection.}`);
});

socket_server.on("close", (connection, closeReason, description) => {
  console.log(
    `Web Socket Server Closed Connection : ${connection} - ${closeReason} - ${description}`
  );
});

socket_server.on("upgradeError", (error) => {
  console.log(`Web Socket Server Connection Upgrade Error: ${error}`);
});

function on_Socket_Close(reasonCode, description) {
  console.log(`Web Socket closed :${reasonCode} - ${description} `);
}

function on_Socket_Error(error) {
  console.log(`Web Socket error :${error}`);
}

http_server.listen(httpport, () => {
  console.log("HTTP Server started on Port: " + httpport);
});

function on_Socket_Request(request) {
  socket_connection = request.accept(null, request.origin);
  socket_connection.on("message", (message) => on_Message_From_Client(message));
  socket_connection.on("close", (reasonCode, description) =>
    on_Socket_Close(reasonCode, description)
  );
  socket_connection.on("error", (error) => on_Socket_Error(error));
}

function on_HTTP_Stream(stream, headers) {
  loader.route(stream, headers);
  Start_WS_Automation();
}

function Start_WS_Automation() {
  // Initiate WS Automation and Send Message
  // Use the saved values
  if (ws_simulator == undefined || ws_simulator == null) {
    ws_simulator = new Client({
      authStrategy: new LocalAuth({ dataPath: "./wsweb_auth" }),
    });

    ws_simulator.on("qr", (qr) => on_WS_Simulator_QR(qr));

    ws_simulator.on("ready", () => on_WS_Simulator_Ready());

    ws_simulator.on("message", (message) => on_WS_Simulator_Message(message));

    ws_simulator.on("message_create", (message) =>
      on_WS_Simulator_Message_Create(message)
    );

    ws_simulator.initialize();
  }
}

function on_Message_From_Client(message) {
  var client_message_object = JSON.parse(message.utf8Data);
  console.log(client_message_object);
  if (socket_connection !== undefined && socket_connection !== null) {
    if (
      ws_simulator !== undefined &&
      ws_simulator !== null &&
      client_message_object.to !== "" &&
      client_message_object.message !== ""
    ) {
      var contactid = `91${client_message_object.to}@c.us`;
      getWSContactDetails(ws_simulator, contactid).then((contact) => {
        var contactto = contact;
        getWSChat(contactto)
          .then((chat) => {
            var toname =
              contactto.name !== "" ? contactto.name : contactto.number;
            ws_status_msg = `'${client_message_object.from}' to '${toname}':<br>${client_message_object.message}`;
            sendWSMessage(chat, ws_status_msg)
              .then((message) => {
                console.log(message);
                let msg_to_broadcast = client_message_object;
                msg_to_broadcast.timestamp = new Date().toLocaleString();
                msg_to_broadcast.to = toname;
                msg_to_broadcast.status = STATUS_GREEN;
                ws_broadcast_message(msg_to_broadcast);
              })
              .catch((error) => {
                console.error(`Unable to Send WhatsApp Message: ${error}`);
              })
              .catch((error) => {
                console.error(`Unable to get Chat: ${error}`);
                return;
              });
          })
          .catch((error) => {
            console.error(`Unable to get Contact Details: ${error}`);
            return;
          });
      });
    }
  }
}

function ws_broadcast_message(message) {
  if (socket_connection !== undefined && socket_connection !== null) {
    console.log(message);

    if (
      message.timestamp == null ||
      message.timestamp == "" ||
      message.timestamp !== undefined
    ) {
      message.timestamp = new Date().toLocaleString();
    }
    if (
      message.message_type == null ||
      message.message_type == "" ||
      message.message_type == undefined
    ) {
      message.message_type = MESSAGE_TYPE_AUTO;
    }

    socket_connection.send(JSON.stringify(message));
  } else {
    console.log(`Unable to send message as not connected : ${message}`);
  }
}

function on_WS_Simulator_QR(qr) {
  qrcode.generate(qr, { small: true });
  ws_status_msg = `QR generated!`;
  let msg = get_message_object(
    new Date().toLocaleString(),
    FUNC_BROADCAST,
    FROM_WS_AUTO_SERVER,
    "",
    MESSAGE_TYPE_AUTO,
    ws_status_msg,
    STATUS_GREEN
  );
  ws_broadcast_message(msg);
}

function on_WS_Simulator_Ready() {
  ws_status_msg = `Connected to WhatsApp!`;
  let msg = get_message_object(
    new Date().toLocaleString(),
    FUNC_BROADCAST,
    FROM_WS_AUTO_SERVER,
    "",
    MESSAGE_TYPE_AUTO,
    ws_status_msg,
    STATUS_GREEN
  );
  ws_broadcast_message(msg);
}

function on_WS_Simulator_Message(message) {
  if (message.from.match(/status@broadcast/)) {
    var messagefrom = message.author;
    var messagetype = MESSAGE_TYPE_STATUS;
  } else {
    messagefrom = message.from;
    messagetype = MESSAGE_TYPE_CHAT;
  }
  getWSContactDetails(ws_simulator, messagefrom)
    .then((contactf) => {
      var contactfrom = contactf;
      getWSContactDetails(ws_simulator, message.to)
        .then((contactt) => {
          var contactto = contactt;
          var fromname =
            contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
          var toname =
            contactto.name !== "" ? contactto.name : contactto.number;
          let msg = get_message_object(
            new Date().toLocaleString(),
            FUNC_BROADCAST,
            fromname,
            toname,
            messagetype,
            message.body,
            STATUS_GREEN
          );
          ws_broadcast_message(msg);
          if (
            message.from == "919953225780@c.us" &&
            message.body.match(/love/i)
          ) {
            message.reply("I love you too!");
          }
        })
        .catch((error) => {
          console.error(`Unable to get 'To' Contact Details: ${error}`);
          return;
        });
    })
    .catch((error) => {
      console.error(`Unable to get 'From' Contact Details: ${error}`);
      return;
    });
};

function on_WS_Simulator_Message_Create(message) {
  if (message.fromMe == true && !message.body.match(/From Web Auto-Client/)) {
    if (message.from.match(/status@broadcast/)) {
      var messagefrom = message.author;
      var messagetype = MESSAGE_TYPE_STATUS;
    } else {
      messagefrom = message.from;
      messagetype = MESSAGE_TYPE_CHAT;
    }
    getWSContactDetails(ws_simulator, messagefrom)
      .then((contactf) => {
        var contactfrom = contactf;
        getWSContactDetails(ws_simulator, message.to)
          .then((contactt) => {
            var contactto = contactt;
            var fromname =
              contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
            var toname =
              contactto.name !== "" ? contactto.name : contactto.number;
            let msg = get_message_object(
              new Date().toLocaleString(),
              FUNC_BROADCAST,
              fromname,
              toname,
              messagetype,
              message.body,
              STATUS_GREEN
            );
            ws_broadcast_message(msg);
          })
          .catch((error) => {
            console.error(`Unable to get 'To' Contact Details: ${error}`);
            return;
          });
      })
      .catch((error) => {
        console.error(`Unable to get 'From' Contact Details: ${error}`);
        return;
      });
  }
}

async function getWSContactDetails(ws_simulator, contactid) {
  try {
    let contact = await ws_simulator.getContactById(contactid);
    return contact;
  } catch (error) {
    console.error(`Unable to get Contact Details: ${error}`);
    return error;
  }
}

async function getWSChat(contact) {
  try {
    let chat = await contact.getChat();
    return chat;
  } catch (error) {
    console.error(`Unable to get Chat ${error}`);
    return error;
  }
}

async function sendWSMessage(chat, message) {
  try {
    let return_message = await chat.sendMessage(message.replace(/<br>/g,`\n`));
    return return_message;
  } catch (error) {
    console.error(`Unable to Send Message to WhatsApp Message ${error}`);
    return error;
  }
}
