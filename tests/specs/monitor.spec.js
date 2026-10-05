// @ts-check
const { test, expect, setRole } = require('./fixtures');

/**
 * Journey Monitor: one journey at a time — General (totals, channel totals, Marketing Agent
 * anomaly alerts, versions, participants) and View version (read-only canvas with the stats
 * strip); step export with a strategy; the simulation strip drives every number.
 */
async function openMonitor(app, id = 'JRN-04') {
  await app.locator('.nav button[data-view="monitor"]').click();
  await app.selectOption('#msel', id);
  await expect(app.locator('#mon-body')).toContainText(id);
}

test.describe('journey monitor', () => {
  test('General shows totals, channel totals, anomaly alerts and the versions table', async ({ app }) => {
    await openMonitor(app);
    const tiles = await app.$$eval('#mon-body .stats .stat .l', (els) => els.map((e) => e.textContent.trim()));
    expect(tiles).toEqual(['Entered', 'Active now', 'Exited', 'Conversions']);
    await expect(app.locator('#mon-body .tbl').first()).toContainText('Email');
    // alerts are framed as the Marketing Agent's, with a confidence level
    await expect(app.locator('#mon-body .pill.acc', { hasText: 'Marketing Agent' })).toBeVisible();
    const alerts = app.locator('#mon-body .alert');
    expect(await alerts.count()).toBeGreaterThanOrEqual(2);
    expect(await alerts.count()).toBeLessThanOrEqual(3);
    await expect(alerts.first()).toContainText(/confidence/);
    await expect(alerts.first()).toContainText('vs 30-day baseline');
    // one row per version, newest first
    const vs = await app.$$eval('#mvtable tbody tr td:first-child', (els) => els.map((e) => e.textContent.trim()));
    expect(vs).toEqual(['v4', 'v3']);
    await alerts.first().locator('[data-al-dismiss]').click();
    expect(await app.locator('#mon-body .alert').count()).toBeLessThanOrEqual(2);
  });

  test('View version draws the read-only canvas with the stats strip and lists the steps', async ({ app }) => {
    await openMonitor(app);
    await app.locator('#mon-tabs [data-mt="version"]').click();
    await expect(app.locator('#mon-vwrap')).toBeVisible();
    await expect(app.locator('#mvsel')).toHaveValue('4');
    expect(await app.locator('#mcanvas .node').count()).toBe(7);
    expect(await app.locator('#mcanvas text.stat').count()).toBe(7);
    expect(await app.locator('#mcanvas .port').count(), 'read-only: no ports').toBe(0);
    expect(await app.locator('#mcanvas input').count(), 'read-only: no editable names').toBe(0);
    // the Closed v3 carries no statistics
    await app.selectOption('#mvsel', '3');
    expect(await app.locator('#mcanvas text.stat').count()).toBe(0);
    await expect(app.locator('#mon-body')).toContainText('no statistics');
    // Open in builder lands on that version
    await app.locator('#mon-open').click();
    await expect(app.locator('#jsplit')).toBeVisible();
    await expect(app.locator('#vsel')).toHaveValue('3');
  });

  test('a step opens the export with four strategies and a mock download', async ({ app }) => {
    await openMonitor(app);
    await app.locator('#mon-tabs [data-mt="version"]').click();
    await app.locator('#mcanvas .node[data-id="s2"]').click();
    const m = app.locator('#exp-modal');
    await expect(m).toBeVisible();
    await expect(m.locator('#exp-sub')).toContainText('Email winback');
    const strategies = await m.locator('.exp-s b').allTextContents();
    expect(strategies).toEqual(['Entered the step', 'Exited the step', 'Was in the step', 'Entered and exited']);
    await m.locator('input[value="exited"]').check();
    await expect(m.locator('#exp-count')).toContainText('contact(s)');
    await m.locator('#exp-go').click();
    await expect(m).toBeHidden();
    await expect(app.locator('#toast')).toContainText('Export started (mock)');
  });

  test('the time range scales the numbers; the simulation strip drives the stats strip', async ({ app }) => {
    await openMonitor(app);
    const entered = async () => Number((await app.locator('#mon-body .stats .stat .v').first().textContent()).replace(/\D/g, ''));
    const at30 = await entered();
    await app.selectOption('#mrange', '90');
    expect(await entered()).toBeGreaterThan(at30);
    await app.selectOption('#mrange', '30');
    // a day passes: contacts move, the strip on View version changes with them
    await app.locator('#mon-tabs [data-mt="version"]').click();
    const strip = () => app.locator('#mcanvas .node[data-id="s3"] text.stat').textContent();
    const before = await strip();
    await app.locator('#btn-tick5').click();
    expect(await strip()).not.toEqual(before);
  });

  test('the validation panel opens above the canvas and names the step to fix', async ({ app }) => {
    await setRole(app, 'approver');
    await app.locator('#jl-table [data-jopen="JRN-06"]').click();
    await expect(app.locator('#jvalid')).toBeHidden();
    await app.locator('#btn-activate').click();
    await expect(app.locator('#jvalid')).toBeVisible();
    await expect(app.locator('#jvalid .jv-h b')).toContainText('1 check(s) block Activate');
    await app.locator('#jvalid [data-jvsel]').click();
    await expect(app.locator('#jp-title')).toContainText('Wait for event');
    await app.locator('#jv-close').click();
    await expect(app.locator('#jvalid')).toBeHidden();
  });
});
