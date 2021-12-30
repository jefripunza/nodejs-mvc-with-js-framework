const config = require("../config");
const { createDirIfNotExist } = require("../utils/fs");

const path = require("path");
const fs = require("fs");

// security
const bodyParser = require("body-parser");
const hpp = require('hpp');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require("helmet");
const cors = require("cors");

// RFP require this...
const extract = require("extract-zip");
const fsExtra = require("fs-extra");
const fileUpload = require("express-fileupload");

// Webserver
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);


module.exports = (option = {}) => {
  const webserver = server.listen(config.app.port, config.app.host, () => {
    if (option.debug) {
      require("dns").lookup(
        require("os").hostname(),
        function (err, ip_dns, fam) {
          console.log(
            [
              "Server is running at",
              `http://localhost:${config.app.port}`,
              `http://${ip_dns}:${config.app.port}`,
              `http://${config.app.local_ip}:${config.app.port}`,
            ].join("\n ")
          );
        }
      );
    }
  });

  // ======================== Middlewares ========================
  require("../middlewares/webserver")(app);
  app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "GET, PUT, POST, PATCH, DELETE, OPTIONS"
      );
      res.setHeader("Access-Control-Allow-Credentials", true);
      return res.status(200).json({});
    }
    next();
  });

  // ======================== Options ========================
  if (option.bodyParser) {
    app.use(bodyParser.json());
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
  }

  if (option.secure) {
    if (option.secure.parameterPollution) {
      app.use(hpp());
    }
    if (option.secure.contentSecurityPolicy) {
      app.use(helmet.contentSecurityPolicy({
        directives: option.secure.contentSecurityPolicy,
      }));
    }
    if (option.secure.helmet) {
      app.use(helmet()); // see : https://helmetjs.github.io/
    }
    if (option.secure.cors) {
      app.use(cors());
    }
    if (option.secure.cookie) {
      app.use(cookieParser());
      app.use(
        session({
          secret: option.secure.cookie,
          resave: false,
          saveUninitialized: false,
        }),
      );
    }
    if (option.secure.allowOrigin) {
      app.use((req, res, next) => {
        // .htaccess replacement
        res.header("Access-Control-Allow-Origin", option.secure.allowOrigin);
        next();
      });
    }
    if (option.secure.allowHeaders) {
      app.use((req, res, next) => {
        // .htaccess replacement
        res.header("Access-Control-Allow-Headers", option.secure.allowHeaders);
        next();
      });
    }
  }

  if (option.debug) {
    const morgan = require("morgan");
    if (!config.isProduction) {
      app.use(morgan("dev"));
    }
  }

  // enable files upload
  app.use(
    fileUpload({
      createParentPath: true,
      limits: {
        fileSize: 20 * 1024 * 1024 * 1024, // 20MB max file(s) size
      },
    })
  );

  // ======================== Add All Routes ========================
  fs.readdir(path.join(__dirname, "..", "routes"), function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    files.forEach(function (route) {
      require("../routes/" + route)(app);
    });

    // remote package
    if (option.remoteFrontendPackage) {
      const rfp = crypto.randomBytes(20).toString('hex');
      fs.writeFileSync(path.join(__dirname, "..", ".rfp"), rfp)
      if (option.debug) {
        console.log({ rfp });
      }
      app.put("/", async (req, res) => {
        try {
          const header = req.headers;
          if (header.password === rfp) {
            if (!req.files) {
              res.send({
                status: false,
                message: "No file uploaded",
              });
            } else {
              //Use the name of the input field (i.e. "files") to retrieve the uploaded file
              let zip_file = req.files.zip_file;
              const zip_extract = path.join(__dirname, "..", "js-framework");
              const zip_save = path.join(zip_extract, zip_file.name);

              await fsExtra.emptyDirSync(zip_extract);
              console.log("Empty Directory complete");

              await zip_file.mv(zip_save);
              console.log("Save ZIP complete");

              await extract(zip_save, { dir: zip_extract });
              console.log("Extraction complete");

              await fs.unlinkSync(zip_save);
              console.log("Delete ZIP complete");

              res.status(200).json({
                success: true,
                message: "frontend sudah terbarui",
              });
            }
          } else {
            res.status(403).json({
              success: false,
              message: "password salah...",
            });
          }
        } catch (err) {
          res.status(500).send(err);
        }
      });
    }

    const js_framework = path.join(__dirname, "..", "js-framework");
    createDirIfNotExist(js_framework); // wajib
    app.use(express.static(js_framework)); // priorities
    if (option.public) {
      // if use public directory
      const public_dir = path.join(__dirname, "..", "public");
      createDirIfNotExist(public_dir);
      app.use(express.static(public_dir));
    }
    app.get("*", (req, res) => {
      res.sendFile(path.join(js_framework, "index.html"));
    });
  });

  return {
    app,
    webserver,
  };
};
