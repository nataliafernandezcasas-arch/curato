/**
 * Replace Midi Pass strip with avatar image.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..');
const AVATAR_PATH = path.join(ASSETS, 'strip_avatar@3x.png');

const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const COORD = {
  appleIcon: [170, 473],
  strip:     [436, 540],
  saveIcon:  [170, 774],
};

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

async function closeAllDialogs(page) {
  for (let i = 0; i < 5; i++) {
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false, viewport: { width: 1440, height: 900 }, args: ['--no-first-run'],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    log('Navigating to draft…');
    await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.mouse.click(...COORD.appleIcon);
    await page.waitForTimeout(1800);

    // Open strip dialog
    log('Opening strip dialog…');
    await closeAllDialogs(page);
    await page.mouse.click(...COORD.strip);
    await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
    log('  · Dialog open.');

    // Remove current (gradient)
    try {
      const rm = page.getByRole('button', { name: /Remove image/i });
      if (await rm.isVisible({ timeout: 1500 })) {
        await rm.click();
        log('  · Removed current strip.');
        await page.waitForTimeout(800);
      }
    } catch {}

    // Upload avatar
    log('  · Triggering upload…');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.getByRole('button', { name: /Upload new.*(strip|image)/i }).click(),
    ]);
    await chooser.setFiles(AVATAR_PATH);
    log(`  · setFiles(${path.basename(AVATAR_PATH)})`);
    await page.waitForTimeout(3500);

    // Click Done (retry)
    for (let a = 1; a <= 5; a++) {
      try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
      await page.waitForTimeout(1300);
      if ((await page.locator('[role="dialog"]:visible').count()) === 0) { log('✅ Strip replaced.'); break; }
    }

    // Save
    log('— Save Template —');
    await page.mouse.click(...COORD.saveIcon);
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /Save Template/i });
    await dialog.waitFor({ timeout: 5000 });
    await dialog.getByRole('button', { name: /^Save$/i }).click();
    await page.waitForTimeout(3000);
    log('✅ Saved.');
    log('🎉 Done.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌ Error:', err.message || err);
    await new Promise(() => {});
  }
}

main();
