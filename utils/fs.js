const fs = require("fs");

module.exports = {
  createDirIfNotExist: (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  },
};
