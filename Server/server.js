"use strict";

require(`dotenv`).config();

const loader = require(`./Modules/loader`);
const http2 = require(`http2`);
const WebSocketServer = require(`websocket`).server;
const fs = require(`fs`);

// const { MongoClient, ServerApiVersion }  = require(`mongoose`);
const mongoose = require(`mongoose`);
const active_users = require(`./Modules/active_users`);

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
  function: FUNC_BROADCAST,
  from: FROM_WS_AUTO_SERVER,
  to: ``,
  message_type: MESSAGE_TYPE_AUTO,
  message: ``,
  status: STATUS_GREEN,
};

function get_message_object(
  timestamp,
  auth_token,
  func,
  from,
  to,
  msg_type,
  message,
  status
) {
  let msg = message_object;
  msg.timestamp = timestamp;
  msg.auth_token = auth_token;
  msg.function = func;
  msg.from = from;
  msg.to = to;
  msg.message_type = msg_type;
  msg.message = message;
  msg.status = status;
  return msg;
}

const httphostname = "https://localhost";
const wshostname = "ws://localhost";

const mongodboptions = {
  retryWrites: true,
  w: `majority`,
  useNewUrlParser: true,
  dbname: `ws_auto_customers`,
  ssl: true,
  autoIndex: false, // Don't build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

// const db = new MongoClient(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
mongoose.connect(process.env.DATABASE_URL, mongodboptions);

const db = mongoose.connection;

db.on("error", (error) => onDbError(error));
db.once("open", () => onDbOpen());

function onDbError(error) {
  console.error(error);
}

function onDbOpen() {
  console.log(`Connected to DB: ${process.env.DATABASE_URL}`);
}

var ws_status_msg;

const http_server = http2.createSecureServer({
  key: fs.readFileSync(`./Server/certificates/privkey.pem`),
  // key: fs.readFileSync(`./Server/certificates/localhost-private.pem`),
  cert: fs.readFileSync(`./Server/certificates/fullchain.pem`),
  // cert: fs.readFileSync("./Server/certificates/localhost-cert.pem"),
  origins: "*",
  allowHTTP1: true,
});

http_server.on("connection", (socket) => {
  //console.log(socket);
});

http_server.on("request", async (request, response) =>
  on_HTTP_Request(request, response)
);

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

function on_Socket_Close(socket_connection, reasonCode, description) {
  console.log(`Web Socket closed :${reasonCode} - ${description} `);
  active_users.active_users.remove_user_by_socket(socket_connection);
}

function on_Socket_Error(socket_connection, error) {
  console.log(`Web Socket error :${error}`);
  active_users.active_users.remove_user_by_socket(socket_connection);
}

http_server.listen(process.env.HTTP_PORT, () => {
  console.log("HTTP Server started on Port: " + process.env.HTTP_PORT);
});

function on_Socket_Request(request) {
  for (let i = 0; i < request.cookies.length; i++) {
    let csrf_cookie = request.cookies[i];
    if (csrf_cookie.name == `x-csrf`) {
      let auth_token = csrf_cookie.value;
      if (auth_token !== null) {
        let socket_connection = request.accept(null, request.origin);
        socket_connection.id = new Date().toLocaleString();
        active_users.active_users.update_socket_conn_by_auth_token(
          auth_token,
          socket_connection
        );
        socket_connection.on("message", (message) =>
          on_Message_From_Client(socket_connection, message)
        );
        socket_connection.on(
          "close",
          (reasonCode, description) =>
            on_Socket_Close(socket_connection, reasonCode, description)
        );
        socket_connection.on("error", (error) =>
          on_Socket_Error(socket_connection, error)
        );
      }
      break;
    }
  }
}

async function on_HTTP_Request(request, response) {
  await loader.route(
    request,
    response,
    db,
    get_message_object,
    ws_broadcast_message
  );
}

function on_HTTP_Stream(stream, headers) {}

function on_Message_From_Client(socket_connection, message) {
  var client_message_object = JSON.parse(message.utf8Data);
  console.log(client_message_object);
  if (socket_connection !== undefined && socket_connection !== null) {
    if (
      client_message_object.to !== "" &&
      client_message_object.message !== ""
    ) {
      var contactid = `91${client_message_object.to}@c.us`;
      active_users.active_users
        .get_active_user_by_socket(socket_connection)
        ?.ws_web_auto_instance?.getWSContactDetails(contactid)
        .then((contact) => {
          var contactto = contact;
          active_users
            .active_users.get_active_user_by_socket(socket_connection)
            ?.ws_web_auto_instance?.getWSChat(contactto)
            .then((chat) => {
              var toname =
                contactto.name !== "" ? contactto.name : contactto.number;
              ws_status_msg = `From '${client_message_object.from}' to '${toname}':<br>${client_message_object.message}`;
              active_users
                .active_users.get_active_user_by_socket(socket_connection)
                ?.ws_web_auto_instance?.sendWSMessage(chat, ws_status_msg)
                .then((return_message) => {
                  console.log(return_message);
                  let msg_to_broadcast = client_message_object;
                  msg_to_broadcast.timestamp = new Date().toLocaleString();
                  msg_to_broadcast.to = toname;
                  msg_to_broadcast.status = STATUS_GREEN;
                  let users = active_users.active_users.get_active_userlist_by_auth_token(
                    client_message_object.auth_token
                  );
                  for (let i = 0; i < users.length; i++) {
                    ws_broadcast_message(
                      users[i].socket_connection,
                      msg_to_broadcast
                    );
                  }
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

function ws_broadcast_message(socket_connection, message) {
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
