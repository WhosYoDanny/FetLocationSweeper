const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./fetlife-session",
    executablePath:
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", // your real Chrome path
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Optional: Set a real user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.114 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });

    Object.defineProperty(navigator, "language", {
      get: () => "en-US",
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
  });

  await page.goto("https://fetlife.com", { waitUntil: "networkidle2" });

  console.log("🔐 Please log in manually. Close the browser when done.");
})();
