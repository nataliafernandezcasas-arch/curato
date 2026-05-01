/**
 * Midi Pass — High-end redesign.
 * - Background: Navy #26213F
 * - Labels: Lime #C5E86C (accent)
 * - Text: Cream #FFFDF1
 * - Logo: White variant
 * - Strip: Dark silk gradient (navy→purple)
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..');
const LOGO_WHITE = path.join(ASSETS, 'logo_white@3x.png');
const STRIP_HIGHEND = path.join(ASSETS, 'strip_highend@3x.png');

const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const COORD = {
  appleIcon:   [170, 473],
  colorsIcon:  [170, 660],
  logo:        [277, 435],
  strip:       [436, 540],
  saveIcon:    [170, 774],
  bgColorSwatch:    [1275, 98],
  labelColorSwatch: [1275, 147],
  textColorSwatch:  [1275, 196],
};

// Colors
const BG    = '26213F'; // Navy
const LABEL = 'C5E86C'; // Lime (accent)
const TEXT  = 'FFFDF1'; // Cream

function log(m) { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }

async function closeAllDialogs(page) {
  for (let i = 0; i < 5; i++) {
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

async function setColor(page, swatchCoord, hex, label) {
  log(`  · ${label} → #${hex}`);
  await page.mouse.click(...swatchCoord);
  await page.waitForTimeout(400);
  // The hex input in the picker
  await page.evaluate((newHex) => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    for (const el of inputs) {
      if (/^#?[0-9A-Fa-f]{6}$/.test(el.value)) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, newHex);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, hex);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(600);
}

async function updateColors(page) {
  log('— Updating colors —');
  await closeAllDialogs(page);
  await page.mouse.click(...COORD.colorsIcon);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log('  · Colors dialog open.');

  await setColor(page, COORD.bgColorSwatch, BG, 'Background');
  await setColor(page, COORD.labelColorSwatch, LABEL, 'Label');
  await setColor(page, COORD.textColorSwatch, TEXT, 'Text');

  log('  · Clicking Done…');
  for (let a = 1; a <= 5; a++) {
    try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
    await page.waitForTimeout(1000);
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) { log('✅ Colors applied.'); return; }
  }
  throw new Error('Colors dialog refused to close');
}

async function replaceImage(page, coord, filePath, uploadRe, label) {
  log(`— ${label} —`);
  await closeAllDialogs(page);
  await page.mouse.click(...coord);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log(`  · Dialog open.`);

  // Remove existing
  try {
    const rm = page.getByRole('button', { name: /Remove image/i });
    if (await rm.isVisible({ timeout: 1500 })) {
      await rm.click();
      log('  · Removed existing.');
      await page.waitForTimeout(800);
    }
  } catch {}

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    page.getByRole('button', { name: uploadRe }).click(),
  ]);
  await chooser.setFiles(filePath);
  log(`  · setFiles(${path.basename(filePath)})`);
  await page.waitForTimeout(3500);

  for (let a = 1; a <= 5; a++) {
    try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
    await page.waitForTimeout(1200);
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) { log(`✅ ${label} replaced.`); return; }
  }
  throw new Error(`${label}: dialog refused to close`);
}

async function save(page) {
  log('— Save —');
  await page.mouse.click(...COORD.saveIcon);
  const sd = page.locator('[role="dialog"]').filter({ hasText: /Save Template/i });
  await sd.waitFor({ timeout: 5000 });
  await sd.getByRole('button', { name: /^Save$/i }).click();
  await page.waitForTimeout(3000);
  log('✅ Saved.');
}

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false, viewport: { width: 1440, height: 900 }, args: ['--no-first-run'],
  });
  const page = context.pages()[0] || (await context.newPage());
  try {
    await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.mouse.click(...COORD.appleIcon);
    await page.waitForTimeout(1800);

    await updateColors(page);
    await page.waitForTimeout(1200);
    await replaceImage(page, COORD.logo, LOGO_WHITE, /Upload new rectangular image/i, 'LOGO → white');
    await page.waitForTimeout(1200);
    await replaceImage(page, COORD.strip, STRIP_HIGHEND, /Upload new.*(strip|image)/i, 'STRIP → high-end');
    await page.waitForTimeout(1200);
    await save(page);

    log('🎉 High-end redesign complete.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌', err.message || err);
    await new Promise(() => {});
  }
}
main();
