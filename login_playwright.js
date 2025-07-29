const { chromium } = require("playwright");

(async () => {
  const userDataDir = "./fetlife-session";

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: null,
    args: ["--start-maximized"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.114 Safari/537.36",
  });

  const page = await context.newPage();

  console.log("🔐 Please log in manually at: https://fetlife.com");
  await page.goto("https://fetlife.com", { waitUntil: "networkidle" });

  console.log("🧠 After login, close the browser to finish.");

  // Leave open until user manually closes it
})();
