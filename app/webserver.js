const config = require("../config");

const path = require("path");
const fs = require("fs");

const extract = require("extract-zip");
const fsExtra = require("fs-extra");
const fileUpload = require("express-fileupload");

const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { createDirIfNotExist } = require("../utils/fs");

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
    const bodyParser = require("body-parser");
    app.use(bodyParser.json());
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
  }

  if (option.secure) {
    if (option.secure.helmet) {
      const helmet = require("helmet");
      app.use(helmet()); // see : https://helmetjs.github.io/
    }
    if (option.secure.cors) {
      const cors = require("cors");
      app.use(cors());
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
      if (process.env.FE_PASSWORD === undefined) {
        console.log("please fill in (FE_PASSWORD) in .env file !");
        process.exit(1);
      }
      app.put("/", async (req, res) => {
        try {
          const header = req.headers;
          if (header.password === process.env.FE_PASSWORD) {
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
