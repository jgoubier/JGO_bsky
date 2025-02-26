const puppeteer = require('puppeteer');

async function takeScreenshot(url, width, height, filePath) {
    // Launch a new browser instance
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary for running as root
    });

    // Open a new page (without incognito mode)
    const page = await browser.newPage();

    // Set the viewport to the desired dimensions
    await page.setViewport({ width, height });

    // Go to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Take a screenshot and save it to the specified path
    await page.screenshot({ path: filePath });

    // Close the browser
    await browser.close();
}

// Example usage
takeScreenshot('http://www.bskycheck.com', 860, 595, '/var/www/html/thumbnail.jpg')
    .then(() => console.log('Screenshot taken successfully'))
    .catch(err => console.error('Error taking screenshot:', err));