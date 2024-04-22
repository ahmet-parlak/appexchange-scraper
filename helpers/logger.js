const fs = require("fs");
const path = require("path");
const { timestamp, getCurrentDateTime } = require("./timestamp");

const logFileDir = path.join(__dirname, `../log`);
const logFilePath = path.join(__dirname, `../log/${getCurrentDateTime()}.log`);

fs.stat(logFileDir, (err, stats) => {
  if (!(err === null && stats.isDirectory())) {
    fs.mkdir(logFileDir, (err) => {
      if (err) {
        console.error(
          "An error occurred while creating the log directory",
          err
        );
      }
    });
  }
});

exports.log = (data) => {
  const logStream = fs.createWriteStream(logFilePath, { flags: "a" });
  console.log(data);
  logStream.write(`${timestamp()} - ${data}\n`);
};
