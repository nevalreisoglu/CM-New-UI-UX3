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
    expect(tiles).toEqual(['Entered', 'In journey', 'Exited']);
    await expect(app.locator('#mon-body .tbl').first()).toContainText('SMS');
    // anomaly alerts are Phase 2: nothing of the Marketing Agent shows while PHASE2 is off
    expect(await app.locator('#mon-body .alert').count()).toBe(0);
    await expect(app.locator('#mon-body')).not.toContainText('Marketing Agent');
    // one row per version, newest first
    const vs = await app.$$eval('#mvtable tbody tr td:first-child', (els) => els.map((e) => e.textContent.trim()));
    expect(vs).toEqual(['v1']);
    expect(await app.locator('[data-mexport]').count(), 'step export is Phase 2').toBe(0);
  });

  test('View version draws the read-only canvas with the stats strip and lists the steps', async ({ app }) => {
    await openMonitor(app, 'JRN-03');
    await app.locator('#mon-tabs [data-mt="version"]').click();
    await expect(app.locator('#mon-vwrap')).toBeVisible();
    await expect(app.locator('#mvsel')).toHaveValue('2');
    expect(await app.locator('#mcanvas .node').count()).toBe(9);
    expect(await app.locator('#mcanvas text.stat').count()).toBe(9);
    expect(await app.locator('#mcanvas .port').count(), 'read-only: no ports').toBe(0);
    expect(await app.locator('#mcanvas input').count(), 'read-only: no editable names').toBe(0);
    // the Closed v1 carries no statistics
    await app.selectOption('#mvsel', '1');
    expect(await app.locator('#mcanvas text.stat').count()).toBe(0);
    await expect(app.locator('#mon-body')).toContainText('no statistics');
    // Open in builder lands on that version
    await app.locator('#mon-open').click();
    await expect(app.locator('#jsplit')).toBeVisible();
    await expect(app.locator('#vsel')).toHaveValue('1');
  });

  test('a step on the version canvas selects it in the steps table (export is Phase 2)', async ({ app }) => {
    await openMonitor(app);
    await app.locator('#mon-tabs [data-mt="version"]').click();
    await app.locator('#mcanvas .node[data-id="s2"]').click();
    await expect(app.locator('#exp-modal')).toBeHidden();
    await expect(app.locator('#mon-body tr[data-mn="s2"]')).toHaveClass(/sel/);
  });

  test('the Contacts tab lists every contact with its current step and status; a row opens its step history', async ({ app }) => {
    await openMonitor(app, 'JRN-01');
    await app.locator('#mon-tabs [data-mt="contacts"]').click();
    const heads = await app.$$eval('#ctable thead th', (t) => t.map((x) => x.textContent.trim()));
    expect(heads).toEqual(['Contact', 'Event', 'Received at', 'Version', 'Current step', 'Status', 'Last delivery result']);
    const rows = app.locator('#ctable tr[data-ck]');
    expect(await rows.count()).toBeGreaterThan(5);
    const statuses = await app.$$eval('#ctable tr[data-ck] td:nth-child(6) .pill', (ps) => [...new Set(ps.map((p) => p.textContent.trim()))]);
    for (const st of statuses) expect(['waiting', 'in step', 'exited', 'held out']).toContain(st);
    await expect(rows.first().locator('td').nth(6)).toContainText(/Email|skipped|—/);
    // lookup narrows the list; the row opens the per-contact log
    const name = await rows.first().locator('td:first-child span').textContent();
    await app.fill('#con-q', name.split('·')[0].trim());
    const n = await app.locator('#ctable tr[data-ck]').count();
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThan(await rows.count() + 1);
    await app.locator('#ctable tr[data-ck]').first().click();
    await expect(app.locator('#ctable tr.chist')).toBeVisible();
    expect(await app.locator('#ctable tr.chist .clog li').count()).toBeGreaterThan(0);
    await expect(app.locator('#ctable tr.chist')).toContainText('Step history');
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
    await app.locator('#jtabs [data-jst="Draft"]').click();
    await app.locator('#jl-table [data-jopen="JRN-05"]').click();
    await expect(app.locator('#jvalid')).toBeHidden();
    await app.locator('#btn-activate').click();
    await expect(app.locator('#jvalid')).toBeVisible();
    await expect(app.locator('#jvalid .jv-h b')).toContainText('2 check(s) block Activate');
    await app.locator('#jvalid [data-jvsel]').first().click();
    await expect(app.locator('#jp-title')).toContainText('Delivery');
    await app.locator('#jv-close').click();
    await expect(app.locator('#jvalid')).toBeHidden();
  });
});
