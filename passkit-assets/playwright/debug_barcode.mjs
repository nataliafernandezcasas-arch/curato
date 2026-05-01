// Click the barcode and inspect the dialog
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
await page.mouse.click(170, 473); // Apple view
await page.waitForTimeout(1800);
await page.mouse.click(436, 883); // barcode area
await page.waitForTimeout(2000);

await page.screenshot({ path: path.join(__dirname, 'barcode_dialog.png') });

// Dump interactive elements in the dialog area
const dump = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('input, textarea, select, button, [role="combobox"], [role="option"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    if (r.x < 600) return;
    items.push({
      tag: el.tagName, type: el.type || '', role: el.getAttribute('role'),
      name: el.getAttribute('name'), ariaLabel: el.getAttribute('aria-label'),
      value: el.value, text: (el.textContent || '').trim().slice(0, 60),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  });
  return items;
});
for (const it of dump) console.log(JSON.stringify(it));
await page.waitForTimeout(1500);
await context.close();
