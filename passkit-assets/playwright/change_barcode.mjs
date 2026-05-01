/**
 * Change barcode from PDF417 → QR Code.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const COORD = {
  appleIcon: [170, 473],
  barcode:   [436, 883],
  saveIcon:  [170, 774],
};

function log(m) { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }

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

    log('Clicking barcode…');
    await page.mouse.click(...COORD.barcode);
    await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
    log('  · Barcode dialog open.');

    // Find the Barcode Type dropdown. In Material UI it's usually a combobox or a select.
    log('Opening Barcode Type dropdown…');
    // Try role=combobox first
    let opened = false;
    const comboboxes = await page.getByRole('combobox').all();
    log(`  · Found ${comboboxes.length} combobox(es).`);
    for (const cb of comboboxes) {
      const text = (await cb.textContent() || '').trim();
      log(`    - "${text}"`);
      if (/pdf417|barcode/i.test(text) || text === '') {
        try {
          await cb.click({ timeout: 2500 });
          opened = true;
          log('    · Clicked that combobox.');
          break;
        } catch {}
      }
    }
    if (!opened) {
      // Fallback: click coordinate roughly where PDF417 dropdown is
      log('  · Falling back to coordinate click on dropdown.');
      await page.mouse.click(790, 168);
    }
    await page.waitForTimeout(800);

    // Look for QR option in the now-open listbox
    log('Selecting QR option…');
    try {
      await page.getByRole('option', { name: /QR/i }).click({ timeout: 3000 });
      log('  · QR option clicked.');
    } catch (e) {
      log(`  · option role failed: ${e.message.slice(0,60)}`);
      // Try li/menuitem
      try { await page.locator('li:has-text("QR")').first().click({ timeout: 2500 }); log('  · li QR clicked.'); }
      catch (e2) { log(`  · li fallback: ${e2.message.slice(0,60)}`); }
    }
    await page.waitForTimeout(1500);

    // Click DONE
    log('Clicking Done…');
    for (let a = 1; a <= 5; a++) {
      try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
      await page.waitForTimeout(1200);
      if ((await page.locator('[role="dialog"]:visible').count()) === 0) {
        log('✅ Barcode dialog closed.'); break;
      }
    }

    // Save
    log('Saving…');
    await page.mouse.click(...COORD.saveIcon);
    const saveDialog = page.locator('[role="dialog"]').filter({ hasText: /Save Template/i });
    await saveDialog.waitFor({ timeout: 5000 });
    await saveDialog.getByRole('button', { name: /^Save$/i }).click();
    await page.waitForTimeout(3000);
    log('🎉 Saved.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌', err.message || err);
    await new Promise(() => {});
  }
}
main();
