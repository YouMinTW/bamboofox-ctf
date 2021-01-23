const express = require("express");
const cookieParser = require("cookie-parser");
var crypto = require("crypto");
const secret = require("./secret.json");
var debug = require("debug")("express:server");
var http = require("http");

const app = express();
app.use(cookieParser(secret.FLAG));


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);



let canvas = {
  ...Array(128)
    .fill(null)
    .map(() => new Array(128).fill("#FFFFFF")),
};

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

app.get("/", (req, res) => {
  if (!req.signedCookies.user)
    res.cookie("user", { admin: false }, { signed: true });

  res.sendFile(__dirname + "/index.html");
});

app.get("/source", (_, res) => {
  res.sendFile(__filename);
});

app.get("/api/canvas", (_, res) => {
  res.json(canvas);
});

app.get("/api/draw", (req, res) => {
  let { x, y, color } = req.query;
  if (x && y && color) canvas[x][y] = color.toString();
  res.json(canvas);
});

app.get("/promote", (req, res) => {
  if (req.query.yo_i_want_to_be === "admin")
    res.cookie("user", { admin: true }, { signed: true });
  res.send('Great, you are admin now. <a href="/">[Keep Drawing]</a>');
});

app.get("/flag", (req, res) => {
  let userData = { isGuest: true };
  if (req.signedCookies.user && req.signedCookies.user.admin === true) {
    userData.isGuest = false;
    userData.isAdmin = req.cookies.admin;
    userData.token = secret.ADMIN_TOKEN;
  }

  if (
    req.query.token &&
    req.query.token.match(/[0-9a-f]{16}/) &&
    hash(`${req.connection.remoteAddress}${req.query.token}`) === userData.token
  )
    res.send(secret.FLAG);
  else res.send("NO");
});



/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

