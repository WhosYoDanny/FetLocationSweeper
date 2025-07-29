const puppeteer = require("puppeteer");
const fs = require("fs");
const csvWriter = require("csv-writer").createObjectCsvWriter;

const PROGRESS_PATH = "./scrape_progress.json";
const OUTPUT_CSV = "./fetlife_users.csv";

function buildUrl(country, state, city, page) {
  const base = "https://fetlife.com/p";
  const location = [country, state, city].filter(Boolean).join("/");
  return `${base}/${location}/kinksters?page=${page}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapePage(page) {
  return await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-member-card]")];
    return cards.map((card) => {
      const nameEl = card.querySelector("a.text-red-500");
      const metaEl = card.querySelector("span.text-sm");
      const locationEl = card.querySelector("div.text-sm.text-gray-300");

      const name = nameEl?.innerText?.trim() || "";
      const profile_url = nameEl?.getAttribute("href") || "";
      const meta = metaEl?.innerText || "";
      const location = locationEl?.innerText?.trim() || "";

      const [ageWithGender, ...roleParts] = meta.split(" ");
      const age = parseInt(ageWithGender) || "";
      const gender = ageWithGender.replace(age, "") || "";
      const role = roleParts.join(" ") || "";

      return {
        name,
        profile_url,
        age,
        gender,
        role,
        location,
        following_status: "Not Checked",
      };
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  let baseUrl = "";
  let country, state, city;

  if (args[0]?.startsWith("http")) {
    baseUrl = args[0];
    const [, , , ...parts] = new URL(baseUrl).pathname.split("/");
    country = parts[0];
    state = parts[1];
    city = parts[2] || null;
  } else {
    [country, state, city] = args;
  }

  const locationKey = [country, state, city].filter(Boolean).join("/");
  const progress = fs.existsSync(PROGRESS_PATH)
    ? JSON.parse(fs.readFileSync(PROGRESS_PATH))
    : {};
  const scrapedPages = progress[locationKey] || [];

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./fetlife-session",
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  const allData = [];
  let currentPage = 1;

  while (true) {
    if (scrapedPages.includes(currentPage)) {
      console.log(`⏩ Skipping page ${currentPage} (already scraped).`);
      currentPage++;
      continue;
    }

    const url = baseUrl || buildUrl(country, state, city, currentPage);
    console.log(`🌐 Scraping: ${url}`);

    await page.goto(url, { waitUntil: "networkidle2" });
    await sleep(2000);

    const profiles = await scrapePage(page);

    if (profiles.length === 0) {
      console.log("🏁 No more profiles found. Scraping complete.");
      break;
    }

    allData.push(...profiles);
    scrapedPages.push(currentPage);
    progress[locationKey] = scrapedPages;
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));

    console.log(
      `✅ Scraped ${profiles.length} profiles on page ${currentPage}`
    );
    currentPage++;
    await sleep(1000);
  }

  const writer = csvWriter({
    path: OUTPUT_CSV,
    header: [
      { id: "name", title: "name" },
      { id: "profile_url", title: "profile_url" },
      { id: "age", title: "age" },
      { id: "gender", title: "gender" },
      { id: "role", title: "role" },
      { id: "location", title: "location" },
      { id: "following_status", title: "following_status" },
    ],
    append: fs.existsSync(OUTPUT_CSV),
  });

  await writer.writeRecords(allData);
  console.log(`📦 Done. Data written to ${OUTPUT_CSV}`);

  await browser.close();
}

main();
