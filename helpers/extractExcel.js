const Excel = require("exceljs");
const fs = require("node:fs/promises");
const path = require("path");
require("dotenv").config();

let fileName = process.env.OUTPUT_FILE_NAME ?? "data.json";
if (!fileName.endsWith(".json")) fileName += ".json";
const filePath = path.join(__dirname, `../output/${fileName}`);

let excelFileName = process.env.EXCEL_OUTPUT_FILE_NAME ?? "data.xlsx";
if (!excelFileName.endsWith(".xlsx")) excelFileName += ".xlsx";
const excelFilePath = path.join(__dirname, `../output/${excelFileName}`);

/* Create Excell Workbook */
const workbook = new Excel.Workbook();
let data = null;
exports.extractExcel = async () => {
  /* Get Data From JSON File */
  data = await getDataFromFile();
  if (!data) {
    console.log("Data is empty or not found");
    return;
  }

  /* Get MainCategories */
  const sheetsData = Object.keys(data);

  /* Create Sheets & Add Data */
  for (const sheet of sheetsData) {
    createWorksheet(sheet);
  }

  /* Extract Excel File */
  await workbook.xlsx.writeFile(excelFilePath);

  console.log("Excel extracted");
};

/* Read JSON Data From File */
async function getDataFromFile() {
  try {
    const data = await fs.readFile(filePath, { encoding: "utf8" });
    return JSON.parse(data);
  } catch (err) {
    console.log(err);
    return null;
  }
}

/* Create Sheeet */
function createWorksheet(sheetName) {
  const worksheet = workbook.addWorksheet(sheetName);
  /* Sheet Columns */
  worksheet.columns = [
    { header: "#", key: "index" },
    { header: "Title", key: "title" },
    { header: "Publisher", key: "publisher" },
    { header: "Review(Count)", key: "review_count" },
    { header: "Review(Score)", key: "review_score" },
    { header: "Description", key: "description" },
    { header: "Tags", key: "tags" },
  ];
  worksheet.getRow(1).font = { bold: true };

  console.log(sheetName, "sheet created");

  /* Get Categories */
  const categories = Object.keys(data[sheetName]);

  categories.forEach((category) => {
    /* If subcategory doesn't exists */
    if (Array.isArray(data[sheetName][category])) {
      addCategoryToSheet(worksheet, category);
      addDataToSheet(worksheet, data[sheetName][category]);
    } else {
      /* If subcategory exists */
      const subcategories = Object.keys(data[sheetName][category]);

      subcategories.forEach((subcategory) => {
        addCategoryToSheet(worksheet, `${category} (${subcategory})`);
        addDataToSheet(worksheet, data[sheetName][category][subcategory]);
      });
    }
  });
  console.log("✔", sheetName, "data added to sheet");
}

/* Add Category to Sheet */
function addCategoryToSheet(worksheet, categoryName) {
  const categoryRowData = {
    index: categoryName,
  };
  const categoryRow = worksheet.addRow(categoryRowData);
  categoryRow.eachCell(function (cell, colNumber) {
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  const range =
    worksheet.getColumn("A").letter +
    categoryRow.number +
    ":" +
    worksheet.getColumn("G").letter +
    categoryRow.number;

  worksheet.getCell(range).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF00" },
  };

  worksheet.mergeCells(`A${categoryRow.number}:G${categoryRow.number}`);
}

/* Add Data to Sheet */
function addDataToSheet(worksheet, data) {
  data.forEach((element, index) => {
    worksheet.addRow({
      index: index + 1,
      title: element?.title ?? "",
      publisher: element?.publisher ?? "",
      review_count: element?.review?.count ?? "",
      review_score: element?.review?.score ?? "",
      description: element?.description ?? "",
      tags: element?.tags.toString(),
    });
  });
}
