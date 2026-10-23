const { chromium } = require("playwright");

const BASE = "http://localhost:3002";
const ROUTES = [
  "/", "/ozellikler", "/sablonlar", "/fiyatlar", "/indir", "/kayit", "/giris",
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = {};

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      const url = page.url();
      results[url] = results[url] || [];
      results[url].push(`[${type}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    const url = page.url();
    results[url] = results[url] || [];
    results[url].push(`[pageerror] ${err.message}`);
  });
  page.on("requestfailed", (req) => {
    const url = page.url();
    results[url] = results[url] || [];
    results[url].push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      const url = page.url();
      results[url] = results[url] || [];
      results[url].push(`[http ${res.status()}] ${res.url()}`);
    }
  });

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 15000 }).catch((e) => {
      results[BASE + route] = results[BASE + route] || [];
      results[BASE + route].push(`[navfail] ${e.message}`);
    });
    await page.waitForTimeout(1200);
  }

  await browser.close();

  for (const [url, msgs] of Object.entries(results)) {
    console.log("\n=== " + url + " ===");
    for (const m of msgs) console.log(m);
  }
  if (Object.keys(results).length === 0) {
    console.log("No console errors/warnings found.");
  }
})();
