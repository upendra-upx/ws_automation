function route(stream, headers) {
  console.log(headers[":path"]);

  function statCheck(stat, headers) {
    headers["last-modified"] = stat.mtime.toUTCString();
  }

  function onError(err) {
    // stream.respond() can throw if the stream has been destroyed by
    // the other side.
    try {
      if (err.code === "ENOENT") {
        stream.respond({ ":status": 404 });
      } else {
        stream.respond({ ":status": 500 });
      }
    } catch (err) {
      // Perform actual error handling.
      console.log(err);
    }
  }

  var path = headers[":path"];

  switch (path) {

    case `/ws_auto.css`:
      stream.respondWithFile(
        "ws_auto.css",
        { "content-type": "text/css; charset=utf-8" },
        { statCheck, onError }
      );

    case `/client.js`:
      stream.respondWithFile(
        "client.js",
        { "content-type": "text/javascript; charset=utf-8" },
        { statCheck, onError }
      );

    case `/favicon.ico`:
      stream.respondWithFile(
        "favicon.ico/",
        { "content-type": "image/x-icon;" },
        { statCheck, onError }
      );    

    case `/`:
      stream.respondWithFile(
        "ws_auto.html",
        { "content-type": "text/html; charset=utf-8" },
        { statCheck, onError }
      );
      /* stream.respond({ ":status": 200 });
      stream.pushStream({ ":path": "/" }, (err, pushStream, headers) => {
        if (err) throw err;
        pushStream.respond({ ':status': 200 }); 
        pushStream.respondWithFile(
          "ws_auto.html",
          { "content-type": "text/html; charset=utf-8" },
          { statCheck, onError }
        );
        pushStream.respondWithFile(
          "ws_auto.css",
          { "content-type": "text/css; charset=utf-8" },
          { statCheck, onError }
        );
        pushStream.respondWithFile(
          "client.js",
          { "content-type": "text/javascript; charset=utf-8" },
          { statCheck, onError }
        );
        pushStream.respondWithFile(
          "favicon.ico/",
          { "content-type": "image/x-icon;" },
          { statCheck, onError }
        );
        pushStream.end("");
      }); */

  };
}

module.exports = { route };
