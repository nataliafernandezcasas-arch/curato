/**
 * Google Wallet: Upload Midi square logo + change issuer from "PassKit, Inc" to "Midi Pass"
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..');
const LOGO_SQUARE = path.join(ASSETS, 'logo_mark@3x.png');

const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const COORD = {
  googleIcon: [170, 426],
  logo:       [274, 436],
  issuer:     [348, 436], // "PassKit, Inc" text
  saveIcon:   [170, 774],
};

function log(m) { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }

async function closeAllDialogs(page) {
  for (let i = 0; i < 5; i++) {
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

async function replaceLogo(page) {
  log('— Logo Google —');
  await closeAllDialogs(page);
  await page.mouse.click(...COORD.logo);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log('  · Dialog open.');
  try {
    const rm = page.getByRole('button', { name: /Remove image/i });
    if (await rm.isVisible({ timeout: 1500 })) { await rm.click(); log('  · Removed.'); await page.waitForTimeout(900); }
  } catch {}
  // Try square upload first (Google logo is square/circular crop)
  const tryLabels = [/Upload new square image/i, /Upload new rectangular image/i, /Upload new image/i];
  let uploaded = false;
  for (const re of tryLabels) {
    try {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.getByRole('button', { name: re }).click(),
      ]);
      await chooser.setFiles(LOGO_SQUARE);
      log(`  · setFiles(${path.basename(LOGO_SQUARE)}) via ${re.source}`);
      uploaded = true;
      break;
    } catch (e) {
      log(`  · ${re.source} didn't fire chooser.`);
    }
  }
  if (!uploaded) { log('⚠️  No upload button worked.'); }
  await page.waitForTimeout(3500);
  for (let a = 1; a <= 5; a++) {
    try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
    await page.waitForTimeout(1200);
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) { log('✅ Logo dialog closed.'); return; }
  }
}

async function changeIssuer(page) {
  log('— Issuer Name —');
  await closeAllDialogs(page);
  // Click on the "PassKit, Inc" area in the card preview
  await page.mouse.click(...COORD.issuer);
  await page.waitForTimeout(1200);
  // Dialog may or may not open. If it doesn't, try alternative: issuer/program name is in Settings.
  const dialogCount = await page.locator('[role="dialog"]:visible').count();
  if (dialogCount === 0) {
    log('  · Click on "PassKit, Inc" did not open dialog. Trying to find text inputs directly…');
    // Try to find and edit by value
    const res = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
      for (const el of inputs) {
        if (el.value === 'PassKit, Inc' || /passkit/i.test(el.value || '')) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, 'Midi Pass');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return `set input value`;
        }
      }
      return 'not-found';
    });
    log(`  · ${res}`);
    return;
  }
  log('  · Dialog opened for issuer.');
  // Look for input with 'PassKit' and change
  const res = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
    for (const el of inputs) {
      if (el.value === 'PassKit, Inc' || el.value === 'PassKit' || /passkit/i.test(el.value || '')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, 'Midi Pass');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return `set "${el.value}" → "Midi Pass"`;
      }
    }
    return `not found. Inputs: ${inputs.map(i => i.value).slice(0,10).join('|')}`;
  });
  log(`  · ${res}`);
  await page.waitForTimeout(500);
  for (let a = 1; a <= 5; a++) {
    try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
    await page.waitForTimeout(1200);
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) { log('✅ Issuer dialog closed.'); return; }
  }
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
    await page.mouse.click(...COORD.googleIcon);
    await page.waitForTimeout(1800);

    await replaceLogo(page);
    await page.waitForTimeout(1200);
    await changeIssuer(page);
    await page.waitForTimeout(1200);
    await save(page);

    log('🎉 Done.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌', err.message || err);
    await new Promise(() => {});
  }
}
main();
