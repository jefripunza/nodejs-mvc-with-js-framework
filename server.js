console.log("\033[2J"); // clear CLI
require("dotenv").config(); // add .env

// ======================== App ========================
// Webserver
const { app, webserver } = require("./app/webserver")({
  remoteFrontendPackage: true,
  bodyParser: true,
  secure: {
    helmet: true,
    cors: true,
    allowOrigin: "*",
    allowHeaders: "x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *",
  },
  public: true,
  debug: true,
});

// Web Socket
const io = require("./app/websocket")({
  app,
  webserver,
  // debug: true,
});

// ======================== Bot ========================

// ========= Test Area =========
require("./test")({
  app,
  webserver,
  io,
});
