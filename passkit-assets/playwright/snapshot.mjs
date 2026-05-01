// Quick snapshot — connect to current PassKit state, take a screenshot
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());
await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.mouse.click(170, 473); // Apple view
await page.waitForTimeout(3000);
// Force cache-bust reload to see latest saved state
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.mouse.click(170, 473);
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(__dirname, 'current.png') });
await context.close();
console.log('Saved current.png');
