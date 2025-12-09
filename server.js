const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 8080;

// Готовим Chromium под Railway
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-zygote',
      '--single-process',
      '--disable-web-security'
    ]
  });
}

// Тестовый эндпоинт
app.get("/", (req, res) => {
  res.send("DNS Scraper is running 🔥");
});

// Основной скрапинг эндпоинт
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

    // Абсолютно критично — даём нормальные заголовки
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    });

    // Переход на страницу DNS
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Берём весь HTML
    const html = await page.content();

    // Отдаём как text/plain — лучший формат для n8n
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
