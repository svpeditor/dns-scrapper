const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 8080;

async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-software-rasterizer',
      '--disable-web-security'
    ]
  });
}

app.get("/", (req, res) => {
  res.send("DNS Scraper is running 🔥");
});

app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  console.log("SCRAPING:", url);

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const html = await page.content();

    // <<< ВАЖНО: отдаём текст, а не HTML-документ >>>
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(html);

  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    res.status(500).json({ error: String(err) });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Scraper running on port ${PORT}`);
});
