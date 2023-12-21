import puppeteer from "puppeteer";
import * as csv from "fast-csv";
import * as path from "path";
import { fileURLToPath } from "url";
import { formatDate, isElementVisible } from "./helpers/helper.js";
var locale = process.argv[2];
var consent = process.argv[3];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.time("start");
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const today = formatDate(new Date());

  // Set Viewport
  await page.setViewport({ width: 1280, height: 1024 });

  await page.goto(
    `https://www.herbalife.com/${locale}/u/category/all-products`
  );

  const acceptConsent = "#onetrust-accept-btn-handler";
  const rejectConsent = "#onetrust-reject-all-handler";

  let isConsentVisible = await isElementVisible(page, acceptConsent);

  if (isConsentVisible) {
    const consentStatus = consent === "in" ? acceptConsent : rejectConsent;
    await page.click(consentStatus);
  }

  const selectorForLoadMoreButton = "button[data-testid='loadMoreBtn']";
  let loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);

  while (loadMoreVisible) {
    await page.click(selectorForLoadMoreButton).catch(() => {});
    loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);
  }

  let urls = await page.$$eval(
    "div[class*='ProductTile'] > a[href]",
    (options) => {
      return options.map((option) => option.getAttribute("href"));
    }
  );

  let responseToFile = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const split = url.split("/");
    var name = `${split[3]}_${split[6]}`;

    await page.goto(url);

    let response;
    const featuredCarouselSelector = ".cmp-content-carousel__item--active";
    const featuredCarouselScope = ".cmp-content-carousel";
    const featuredCarouselCount = ".cta-content-card-wrapper__link";
    const featuredContentVisible = await page
      .waitForSelector(featuredCarouselSelector, {
        timeout: 3000,
        visible: true,
      })
      .then(() => {
        return true;
      })
      .catch((err) => {
        return false;
      });

    if (featuredContentVisible) {
      const scope = await page.$eval(featuredCarouselScope, (scope) =>
        scope.getAttribute("data-scope")
      );

      const imageCount = (await page.$$(featuredCarouselCount)).length;

      if (scope) {
        response = [url, featuredContentVisible, scope, imageCount];
      } else {
        response = [url, featuredContentVisible, false, imageCount];
      }
    } else {
      response = [url, featuredContentVisible, false, false];
    }

    console.log(`${i}/${urls.length}`, response);
    responseToFile.push(response);

    // await page.screenshot({
    //   path: `./${name}.jpg`,
    //   fullPage: true,
    // });
  }

  csv
    .writeToPath(
      path.resolve(__dirname, `${today}-${locale}-${consent}.csv`),
      responseToFile,
      {
        headers: ["url", "featuredContentVisible", "scope", "imageCount"],
      }
    )
    .on("error", (err) => console.log(err))
    .on("finish", () => console.log("done writing"));

  await browser.close();
  console.timeEnd("start");
})();
