/* Hero bosluk olcumu: header alti <-> h1 ve POS Dashboard resmi. Kullanim: node scripts/hero-measure.cjs <url> */
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:3002/';
  const browser = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 410, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const header = document.querySelector('header') || document.querySelector('nav');
      const h1 = document.querySelector('h1');
      const img = document.querySelector('img[alt="POS Dashboard"]');
      const r = (el) => el ? el.getBoundingClientRect() : null;
      const hr = r(header), h1r = r(h1), ir = r(img);
      return {
        win: innerWidth,
        navBottom: hr ? +hr.bottom.toFixed(1) : null,
        h1Top: h1r ? +h1r.top.toFixed(1) : null,
        imgTop: ir ? +ir.top.toFixed(1) : null,
        gapHeaderH1: hr && h1r ? +(h1r.top - hr.bottom).toFixed(1) : null,
        gapHeaderImg: hr && ir ? +(ir.top - hr.bottom).toFixed(1) : null,
      };
    });
    console.log(JSON.stringify({ viewport: vp.width + 'x' + vp.height, ...m }));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
