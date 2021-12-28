/**
    production to backend
    execute = yarn add -D archiver axios
 */

const fs = require("fs");
const path = require("path");

const FormData = require("form-data");
const archiver = require("archiver");
const axios = require("axios");

const zip_name = "target.zip";
const backend_url = "http://localhost:5000";
const password = "jadi_juara";
const build_dir = process.argv[2] ? process.argv[2] : "build";

const output = fs.createWriteStream(zip_name);
const archive = archiver("zip");

output.on("close", async function () {
  console.log(archive.pointer() + " total bytes");
  console.log(
    "archiver has been finalized and the output file descriptor has closed."
  );

  const zip_file = await fs.readFileSync(path.join(__dirname, zip_name));

  const form = new FormData();
  form.append("zip_file", zip_file, "file.zip");

  console.log("............................");

  await axios({
    method: "put",
    url: backend_url,
    headers: {
      ...form.getHeaders(),
      password,
    },
    data: form,
  })
    .then((response) => {
      if (response.data.status) {
        console.log({ response, data: response.config.data });
      } else {
        console.log(response.data.message);
      }
    })
    .catch((error) => {
      console.log({ error: error.response.data });
    })
    .finally(() => {
      setTimeout(() => {
        fs.unlinkSync(zip_name);
        console.log("DELETE...");
      }, 3000);
    });
});

archive.on("error", function (err) {
  throw err;
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory(path.join(__dirname, build_dir), false);

archive.finalize();
