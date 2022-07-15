"use strict";

const path = require(`path`);

const { Client, LocalAuth } = require(`whatsapp-web.js`);
const qrcode = require(`qrcode`);
const active_users = require(path.join(
  path.resolve("../"),
  path.format({ dir: "Server/Modules", base: "active_users.js" })
));

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

var ws_status_msg;

exports.ws_web_auto = class ws_web_auto {
  ws_simulator;
  mobile;
  get_message_object;
  ws_broadcast_message;
  client_state = WS_AUTO_CLIENT_STATE_CONNECTING;
  constructor(mobile, get_message_object, ws_broadcast_message) {
    this.mobile = mobile;
    this.get_message_object = get_message_object;
    this.ws_broadcast_message = ws_broadcast_message;
    this.ws_simulator = new Client({
      authStrategy: new LocalAuth({
        clientId: mobile,
        dataPath: path.join(
          path.resolve("../"),
          path.format({ dir: "Server", base: "ws_auth_session" })
        ),
      }),
    });

    this.ws_simulator.on("qr", (qr) => this.on_WS_Simulator_QR(qr));

    this.ws_simulator.on("ready", () => this.on_WS_Simulator_Ready());

    this.ws_simulator.on("message", (message) =>
      this.on_WS_Simulator_Message(message)
    );

    this.ws_simulator.on("message_create", (message) =>
      this.on_WS_Simulator_Message_Create(message)
    );

    this.ws_simulator.initialize();
  }
  get_WS_Simulator() {
    return this.ws_simulator;
  }
  get_WS_Client_State() {
    return this.client_state;
  }
  on_WS_Simulator_QR(qr) {
    this.get_Ws_client_state = WS_AUTO_CLIENT_STATE_AUTH;

    console.log("QR Requested.");
    //qrcode_terminal.generate(qr, { small: true });
    let opts = { type: "image/png" };
    qrcode.toDataURL(qr, opts, (err, url) =>
      this.on_QRCode_Generated(err, url)
    );
  }
  on_QRCode_Generated(err, url) {
    if (err) throw err;

    if (url !== null) {
      console.log(url);
      this.ws_status_msg = `QR generated!`;

      let users = active_users.active_users.get_active_userlist_by_mobile(
        this.mobile
      );
      for (let i = 0; i < users.length; i++) {
        let msg = this.get_message_object(
          new Date().toLocaleString(),
          users[i].auth_token,
          FUNC_WS_AUTO_CLIENT_AUTH,
          FROM_WS_AUTO_SERVER,
          "",
          MESSAGE_TYPE_AUTO,
          url,
          STATUS_GREEN
        );
        this.ws_broadcast_message(users[i].socket_connection, msg);
      }
    }
  }
  on_WS_Simulator_Ready() {
    this.get_Ws_client_state = WS_AUTO_CLIENT_STATE_AUTH;

    console.log("WS Web Client is Ready.");
    this.ws_status_msg = `Connected to WhatsApp!`;
    let users = active_users.active_users.get_active_userlist_by_mobile(
      this.mobile
    );
    for (let i = 0; i < users.length; i++) {
      let msg = this.get_message_object(
        new Date().toLocaleString(),
        users[i].auth_token,
        FUNC_WS_AUTO_CLIENT_STATE,
        FROM_WS_AUTO_SERVER,
        "",
        MESSAGE_TYPE_AUTO,
        WS_AUTO_CLIENT_STATE_READY,
        STATUS_GREEN
      );
      this.ws_broadcast_message(users[i].socket_connection, msg);
    }
  }
  on_WS_Simulator_Message(message) {
    console.log("WS Web Client input Message received.");
    if (message.from.match(/status@broadcast/)) {
      var messagefrom = message.author;
      var messagetype = MESSAGE_TYPE_STATUS;
    } else {
      messagefrom = message.from;
      messagetype = MESSAGE_TYPE_CHAT;
    }
    this.getWSContactDetails(messagefrom)
      .then((contactf) => {
        var contactfrom = contactf;
        this.getWSContactDetails(message.to)
          .then((contactt) => {
            var contactto = contactt;
            var fromname =
              contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
            var toname =
              contactto.name !== "" ? contactto.name : contactto.number;

            let users = active_users.active_users.get_active_userlist_by_mobile(
              this.mobile
            );
            for (let i = 0; i < users.length; i++) {
              let msg = this.get_message_object(
                new Date().toLocaleString(),
                users[i].auth_token,
                FUNC_BROADCAST,
                fromname,
                toname,
                messagetype,
                message.body,
                STATUS_GREEN
              );
              this.ws_broadcast_message(users[i].socket_connection, msg);
            }
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
  }
  on_WS_Simulator_Message_Create(message) {
    console.log("WS Web Client input Message received.");
    if (
      message.fromMe == true &&
      !message.body.match(`${FROM_WS_AUTO_CLIENT}`)
    ) {
      if (message.from.match(/status@broadcast/)) {
        var messagefrom = message.author;
        var messagetype = MESSAGE_TYPE_STATUS;
      } else {
        messagefrom = message.from;
        messagetype = MESSAGE_TYPE_CHAT;
      }
      this.getWSContactDetails(messagefrom)
        .then((contactf) => {
          var contactfrom = contactf;
          this.getWSContactDetails(message.to)
            .then((contactt) => {
              var contactto = contactt;
              var fromname =
                contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
              var toname =
                contactto.name !== "" ? contactto.name : contactto.number;

              let users =
                active_users.active_users.get_active_userlist_by_mobile(
                  this.mobile
                );
              for (let i = 0; i < users.length; i++) {
                let msg = this.get_message_object(
                  new Date().toLocaleString(),
                  users[i].auth_token,
                  FUNC_BROADCAST,
                  fromname,
                  toname,
                  messagetype,
                  message.body,
                  STATUS_GREEN
                );
                this.ws_broadcast_message(users[i].socket_connection, msg);
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
    }
  }
  async getWSContactDetails(contactid) {
    console.log("WS Web Client getting contact details.");
    try {
      let contact = await this.ws_simulator.getContactById(contactid);
      return contact;
    } catch (error) {
      console.error(`Unable to get Contact Details: ${error}`);
      return error;
    }
  }
  async getWSChat(contact) {
    console.log("WS Web Client getting chat.");
    try {
      let chat = await contact.getChat();
      return chat;
    } catch (error) {
      console.error(`Unable to get Chat ${error}`);
      return error;
    }
  }
  async sendWSMessage(chat, message) {
    console.log("WS Web Client Sending Message");
    try {
      let return_message = await chat.sendMessage(
        message.replace(/<br>/g, `\n`)
      );
      return return_message;
    } catch (error) {
      console.error(`Unable to Send Message to WhatsApp Message ${error}`);
      return error;
    }
  }
};
