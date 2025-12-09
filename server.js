const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "DNS Scraper with Stealth (no proxy)"
  });
});

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url" });

  console.log('[SCRAPE] Starting:', url);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    await page.setUserAgent(randomUA);
    await page.setViewport({ 
      width: 1366 + Math.floor(Math.random() * 554),
      height: 768 + Math.floor(Math.random() * 312)
    });
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });
    
    console.log('[SCRAPE] Navigating...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    const delay = 4000 + Math.floor(Math.random() * 3000);
    console.log(`[SCRAPE] Waiting ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 4);
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 500));
    
    const html = await page.content();
    console.log('[SCRAPE] HTML length:', html.length);
    
    if (html.includes('qrator') || html.includes('__qauth')) {
      console.log('[SCRAPE] WARNING: Qrator detected');
      res.status(403).json({ 
        error: "Qrator protection detected",
        message: "Need proxy. HTML length: " + html.length,
        htmlPreview: html.substring(0, 500)
      });
    } else if (html.length < 20000) {
      console.log('[SCRAPE] WARNING: Short HTML');
      res.status(403).json({ 
        error: "Suspicious response",
        message: "HTML too short: " + html.length,
        htmlPreview: html.substring(0, 500)
      });
    } else {
      console.log('[SCRAPE] Success!');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(html);
    }
    
  } catch (e) {
    console.error('[SCRAPE] Error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log('🚀 Scraper running on port', PORT);
});
