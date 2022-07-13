'use strict';

const ws_web_auto = require("./ws_web_auto");

exports.active_users = class active_users {
  static users = [];
  static ws_broadcast_message;
  static get_message_object;
  constructor() {}
  static add_user(mobile, auth_token, get_message_object, ws_broadcast_message, socket_connection = undefined) {
    this.ws_broadcast_message = ws_broadcast_message;
    this.get_message_object = get_message_object;
    let userlist = this.get_active_userlist_by_mobile(mobile);

    if (userlist == undefined || userlist == null) {
      let ws_instance = new ws_web_auto.ws_web_auto(mobile, get_message_object, ws_broadcast_message);
      this.users.push({
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
        if (userlist[i].socket_connection?.id == socket_connection?.id) {
          found++;
        }
      }
      if (found == 0) {
        this.users.push({
          mobile: mobile,
          auth_token: auth_token,
          socket_connection: socket_connection,
          ws_web_auto_instance: userlist[0].ws_web_auto_instance,
        });
        console.log(
          `Added Active User with Mobile-${mobile}, Auth Token-${auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${userlist[0].ws_web_auto_instance}`
        );
      } else{
        console.log(`Error - User Already Exist with with Mobile-${mobile}, Auth Token-${auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${userlist[0].ws_web_auto_instance}`);
        throw `Error - User Already Exist with with Mobile-${mobile}, Auth Token-${auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${userlist[0].ws_web_auto_instance}`;        
      }
    }
  }
  static destroy_ws_simulator(mobile, ws_simulator_instance) {
    let found = 0;
    for (let user in this.users) {
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
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].mobile == mobile)
        console.log(
          `Removing Active User with Mobile-${this.users[i].mobile}, Auth Token-${this.users[i].auth_token}, Socket Connection-${this.users[i].socket_connection}, WS Web Instance-${this.users[i].ws_web_auto_instance}`
        );
      lastuser = this.users[i];
      this.users.splice(i, 1);
    }
    this.destroy_ws_simulator(mobile, lastuser.ws_web_auto_instance);
  }
  static remove_user_by_auth_token(auth_token) {
    let lastuser;
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].auth_token == auth_token)
        console.log(
          `Removing Active User with Mobile-${this.users[i].mobile}, Auth Token-${this.users[i].auth_token}, Socket Connection-${this.users[i].socket_connection}, WS Web Instance-${this.users[i].ws_web_auto_instance}`
        );
      lastuser = this.users[i];
      this.users.splice(i, 1);
    }
    this.destroy_ws_simulator(lastuser.mobile, lastuser.ws_web_auto_instance);
  }
  static remove_user_by_socket(socket_connection) {
    let lastuser;
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].socket_connection?.id == socket_connection?.id)
        console.log(
          `Removing Active User with Mobile-${this.users[i].mobile}, Auth Token-${this.users[i].auth_token}, Socket Connection-${this.users[i].socket_connection}, WS Web Instance-${this.users[i].ws_web_auto_instance}`
        );
      lastuser = this.users[i];
      this.users.splice(i, 1);
    }
    this.destroy_ws_simulator(lastuser.mobile, lastuser.ws_web_auto_instance);
  }
  static update_socket_conn_by_auth_token(auth_token, socket_connection) {
    for (let i = 0; i < this.users.length; i++) {
      if (
        this.users[i].auth_token == auth_token &&
        this.users[i].socket_connection == undefined
      ) {
        console.log(
          `Updating Socket Connection for Active User with Mobile-${this.users[i].mobile}, Auth Token-${this.users[i].auth_token}, Socket Connection-${socket_connection}, WS Web Instance-${this.users[i].ws_web_auto_instance}`
        );
        this.users[i].socket_connection = socket_connection;
      }
    }
  }
  static update_ws_instance_by_auth_token(auth_token, ws_web_auto_instance) {
    for (let i = 0; i < this.users.length; i++) {
      if (
        this.users[i].auth_token == auth_token &&
        this.users[i].ws_web_auto_instance == undefined
      ) {
        console.log(
          `Updating WS Web Auto Instance for Active User with Mobile-${this.users[i].mobile}, Auth Token-${this.users[i].auth_token}, Socket Connection-${this.users[i].socket_connection}, WS Web Instance-${this.users[i].ws_web_auto_instance}`
        );
        this.users[i].ws_web_auto_instance = ws_web_auto_instance;
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
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].auth_token == auth_token) {
        userlist.push(this.users[i]);
      }
    }
    if (userlist.length !== 0) {
      return userlist;
    }
  }
  static get_active_user_by_socket(socket_connection) {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].socket_connection?.id == socket_connection?.id) {
        return this.users[i];
      }
    }
  }
}