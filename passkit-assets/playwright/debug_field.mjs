// Click the "Points 0" header field and dump what dialog appears.
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
await page.waitForTimeout(3500);
await page.mouse.click(170, 473); // Apple view
await page.waitForTimeout(1500);

// Click "Points 0" header field
await page.mouse.click(589, 430);
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'field_dialog.png') });

// Dump all visible interactive elements
const dump = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('input, textarea, select, button, div[role="button"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    items.push({
      tag: el.tagName,
      type: el.type || '',
      role: el.getAttribute('role'),
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder'),
      ariaLabel: el.getAttribute('aria-label'),
      value: el.value,
      text: (el.textContent || '').trim().slice(0, 50),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  });
  return items.filter(it => it.rect.x > 700); // only right side where field editor typically is
});
for (const it of dump) console.log(JSON.stringify(it));

await page.waitForTimeout(1000);
await context.close();
