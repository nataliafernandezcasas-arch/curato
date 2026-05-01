import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ctx = await chromium.launchPersistentContext(path.join(__dirname, 'chrome-profile'), {
  headless: false, viewport: { width: 1440, height: 900 },
});
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.mouse.click(170, 426); // Google icon
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(__dirname, 'google_final.png') });
console.log('saved');
await ctx.close();
