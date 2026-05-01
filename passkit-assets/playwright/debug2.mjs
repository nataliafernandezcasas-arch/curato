// Inspect images and clickable divs inside the Apple card preview (x: 200-700, y: 300-900)
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

// Switch to Apple
await page.mouse.click(170, 473);
await page.waitForTimeout(1500);

// Save screenshot
await page.screenshot({ path: path.join(__dirname, 'debug2_screen.png') });

// Dump everything clickable or image-like inside the card preview box
const box = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('img, div[role="button"], button, [class*="strip" i]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    if (r.x < 200 || r.x > 700) return; // only card preview area
    if (r.y < 300 || r.y > 900) return;
    items.push({
      tag: el.tagName,
      role: el.getAttribute('role'),
      alt: el.getAttribute('alt'),
      src: (el.getAttribute('src') || '').slice(0, 100),
      cls: (el.className || '').toString().slice(0, 100),
      text: (el.textContent || '').trim().slice(0, 40),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2) },
    });
  });
  return items.sort((a, b) => a.rect.y - b.rect.y);
});
for (const it of box) console.log(JSON.stringify(it));

await page.waitForTimeout(1500);
await context.close();
