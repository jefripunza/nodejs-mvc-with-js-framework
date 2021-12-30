"use strict";
const nodemailer = require("nodemailer");

class Mailer {
  constructor(option) {
    if (
      process.env.MAILER_EMAIL === undefined ||
      process.env.MAILER_PASS === undefined
    ) {
      console.log("please fill in (MAILER_EMAIL, MAILER_PASS) in .env file !");
      process.exit(1);
    }
    this.connection = nodemailer.createTransport({
      ...option,
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASS,
      },
    });
  }
  /**
   *
   * @param {*} value
   * @returns
   */
  isArray(value) {
    return typeof value === "object" && Array.isArray(value) && value !== null;
  }
  /**
   *
   * @param {string|array} emailTarget
   * @param {string} subject
   * @param {string} html
   * @returns
   */
  sendTo = async (emailTarget, subject, html) => {
    let to = "";
    if (this.isArray(emailTarget)) {
      to = emailTarget.join(", ");
    } else {
      to = emailTarget;
    }
    return new Promise(async (resolve, reject) => {
      this.connection.sendMail(
        {
          from: process.env.MAILER_EMAIL,
          to,
          subject,
          html,
        },
        function (error, info) {
          if (error) {
            resolve({
              success: false,
              response: error,
            });
          } else {
            resolve({
              success: true,
              response: info.response,
            });
          }
        }
      );
    });
  };
  /**
   *
   * @param {*} app
   */
  use = (app) => {
    app.use((req, res, next) => {
      req.mailer = this;
      next();
    });
  };
}

module.exports = Mailer;
