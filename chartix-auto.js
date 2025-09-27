const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const { username, password } = JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
  const symbols = fs.readFileSync('symbols.txt', 'utf-8').split('
').filter(s => s.trim() !== '');
  const outputDir = 'charts';
  if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🔑 Logging in to Chartix...");
  await page.goto('https://www.chartix.ir/login', { waitUntil: 'networkidle2', timeout: 60000 });

  await page.type('input[name="username"]', username, { delay: 50 });
  await page.type('input[name="password"]', password, { delay: 50 });

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
  ]);
  console.log("✅ Logged in successfully.");

  for (const symbol of symbols) {
    const chartPage = await browser.newPage();

    console.log(`📊 Processing chart for: ${symbol}`);
    const url = `https://www.chartix.ir/chart/${symbol}`;
    await chartPage.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await chartPage.waitForSelector('#chart-container canvas', { timeout: 20000 });

    const fileName = `${symbol}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    const savePath = path.join(outputDir, fileName);

    await chartPage.screenshot({ path: savePath, fullPage: true });
    console.log(`✅ Saved: ${savePath}`);

    await chartPage.close();
  }

  await browser.close();
})();
