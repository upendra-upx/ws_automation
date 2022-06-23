const http2 = require("http2");
const fs = require("fs");


const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const hostname = "127.0.0.1";
const port = "80";

var ws_delivered = false;
var ws_message_sent;
var ws_status_msg;

const ws_server = http2.createSecureServer({
  key:  fs.readFileSync("./certificates/localhost-private.pem"),
  cert: fs.readFileSync("./certificates/localhost-cert.pem"),
});

ws_server.on("stream", (stream, Headers) => {
  stream.respond({
    "content-type": "text/html",
    "status": 200,
  });

  // Initiate WS Automation and Send Message
  // Use the saved values
  const client = new Client({
    authStrategy: new LocalAuth(),
  });

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("QR generated!");
    ws_status_msg = "QR generated!";
    writestream(stream);
  });
  

  client.on("ready", () => {
    console.log("Client is ready!");
    ws_status_msg = "Client is ready!";
    writestream(stream);

    client.getContactById("919953225780@c.us").then((contact) => {
      contact.getChat().then((chat) => {
        chat.sendMessage("Say i love you!").then((message) => {
 
          ws_message_sent = message.body;
          ws_delivered = true;
          ws_status_msg = "Message Sent!";
          writestream(stream);
          ws_status_msg = "Message Processing Completed!";
          writestream(stream);
          console.log(ws_status_msg);    
        });
      });
    });
  });

  client.on("message", (message) => {
    console.log(message.body);
    let pattern = /love/i;
    if (message.from == '919953225780@c.us' && message.body.match(pattern)) {
      ws_status_msg = "Message receieved - " + message.from + " : "+ message.body;
      writestream(stream);
      message.reply('i love you too!');
    } else {
      ws_status_msg = "Message receieved - " + message.from + " : "+ message.body;
      writestream(stream);
    };
    //stream.end();
  });

  
  client.initialize();

});

function writestream(stream){
  stream.write("<br>" + Date.now() + " " + ws_status_msg);
};

ws_server.listen(port, () => {
  console.log("Server started on Port: " + port);
});
