// Snapshot Google Wallet view
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false, viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());
await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
// Click Google icon (sidebar 1st icon at y~420)
await page.mouse.click(170, 426);
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(__dirname, 'google_view.png') });
console.log('saved google_view.png');

// Dump card preview elements
const dump = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('img, div[role="button"], button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    if (r.x < 200 || r.x > 700) return;
    if (r.y < 300 || r.y > 900) return;
    items.push({
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 60),
      src: (el.getAttribute('src') || '').slice(0, 80),
      role: el.getAttribute('role'),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2) },
    });
  });
  return items.sort((a, b) => a.rect.y - b.rect.y);
});
for (const it of dump) console.log(JSON.stringify(it));
await page.waitForTimeout(1000);
await context.close();
