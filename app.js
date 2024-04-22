require("dotenv").config();
const puppeteer = require("puppeteer");
const { log } = require("./helpers/logger");
const {
  addDataToJSONFile,
  getKeysFromJSONFile,
} = require("./helpers/extractJSON");

(async () => {
  await scrapeData();
})();

async function scrapeData() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--window-position=0,0", "--window-size=1920,1080"],
  });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://appexchange.salesforce.com/explore/business-needs", {
    waitUntil: "networkidle0",
  });

  // Set screen size
  await page.setViewport({ width: 1920, height: 1080 });

  await page.waitForSelector(">>> ace-explore-bucket");

  const buckets = await page.$$(">>> ace-explore-bucket");

  /* Buckets */
  for (const bucket of buckets) {
    const bucketText = await bucket.$eval(">>> *", (e) => e.innerText.trim());
    const data = {};
    await bucket.click();

    log(bucketText);

    const keysFromJSONFile = await getKeysFromJSONFile();

    if (keysFromJSONFile.includes(bucketText)) {
      log("﹂ Data found in JSON file");
      continue;
    }

    let categories = await page.$$(">>> search-level2-filter-option");
    if (categories.length == 0) {
      categories = await page.$$(
        ">>> ace-filter-section >>> amc-analytics-instrument"
      );
    }

    /* Categories */
    for (const category of categories) {
      let categoryText = await category.evaluate((e) => e.innerText.trim());
      if (categoryText.length == 0) {
        categoryText = await category.$eval(">>> *", (e) => e.innerText.trim());
      }

      await category.click();
      await page.waitForNetworkIdle({ timeout: 5000 }).catch((e) => {});

      const subcategories = await category.$$(
        ">>> fieldset amc-analytics-instrument"
      );
      const currentCategory =
        (await category.$(">>> amc-analytics-instrument")) ??
        (await category.$("amc-analytics-instrument"));

      log("﹂" + categoryText);

      if (subcategories.length != 0) {
        data[categoryText] = {};

        /*  */
        for (const subcategory of subcategories) {
          const subcategoryText = await subcategory.evaluate(
            (e) => e.innerText
          );
          await subcategory.click();
          log(" ﹂" + subcategoryText);

          await page.waitForNetworkIdle();

          log("  ﹂" + (await getFilterdChipsTitle()));

          await loadlAllResults();

          const results = await getResults();

          data[categoryText][subcategoryText] = results;

          await currentCategory.click();
        }
      } else {
        log(" ﹂" + (await getFilterdChipsTitle()));

        await loadlAllResults();

        const results = await getResults();

        data[categoryText] = results;
      }
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await bucket.click();
    }

    addDataToJSONFile(bucketText, data);
  }

  await browser.close();

  log("Data fetching complated..");

  async function loadlAllResults() {
    while (true) {
      const btn = await page.$(
        '>>> ads-button[data-testid="view-more-button"]'
      );
      if (btn) {
        await btn.click();
        await page.waitForNetworkIdle({ timeout: 6000 }).catch((e) => {});
      } else {
        break;
      }
    }
  }

  async function getResults() {
    const results = await page
      .$$(">>> amc-tiles-grid:not(.sponsored-tiles) >>> ads-card")
      .catch((e) => {
        log("resluts not found");
      });

    const data = [];

    for (const result of results) {
      const title = await result
        .$eval(".title-badge-container", (e) => e.innerText.trim())
        .catch((e) => {
          log("title not found: " + e);
          return "";
        });

      const publisher = await result
        .$eval(".lwc-cmp.publisher", (e) =>
          e.innerText.replace(/^by\s+/i, "").trim()
        )
        .catch((e) => {
          log("publisher not found: " + e);
          return "";
        });

      const review = await result
        .$eval(".review-score-count", (e) => {
          const review = e.querySelectorAll("span");

          const reviewScore = review[0].innerText.trim();
          const reviewCount = review[1].innerText.replace(/[()]/g, "").trim();

          return {
            count: reviewCount,
            score: reviewScore,
          };
        })
        .catch((e) => {
          return {};
        });

      const desc = await result
        .$eval(".lwc-cmp.description", (e) => e.innerText.trim())
        .catch((e) => {
          log("description not found: " + e);
          return "";
        });

      const tags = await result
        .$$eval("ads-tag", (e) =>
          Array.from(e, (e) =>
            e.shadowRoot.querySelector("a.tag").innerText.trim()
          )
        )
        .catch((e) => {
          log("tag not found: " + e);
          return [];
        });

      data.push({
        title,
        publisher,
        review,
        description: desc,
        tags,
      });
    }

    return data;
  }

  async function getFilterdChipsTitle() {
    await page
      .waitForSelector(">>> p.chips-title", { timeout: 3000 })
      .catch((e) => {});

    const title = await page
      .$eval(">>> p.chips-title", (e) => e.innerText)
      .catch((e) => "-");

    const regex = /\d+ results/;
    const match = title.match(regex);

    if (match) {
      const result = match[0];
      return result;
    }
    return "";
  }
}
