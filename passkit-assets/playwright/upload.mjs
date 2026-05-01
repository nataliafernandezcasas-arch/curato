/**
 * Midi Pass — PassKit automation v5: Remove-then-upload, robust dialog transitions.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..');

const LOGO_PATH  = path.join(ASSETS, 'logo@3x.png');
const STRIP_PATH = path.join(ASSETS, 'strip@3x.png');

const PROJECT_ID = '2Psz2BUiEc20KoJahRvCr9';
const DRAFT_URL  = `https://app.passkit.com/app/membership/manage/${PROJECT_ID}/designs/v4/2e4ylREs66CnjFo3U5QQxx`;
const LOGIN_URL  = 'https://app.passkit.com';
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');

const COORD = {
  appleIcon:    [170, 473],
  logo:         [277, 435],
  pointsHeader: [589, 430],
  strip:        [436, 540],
  saveIcon:     [170, 774],
};

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

async function waitUntilLoggedIn(page) {
  for (let i = 0; i < 300; i++) {
    const url = page.url();
    if (url.includes('/app/membership') || /\/app\/?$/.test(url)) { log('Logged in.'); return; }
    await page.waitForTimeout(1000);
  }
  throw new Error('Timeout waiting for login');
}

async function closeAllDialogs(page) {
  for (let i = 0; i < 5; i++) {
    const count = await page.locator('[role="dialog"]:visible').count();
    if (count === 0) return;
    log(`  · Closing ${count} stray dialog(s) via Escape…`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }
}

async function uploadImage(page, openCoord, fileToUpload, uploadButtonRe, label) {
  log(`— ${label} —`);
  await closeAllDialogs(page);

  // Open the image dialog
  log(`  · Clicking placeholder ${openCoord}…`);
  await page.mouse.click(...openCoord);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log(`  · Dialog opened.`);

  // Remove existing image first for a clean slate (if Remove image button exists).
  try {
    const removeBtn = page.getByRole('button', { name: /Remove image/i });
    if (await removeBtn.isVisible({ timeout: 1500 })) {
      await removeBtn.click();
      log(`  · Clicked Remove image.`);
      await page.waitForTimeout(800);
    }
  } catch {}

  // Upload new file
  log(`  · Triggering ${uploadButtonRe}…`);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    page.getByRole('button', { name: uploadButtonRe }).click(),
  ]);
  await chooser.setFiles(fileToUpload);
  log(`  · setFiles(${path.basename(fileToUpload)})`);

  // Wait for the upload to process (new img URL to appear in dialog preview).
  await page.waitForTimeout(3500);

  // Click Done — try multiple times, each time checking if dialog closed.
  for (let attempt = 1; attempt <= 5; attempt++) {
    log(`  · Attempt ${attempt}: Click Done.`);
    try {
      await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 });
    } catch (e) {
      log(`    click err: ${e.message.slice(0, 80)}`);
    }
    await page.waitForTimeout(1500);
    const still = await page.locator('[role="dialog"]:visible').count();
    if (still === 0) {
      log(`✅ ${label} dialog closed.`);
      return;
    }
    log(`    still ${still} dialog visible.`);
  }
  throw new Error(`${label}: dialog refused to close`);
}

async function renamePointsToAllowance(page) {
  log('— Points → Allowance —');
  await closeAllDialogs(page);
  await page.mouse.click(...COORD.pointsHeader);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log('  · Field dialog open.');

  const result = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    for (const el of inputs) {
      if (el.value === 'Points' || el.value === 'points') {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, 'Allowance');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return `set from "Points" to "Allowance"`;
      }
    }
    // Maybe already Allowance
    for (const el of inputs) {
      if (el.value === 'Allowance') return 'already Allowance';
    }
    return `not-found. Inputs: ${inputs.map(i => i.value).join('|')}`;
  });
  log(`  · ${result}`);

  await page.waitForTimeout(500);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 });
    } catch {}
    await page.waitForTimeout(1200);
    const still = await page.locator('[role="dialog"]:visible').count();
    if (still === 0) { log('✅ Field dialog closed.'); return; }
  }
  throw new Error('Field dialog refused to close');
}

async function saveTemplate(page) {
  log('— Save Template —');
  await page.mouse.click(...COORD.saveIcon);
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Save Template/i });
  await dialog.waitFor({ timeout: 5000 });
  log('  · Save Template dialog visible.');
  await dialog.getByRole('button', { name: /^Save$/i }).click();
  log('  · Save button clicked.');
  await page.waitForTimeout(3000);
  log('✅ Save dispatched.');
}

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--no-first-run'],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await waitUntilLoggedIn(page);
    log('Navigating to draft…');
    await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    log('Clicking Apple icon…');
    await page.mouse.click(...COORD.appleIcon);
    await page.waitForTimeout(1800);

    await uploadImage(page, COORD.logo, LOGO_PATH, /Upload new rectangular image/i, 'LOGO');
    await page.waitForTimeout(1500);
    await uploadImage(page, COORD.strip, STRIP_PATH, /Upload new.*(strip|image)/i, 'STRIP');
    await page.waitForTimeout(1500);
    await renamePointsToAllowance(page);
    await page.waitForTimeout(1500);
    await saveTemplate(page);

    log('🎉 All done. Browser stays open for verification.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌ Script error:', err.message || err);
    log('Browser stays open for manual recovery.');
    await new Promise(() => {});
  }
}

main();
