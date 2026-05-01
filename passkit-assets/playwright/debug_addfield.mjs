// Probe where the "add field" + buttons are on the card preview
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
await page.mouse.click(170, 473);
await page.waitForTimeout(1800);

// Dump all + (plus) buttons and aux fields in card preview (x: 200-700)
const buttons = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('button, svg').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    if (r.x < 200 || r.x > 700) return;
    if (r.y < 300 || r.y > 900) return;
    const testId = el.getAttribute('data-testid') || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    if (el.tagName === 'svg' && !/Plus/i.test(testId)) return;
    items.push({
      tag: el.tagName, testId, ariaLabel,
      parentTag: el.parentElement?.tagName,
      parentAria: el.parentElement?.getAttribute('aria-label'),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2) },
    });
  });
  return items.sort((a, b) => a.rect.y - b.rect.y);
});
for (const b of buttons) console.log(JSON.stringify(b));

await page.waitForTimeout(1000);
await context.close();
