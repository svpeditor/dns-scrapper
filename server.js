const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            executablePath: "/usr/bin/chromium",   // ← ВАЖНО! Рабочий путь для Railway
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--single-process",
                "--no-zygote"
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        );

        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        const html = await page.content();
        res.send(html);

    } catch (err) {
        console.error("SCRAPE ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Scraper running on port " + PORT));
