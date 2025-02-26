const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        executablePath: '/usr/bin/chromium-browser', // Explicitly set the Chromium path
        headless: true
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 804, height: 580 });

    await page.goto('http://www.bskycheck.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    await page.screenshot({ 
        path: '/var/www/html/thumbnail.png', 
        clip: { x: 0, y: 0, width: 804, height: 580 }
    });

    console.log('Screenshot saved.');
    await browser.close();
})();