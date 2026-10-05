// @ts-check
const path = require('path');
const { test, expect } = require('./fixtures');

/**
 * Reference screenshots of the main screens, written to tests/screenshots/.
 * They are review material for the UX meetings, not pixel assertions — the run
 * only fails if a screen cannot be reached or renders empty.
 */
const SHOTS = [
  ['journey-list', 'admin', async (app) => app.locator('.nav button[data-view="journeys"]').click()],
  ['journey-create', 'marketer', async (app) => {
    await app.locator('.nav button[data-view="journeys"]').click();
    await app.locator('#jl-new').click();
  }],
  ['journey-builder', 'admin', async (app) => {
    await app.locator('.nav button[data-view="journeys"]').click();
    await app.locator('#jl-table [data-jopen]').first().click();
  }],
  ['journey-monitor', 'admin', async (app) => app.locator('.nav button[data-view="monitor"]').click()],
  ['segments', 'admin', async (app) => app.locator('.nav button[data-view="segmentation"]').click()],
  ['segment-workbench', 'admin', async (app) => {
    await app.locator('.nav button[data-view="segmentation"]').click();
    await app.locator('#seg-new').click();
    await app.locator('#seg-search').click();
  }],
  ['policies', 'admin', async (app) => app.locator('.nav button[data-view="policies"]').click()],
  ['user-manual', 'marketer', async (app) => app.locator('#btn-manual').click()],
];

for (const [name, role, open] of SHOTS) {
  test(`screenshot: ${name}`, async ({ app }) => {
    await app.selectOption('#role-sel', role);
    await open(app);
    await expect(app.locator('.view.active')).toBeVisible();
    await app.waitForTimeout(150); // let the collapse/zoom transitions settle
    await app.screenshot({ path: path.join(__dirname, '..', 'screenshots', `${name}.png`), fullPage: false });
  });
}
