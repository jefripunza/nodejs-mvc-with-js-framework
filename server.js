console.log('\033[2J'); // clear CLI
require("dotenv").config() // add .env


// ======================== App ========================
// Webserver
const {
    app,
    webserver,
} = require("./app/webserver")({
    remotePackage: true,
    bodyParser: true,
    secure: true,
    public: true,
    debug: true,
})

// Web Socket
const io = require('./app/websocket')({
    app,
    webserver,
    // debug: true,
})



// ======================== Bot ========================



// ========= Test Area =========
require("./test")({
    app,
    webserver,
    io,
})