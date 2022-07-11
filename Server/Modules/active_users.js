const ws_web_auto = require("./ws_web_auto");

module.exports = class active_users {
  static users = [];
  static ws_broadcast_message;
  static get_message_object;
  constructor() {}
  static add_user(mobile, auth_token, get_message_object, ws_broadcast_message, socket_connection = undefined) {
    this.ws_broadcast_message = ws_broadcast_message;
    this.get_message_object = get_message_object;
    let userlist = get_active_userlist_by_mobile(mobile);

    if (userlist == undefined || userlist == null) {
      let ws_instance = new ws_web_auto(mobile, get_message_object, ws_broadcast_message);
      users.push({
        mobile: mobile,
        auth_token: auth_token,
        socket_connection: socket_connection,
        ws_web_auto_instance: ws_instance,
      });
      console.log(
        `Added Active User with Mobile-${mobile}, Auth Token-${auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${ws_instance}`
      );
    } else {
      let found = 0;
      for (let i = 0; i < userlist.length; i++) {
        if (userlist[i].socket_connection == socket_connection) {
          found++;
        }
      }
      if (found == 0) {
        users.push({
          mobile: mobile,
          auth_token: auth_token,
          socket_connection: socket_connection,
          ws_web_auto_instance: userlist[0].ws_web_auto_instance,
        });
        console.log(
          `Added Active User with Mobile-${mobile}, Auth Token-${auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${userlist[0].ws_web_auto_instance}`
        );
      }
    }
  }
  static destroy_ws_simulator(mobile, ws_simulator_instance) {
    let found = 0;
    for (let user in users) {
      if (user.mobile == mobile) {
        found++;
      }
    }
    if (found == 0) {
      ws_simulator_instance?.get_ws_simulator()?.destroy();
      delete arguments[1];
    }
  }

  static remove_user_by_mobile(mobile) {
    let lastuser;
    for (let i = 0; i < users.length; i++) {
      if (users[i].mobile == mobile)
        console.log(
          `Removing Active User with Mobile-${users[i].mobile}, Auth Token-${users[i].auth_token}, Socket Connection-${users[i].socket_connection}, WS Web Instance-${users[i].ws_web_auto_instance}`
        );
      lastuser = users[i];
      users.splice(i, 1);
    }
    destroy_ws_simulator(mobile, lastuser.ws_web_auto_instance);
  }
  static remove_user_by_auth_token(auth_token) {
    let lastuser;
    for (let i = 0; i < users.length; i++) {
      if (users[i].auth_token == auth_token)
        console.log(
          `Removing Active User with Mobile-${users[i].mobile}, Auth Token-${users[i].auth_token}, Socket Connection-${users[i].socket_connection}, WS Web Instance-${users[i].ws_web_auto_instance}`
        );
      lastuser = users[i];
      users.splice(i, 1);
    }
    destroy_ws_simulator(lastuser.mobile, lastuser.ws_web_auto_instance);
  }
  static remove_user_by_socket(socket_connection) {
    let lastuser;
    for (let i = 0; i < users.length; i++) {
      if (users[i].socket_connection == socket_connection)
        console.log(
          `Removing Active User with Mobile-${users[i].mobile}, Auth Token-${users[i].auth_token}, Socket Connection-${users[i].socket_connection}, WS Web Instance-${users[i].ws_web_auto_instance}`
        );
      lastuser = users[i];
      users.splice(i, 1);
    }
    destroy_ws_simulator(lastuser.mobile, lastuser.ws_web_auto_instance);
  }
  static update_socket_conn_by_auth_token(auth_token, socket_connection) {
    for (let i = 0; i < users.length; i++) {
      if (
        users[i].auth_token == auth_token &&
        users[i].socket_connection == undefined
      ) {
        console.log(
          `Updating Socket Connection for Active User with Mobile-${users[i].mobile}, Auth Token-${users[i].auth_token}, Socket Connection-${users[i].socket_connection}, WS Web Instance-${users[i].ws_web_auto_instance}`
        );
        users[i].socket_connection == socket_connection;
      }
    }
  }
  static update_ws_instance_by_auth_token(auth_token, ws_web_auto_instance) {
    for (let i = 0; i < users.length; i++) {
      if (
        users[i].auth_token == auth_token &&
        users[i].ws_web_auto_instance == undefined
      ) {
        console.log(
          `Updating WS Web Auto Instance for Active User with Mobile-${users[i].mobile}, Auth Token-${users[i].auth_token}, Socket Connection-${users[i].socket_connection}, WS Web Instance-${users[i].ws_web_auto_instance}`
        );
        users[i].ws_web_auto_instance == ws_web_auto_instance;
      }
    }
  }
  static get_active_userlist_by_mobile(mobile) {
    let userlist = [];
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].mobile == mobile) {
        userlist.push(this.users[i]);
      }
    }
    if (userlist.length !== 0) {
      return userlist;
    }
  }
  static get_active_userlist_by_auth_token(auth_token) {
    let userlist = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].auth_token == auth_token) {
        userlist.push(users[i]);
      }
    }
    if (userlist.length !== 0) {
      return userlist;
    }
  }
  static get_active_user_by_socket(socket_connection) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].socket_connection == socket_connection) {
        return users[i].socket_connection;
      }
    }
  }
}