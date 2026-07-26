const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runQA() {
  const targetUrl = process.argv[2] || 'http://localhost:3000';
  const name = process.argv[3] || 'screenshot';
  
  const qaDir = path.join(__dirname, '.qa');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewportSize({ width: 1280, height: 800 });
  
  console.log(`Navigating to ${targetUrl}...`);
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // Wait an extra second for any animations to finish
    await page.waitForTimeout(1000);
    
    const screenshotPath = path.join(qaDir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    const domPath = path.join(qaDir, `${name}-dom.html`);
    const content = await page.content();
    fs.writeFileSync(domPath, content);
    
    console.log(`QA Inspector complete: saved to .qa/${name}.png and .qa/${name}-dom.html`);
  } catch (e) {
    console.error('Failed to run QA inspector:', e);
  } finally {
    await browser.close();
  }
}

runQA();
