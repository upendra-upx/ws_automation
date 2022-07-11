
const { Client, LocalAuth } = require(`whatsapp-web.js`);
const qrcode = require(`qrcode-terminal`);

var ws_status_msg;

module.exports = class ws_web_auto {
  ws_simulator;
  mobile;
  get_message_object;
  ws_broadcast_message;
  constructor(mobile, get_message_object, ws_broadcast_message) {
    this.mobile = mobile;
    this.get_message_object = get_message_object;
    this.ws_broadcast_message = ws_broadcast_message;
    this.ws_simulator = new Client({
      authStrategy: new LocalAuth({
        clientId: mobile,
        dataPath: "./wsweb_auth",
      }),
    });

    this.ws_simulator.on("qr", (qr) => on_WS_Simulator_QR(qr));

    this.ws_simulator.on("ready", () => on_WS_Simulator_Ready());

    this.ws_simulator.on("message", (message) =>
      on_WS_Simulator_Message(message)
    );

    this.ws_simulator.on("message_create", (message) =>
      on_WS_Simulator_Message_Create(message)
    );

    this.ws_simulator.initialize();

    ws_simulator_list.push({
      mobile: mobile,
      ws_sim_instance: this.ws_simulator,
    });
    //}
  }
  get_ws_simulator() {
    return this.ws_simulator;
  }
  on_WS_Simulator_QR(qr) {
    qrcode.generate(qr, { small: true });
    ws_status_msg = `QR generated!`;

    let users = active_users.get_active_userlist_by_mobile(this.mobile);
    for (let user in users) {
      let msg = get_message_object(
        new Date().toLocaleString(),
        user.auth_token,
        FUNC_BROADCAST,
        FROM_WS_AUTO_SERVER,
        "",
        MESSAGE_TYPE_AUTO,
        ws_status_msg,
        STATUS_GREEN
      );
      ws_broadcast_message(user.socket_connection, msg);
    }
  }
  on_WS_Simulator_Ready() {
    ws_status_msg = `Connected to WhatsApp!`;
    let users = active_users.get_active_userlist_by_mobile(this.mobile);
    for (let user in users) {
      let msg = get_message_object(
        new Date().toLocaleString(),
        user.auth_token,
        FUNC_BROADCAST,
        FROM_WS_AUTO_SERVER,
        "",
        MESSAGE_TYPE_AUTO,
        ws_status_msg,
        STATUS_GREEN
      );
      ws_broadcast_message(user.socket_connection, msg);
    }
  }
  on_WS_Simulator_Message(message) {
    if (message.from.match(/status@broadcast/)) {
      var messagefrom = message.author;
      var messagetype = MESSAGE_TYPE_STATUS;
    } else {
      messagefrom = message.from;
      messagetype = MESSAGE_TYPE_CHAT;
    }
    getWSContactDetails(messagefrom)
      .then((contactf) => {
        var contactfrom = contactf;
        getWSContactDetails(message.to)
          .then((contactt) => {
            var contactto = contactt;
            var fromname =
              contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
            var toname =
              contactto.name !== "" ? contactto.name : contactto.number;

            let users = active_users.get_active_userlist_by_mobile(this.mobile);
            for (let user in users) {
              let msg = get_message_object(
                new Date().toLocaleString(),
                user.auth_token,
                FUNC_BROADCAST,
                fromname,
                toname,
                messagetype,
                message.body,
                STATUS_GREEN
              );
              ws_broadcast_message(user.socket_connection, msg);
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
    if (message.fromMe == true && !message.body.match(/From Web Auto-Client/)) {
      if (message.from.match(/status@broadcast/)) {
        var messagefrom = message.author;
        var messagetype = MESSAGE_TYPE_STATUS;
      } else {
        messagefrom = message.from;
        messagetype = MESSAGE_TYPE_CHAT;
      }
      getWSContactDetails(messagefrom)
        .then((contactf) => {
          var contactfrom = contactf;
          getWSContactDetails(message.to)
            .then((contactt) => {
              var contactto = contactt;
              var fromname =
                contactfrom.name !== "" ? contactfrom.name : contactfrom.number;
              var toname =
                contactto.name !== "" ? contactto.name : contactto.number;

              let users = active_users.get_active_userlist_by_mobile(
                this.mobile
              );
              for (let user in users) {
                let msg = get_message_object(
                  new Date().toLocaleString(),
                  user.auth_token,
                  FUNC_BROADCAST,
                  fromname,
                  toname,
                  messagetype,
                  message.body,
                  STATUS_GREEN
                );
                ws_broadcast_message(user.socket_connection, msg);
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
    try {
      let contact = await this.ws_simulator.getContactById(contactid);
      return contact;
    } catch (error) {
      console.error(`Unable to get Contact Details: ${error}`);
      return error;
    }
  }
  async getWSChat(contact) {
    try {
      let chat = await contact.getChat();
      return chat;
    } catch (error) {
      console.error(`Unable to get Chat ${error}`);
      return error;
    }
  }
  async sendWSMessage(chat, message) {
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
}
