const express = require("express");
const cookieParser = require("cookie-parser");
var crypto = require("crypto");
const secret = require("./secret.json");

const app = express();
app.use(cookieParser(secret.FLAG));

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

app.listen(3003, "0.0.0.0");

app.on("listening", onListening);
app.on("error", onError);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
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