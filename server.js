const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 8080;

async function launchBrowser() {
  return await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreHTTPSErrors: true
  });
}

app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "DNS Scraper is running. Use /scrape?url=YOUR_URL" 
  });
});

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  console.log(`[SCRAPE] Starting scrape for: ${url}`);
  
  let browser;
  try {
    browser = await launchBrowser();
    console.log('[SCRAPE] Browser launched successfully');
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('[SCRAPE] Navigating to URL...');
    await page.goto(url, { 
      waitUntil: "networkidle2",
      timeout: 30000 
    });
    
    console.log('[SCRAPE] Page loaded, extracting HTML...');
    const html = await page.content();
    
    console.log(`[SCRAPE] Success! HTML length: ${html.length} characters`);
    
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(html);
    
  } catch (e) {
    console.error('[SCRAPE] Error:', e.message);
    res.status(500).json({ 
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  } finally {
    if (browser) {
      await browser.close();
      console.log('[SCRAPE] Browser closed');
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 Scrape endpoint: http://localhost:${PORT}/scrape?url=YOUR_URL`);
});
