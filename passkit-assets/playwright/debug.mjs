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
await page.waitForTimeout(4000);

// Try to switch to Apple view
try {
  await page.getByRole('button', { name: /Apple Design/i }).click({ timeout: 3000 });
  await page.waitForTimeout(1500);
} catch {}

// Save full-page screenshot
await page.screenshot({ path: path.join(__dirname, 'debug_screen.png'), fullPage: false });
console.log('Screenshot saved.');

// Dump all clickable/image elements in the card preview
const dump = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('[role="button"], button, img, [class*="logo" i], [class*="LOGO" i], [class*="strip" i], [data-testid]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (rect.left > 900) return; // only left side (card preview)
    items.push({
      tag: el.tagName,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      text: (el.textContent || '').trim().slice(0, 50),
      className: (el.className || '').toString().slice(0, 80),
      testid: el.getAttribute('data-testid'),
      alt: el.getAttribute('alt'),
      src: (el.getAttribute('src') || '').slice(0, 80),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    });
  });
  return items;
});
console.log('Candidates:');
for (const it of dump) {
  console.log(JSON.stringify(it));
}

await page.waitForTimeout(2000);
await context.close();
