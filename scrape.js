const puppeteer = require("puppeteer");
const fs = require("fs");
const csvWriter = require("csv-writer").createObjectCsvWriter;
const readline = require("readline");

const PROGRESS_PATH = "./scrape_progress.json";
const OUTPUT_CSV = "./fetlife_users.csv";

function buildUrl(base, page) {
  let querySignifier = "?";
  if (base.includes("?")) querySignifier = "&";
  return `${base}${querySignifier}page=${page}`;
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
      const buttonSpanEl = card.querySelector("button span");
      const postsEl = card.querySelector("div.text-sm.text-gray-500");
      let postTypeEls = null;
      if (postsEl) postTypeEls = postsEl.querySelectorAll("a");

      const name = nameEl?.innerText?.trim() || "";
      const profile_url = nameEl?.getAttribute("href") || "";
      const meta = metaEl?.innerText || "";
      const location = locationEl?.innerText?.trim() || "";
      const followingStatus = buttonSpanEl?.innerText || "";
      let pics = 0;
      let vids = 0;
      let writings = 0;
      if (postTypeEls) {
        postTypeEls.forEach((element) => {
          const [count, text] = element.textContent.trim().split(" ");
          if (text.includes("Pic")) pics = count;
          else if (text.includes("Vid")) vids = count;
          else if (text.includes("Writing")) writings = count;
        });
      }

      const [ageWithGender, ...roleParts] = meta.split(" ");
      const age = parseInt(ageWithGender) || "";
      const gender = ageWithGender.replace(age, "") || "";
      const role = roleParts.join(" ") || "";
      const following_status = followingStatus || "Not Checked";

      return {
        name,
        profile_url,
        age,
        gender,
        role,
        location,
        following_status,
        pics,
        vids,
        writings,
      };
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const askQuestion = (query) => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  };
  let links = [];
  let doneEnteringLinks = false;
  console.log("Enter your links.");
  while (!doneEnteringLinks) {
    console.log("Enter link. When done, type 'done'.");
    const link = await askQuestion("");
    if (link !== "done") links.push(link);
    else doneEnteringLinks = true;
  }
  // let country = "united-states",
  //   state = "idaho",
  //   city = "";

  // if (args[0]?.startsWith("http")) {
  //   baseUrl = args[0];
  //   const [, , , ...parts] = new URL(baseUrl).pathname.split("/");
  //   country = parts[0];
  //   state = parts[1];
  //   city = parts[2] || null;
  // } else {
  //   [country, state, city] = args;
  // }

  // const locationKey = [country, state, city].filter(Boolean).join("/");

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./fetlife-session",
    defaultViewport: null,
  });
  while (links.length) {
    let baseUrl = links[0];
    let linkScraped = false;
    const progress = fs.existsSync(PROGRESS_PATH)
      ? JSON.parse(fs.readFileSync(PROGRESS_PATH))
      : {};
    const scrapedPages = progress[baseUrl] || [];

    const page = await browser.newPage();

    const allData = [];
    let currentPage = 1;

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
        { id: "pics", title: "pics" },
        { id: "vids", title: "vids" },
        { id: "writings", title: "writings" },
      ],
      append: fs.existsSync(OUTPUT_CSV),
    });

    while (true) {
      if (scrapedPages.includes(currentPage)) {
        console.log(`⏩ Skipping page ${currentPage} (already scraped).`);
        currentPage++;
        continue;
      }

      const url = buildUrl(baseUrl, currentPage);
      console.log(`🌐 Scraping: ${url}`);

      await page.goto(url, { waitUntil: "networkidle2" });
      await sleep(2000);

      const profiles = await scrapePage(page);

      if (profiles.length === 0) {
        console.log("🏁 No more profiles found. Scraping complete.");
        linkScraped = true;
        break;
      }

      allData.push(...profiles);

      console.log(
        `- Scraped ${profiles.length} profiles on page ${currentPage}`
      );
      await writer.writeRecords(profiles);
      console.log(`-- Profiles added to ${OUTPUT_CSV}`);

      scrapedPages.push(currentPage);
      progress[baseUrl] = scrapedPages;
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));

      console.log(`--- Scraped Profiles Updated. Moving to next page.`);

      currentPage++;
      await sleep(1000);
    }
    if (linkScraped) {
      links.shift();
    }
  }

  await browser.close();
}

main();
