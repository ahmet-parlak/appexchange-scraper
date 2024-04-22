const fs = require("fs");
const path = require("path");
const { timestamp, getCurrentDateTime } = require("./timestamp");

const logFilePath = path.join(__dirname, `../log/${getCurrentDateTime()}.log`);

exports.log = (data) => {
  const logStream = fs.createWriteStream(logFilePath, { flags: "a" });
  console.log(data);
  logStream.write(`${timestamp()} - ${data}\n`);
};
