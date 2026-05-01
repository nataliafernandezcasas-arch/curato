/**
 * Update NAME → NOMBRE, TIER → NIVEL in the Midi Pass template.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DRAFT_URL = 'https://app.passkit.com/app/membership/manage/2Psz2BUiEc20KoJahRvCr9/designs/v4/2e4ylREs66CnjFo3U5QQxx';

const COORD = {
  appleIcon:    [170, 473],
  nameField:    [313, 644],
  tierField:    [559, 644],
  saveIcon:     [170, 774],
};

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function closeAllDialogs(page) {
  for (let i = 0; i < 5; i++) {
    const count = await page.locator('[role="dialog"]:visible').count();
    if (count === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

async function renameField(page, coord, oldLabel, newLabel) {
  log(`— ${oldLabel} → ${newLabel} —`);
  await closeAllDialogs(page);
  await page.mouse.click(...coord);
  await page.locator('[role="dialog"]:visible').first().waitFor({ timeout: 5000 });
  log('  · Field dialog open.');

  const result = await page.evaluate(({ oldVal, newVal }) => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    for (const el of inputs) {
      if (el.value === oldVal) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, newVal);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return `set "${oldVal}" → "${newVal}"`;
      }
    }
    return `"${oldVal}" not found. Inputs: ${inputs.map(i => i.value).join('|')}`;
  }, { oldVal: oldLabel, newVal: newLabel });
  log(`  · ${result}`);

  await page.waitForTimeout(500);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try { await page.getByRole('button', { name: /^Done$/i }).click({ timeout: 2500 }); } catch {}
    await page.waitForTimeout(1000);
    if ((await page.locator('[role="dialog"]:visible').count()) === 0) {
      log(`✅ ${oldLabel} dialog closed.`);
      return;
    }
  }
  throw new Error(`${oldLabel}: dialog refused to close`);
}

async function saveTemplate(page) {
  log('— Save Template —');
  await page.mouse.click(...COORD.saveIcon);
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Save Template/i });
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole('button', { name: /^Save$/i }).click();
  await page.waitForTimeout(3000);
  log('✅ Saved.');
}

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--no-first-run'],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    log('Navigating to draft…');
    await page.goto(DRAFT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.mouse.click(...COORD.appleIcon);
    await page.waitForTimeout(1800);

    await renameField(page, COORD.nameField, 'Name', 'NOMBRE');
    await page.waitForTimeout(1200);
    await renameField(page, COORD.tierField, 'Tier', 'NIVEL');
    await page.waitForTimeout(1200);
    await saveTemplate(page);

    log('🎉 Done.');
    await new Promise(() => {});
  } catch (err) {
    console.error('\n❌ Error:', err.message || err);
    await new Promise(() => {});
  }
}

main();
