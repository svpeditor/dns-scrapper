const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "DNS Scraper is running. Use /scrape?url=YOUR_URL" 
  });
});

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  console.log('[SCRAPE] Starting:', url);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    });
    
    console.log('[SCRAPE] Navigating...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const html = await page.content();
    console.log('[SCRAPE] Success:', html.length, 'chars');
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(html);
    
  } catch (e) {
    console.error('[SCRAPE] Error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log('Scraper running on port', PORT);
});
