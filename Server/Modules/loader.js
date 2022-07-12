'use strict';

const userSchema = require(`../../Models/userschema`);
const active_users = require(`./active_users`);
const { v4: uuidv4 } = require("uuid");

async function route(request, response, db, get_message_object, ws_broadcast_message) {
  var ip_headers = request.headers;
  var op_stream = response.stream;
  console.log(ip_headers[":path"]);

  function statCheck(stat, ip_headers) {
    ip_headers["last-modified"] = stat.mtime.toUTCString();
  }

  function onError(err) {
    // op_stream.respond() can throw if the op_stream has been destroyed by
    // the other side.
    try {
      if (err.code === "ENOENT") {
        op_stream.respond({ ":status": 404 });
      } else {
        op_stream.respond({ ":status": 500 });
      }
    } catch (err) {
      // Perform actual error handling.
      console.log(err);
    }
    op_stream.end();
  }

  var path = ip_headers[":path"];

  switch (path) {
    case `/ws_auto.css`:
      op_stream.respondWithFile(
        "./Client/ws_auto.css",
        { "content-type": "text/css; charset=utf-8" },
        { statCheck, onError }
      );
      break;

    case `/client.js`:
      op_stream.respondWithFile(
        "./Client/client.js",
        { "content-type": "text/javascript; charset=utf-8" },
        { statCheck, onError }
      );
      break;

    case `/favicon.ico`:
      op_stream.respondWithFile(
        "./Client/favicon.ico/",
        { "content-type": "image/x-icon;" },
        { statCheck, onError }
      );
      break;

    case `/authenticate`:
      if (db?.readyState == 1) {
        try {
          var credentials = JSON.parse(ip_headers[`x-authenticate`]);
          const dbusers = await userSchema.find({
            mobile: credentials.mobile,
            password: credentials.password,
            active: true
          });
          if (dbusers?.length == 1) {
              // Check existing Active Users with this Mobile Number.
              let users = active_users.active_users.get_active_userlist_by_mobile(
                credentials.mobile
              );

              response.writeHead(201);

              if (users == undefined || users == null) {
                // If No Active User
                let auth_token = uuidv4();
                active_users.active_users.add_user(credentials.mobile, auth_token, get_message_object, ws_broadcast_message);
                response.write(auth_token);
              } else {
                active_users.active_users.add_user(credentials.mobile, users[0].auth_token, get_message_object, ws_broadcast_message);                
                response.write(users[0].auth_token);
              }

              response.end();
          } else {
            console.error(`User not found: ${credentials}`);
            response.writeHead(404);
            response.end();
          }
        } catch (error) {
          console.error(error);
          response.writeHead(500);
          response.end();
        }
      }
      break;

    case `/signup`:
      if (db?.readyState == 1) {
        try {
          var credentials = JSON.parse(ip_headers[`x-authenticate`]);
          const dbusers = await userSchema.find({
            mobile: credentials.mobile,
            password: credentials.password,
          });

          if (dbusers?.length == 0) {
            try {
              const newdbuser = new userSchema({
                mobile: credentials.mobile,
                password: credentials.password,
              });
              const dbuser = await newdbuser.save();
              // Check existing Active Users with this Mobile Number.
              let users = active_users.active_users.get_active_userlist_by_mobile(
                credentials.mobile
              );

              response.writeHead(201);

              if (users == undefined || users == null) {
                // If No Active User
                let auth_token = uuidv4();
                active_users.active_users.add_user(credentials.mobile, auth_token, get_message_object, ws_broadcast_message);
                response.write(auth_token);
              } else {
                active_users.active_users.add_user(credentials.mobile, users[0].auth_token, get_message_object, ws_broadcast_message);                       
                response.write(users[0].auth_token);
              }

              response.end();
              
            } catch (error) {
              console.error(error);
              console.error(error);
              response.writeHead(400);
              response.end();
            }
          } else {
            response.writeHead(400);
            response.end();
          }
        } catch (error) {
          console.error(error);
          response.writeHead(400);
          response.end();
        }
      }
      break;

    case `/`:
      op_stream.respondWithFile(
        "./Client/ws_auto.html",
        { "content-type": "text/html; charset=utf-8" },
        { statCheck, onError }
      );
      break;
  }
}

module.exports = { route};