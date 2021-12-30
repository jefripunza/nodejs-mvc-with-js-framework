console.log("\033[2J"); // clear CLI
require("dotenv").config(); // add .env

// ======================== App ========================
// Webserver
// Set Content Security Policies
const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
const styleSources = ["'self'", "'unsafe-inline'"];
const connectSources = ["'self'"];
const { app, webserver } = require("./app/webserver")({
  remoteFrontendPackage: true,
  bodyParser: true,
  secure: {
    parameterPollution: true,
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: scriptSources,
      scriptSrcElem: scriptSources,
      styleSrc: styleSources,
      connectSrc: connectSources,
    },
    helmet: true,
    cors: true,
    cookie: "your-secret-key", // csrf ? http://expressjs.com/en/resources/middleware/csurf.html
    allowOrigin: "*",
    allowHeaders:
      "x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *",
  },
  public: true,
  debug: true,
});

// Web Socket
const io = require("./app/websocket")({
  app,
  webserver,
  debug: true,
});

// Mailer
const Mailer = require("./app/mailer");
const mail = new Mailer({
  //// easy to use
  service: "gmail",

  // --- or ---

  //// manual ~> https://nodemailer.com/smtp/customauth/
  // host: "smtp.gmail.com",
  // port: 587, // Port for TLS/STARTTLS
  // secure: false, // true for 465, false for other ports
});
mail.use(app);

// ======================== Bot ========================

// ========= Test Area =========
require("./test")({
  app,
  webserver,
  io,
});
