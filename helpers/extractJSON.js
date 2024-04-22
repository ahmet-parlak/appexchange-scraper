const fs = require("fs");
const path = require("path");
const { log } = require("./logger");

let fileName = process.env.OUTPUT_FILE_NAME ?? "data.json";

if (!fileName.endsWith(".json")) fileName += ".json";

const jsonFileDir = path.join(__dirname, `../output`);
const jsonFilePath = path.join(__dirname, `../output/${fileName}`);

fs.stat(jsonFileDir, (err, stats) => {
  if (!(err === null && stats.isDirectory())) {
    fs.mkdir(jsonFileDir, (err) => {
      if (err) {
        console.error(
          "An error occurred while creating the output directory",
          err
        );
      }
    });
  }
  /* Create/Read JSON File */
  if (fs.existsSync(jsonFilePath)) {
    log(fileName + " found..");
  } else {
    const dataJSON = JSON.stringify({}, null, 2);
    fs.writeFile(jsonFilePath, dataJSON, (err) => {
      if (err) {
        console.error("Error occured:", err);
        return;
      }
      log(fileName + " created..");
    });
  }
});

function addDataToJSONFile(key, value) {
  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("File couldn't read:", err);
      return;
    }

    const existingData = JSON.parse(data);

    existingData[key] = value;

    fs.writeFile(
      jsonFilePath,
      JSON.stringify(existingData, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("An error occured:", err);
          return;
        }
        log(`${key} data added to JSON file.`);
      }
    );
  });
}

async function getKeysFromJSONFile() {
  try {
    const data = fs.readFileSync(jsonFilePath, "utf8");
    const jsonData = JSON.parse(data);
    const keys = Object.keys(jsonData);

    return keys;
  } catch (err) {
    console.error("Error occured:", err);
    throw err;
  }
}

module.exports = {
  addDataToJSONFile,
  getKeysFromJSONFile,
};
