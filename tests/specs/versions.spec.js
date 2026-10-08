// @ts-check
const { test, expect, setRole } = require('./fixtures');

/**
 * The journey model: a journey is a container, steps live in a version.
 * Draft → Active → Closing → Closed per version; one Active version per journey.
 */
async function openJourney(app, id) {
  await app.locator('.nav button[data-view="journeys"]').click();
  await app.locator(`#jl-table [data-jopen="${id}"]`).click();
  await expect(app.locator('#jsplit')).toBeVisible();
}
const versions = (app, id) => app.evaluate((jid) => JOURNEYS.find((j) => j.id === jid).versions.map((v) => [v.v, v.status]), id);

test.describe('journey versions', () => {
  test('the list has Drafts / Live / Past tabs and derives the status from the versions', async ({ app }) => {
    // Live is the default tab; every row on it is a live journey
    await expect(app.locator('#jtabs button.on')).toHaveAttribute('data-jst', 'Live');
    expect(await app.locator('#jl-table tbody tr[data-jid]').count()).toBe(4);
    // JRN-01 carries an Active v14 (with its note) and a Closing v13
    const row = app.locator('#jl-table tr[data-jid="JRN-01"]');
    await expect(row).toContainText('v14');
    await expect(row).toContainText('V14 – new template');
    await expect(row.locator('.pill.warn')).toContainText('v13 closing');
    const heads = await app.$$eval('#jl-table thead th', (t) => t.map((x) => x.textContent.trim()));
    expect(heads).toEqual(expect.arrayContaining(['Journey', 'Project', 'Event', 'Channels', 'Active version', 'Entered (30d)', 'Last modified', 'Modified by']));
    await app.locator('#jtabs [data-jst="Draft"]').click();
    expect(await app.$$eval('#jl-table tbody tr[data-jid]', (rs) => rs.map((r) => r.dataset.jid))).toEqual(['JRN-05']);
    await app.locator('#jtabs [data-jst="Past"]').click();
    expect(await app.$$eval('#jl-table tbody tr[data-jid]', (rs) => rs.map((r) => r.dataset.jid))).toEqual(['JRN-06']);
    // the lifecycle coverage strip is Phase 2
    expect(await app.locator('.cover').count()).toBe(0);
  });

  test('the version bar names the version, who activated it and when; the structure is locked', async ({ app }) => {
    await openJourney(app, 'JRN-01');
    await expect(app.locator('#vsel')).toHaveValue('14');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by');
    // Active: no delete handles, no ports, palette greyed; step content still editable
    expect(await app.locator('#canvas .ndel').count()).toBe(0);
    expect(await app.locator('#canvas .port').count()).toBe(0);
    await expect(app.locator('#jb')).toHaveClass(/locked/);
    await expect(app.locator('#canvas .nname input').first()).toBeEnabled();
    // the version dropdown switches to the Closing v13 and the Closed v12
    await app.selectOption('#vsel', '13');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Closing');
    await app.selectOption('#vsel', '12');
    await expect(app.locator('#vbar .vb-who')).toContainText('closed');
    await expect(app.locator('#canvas .nname input').first()).toBeDisabled();
  });

  test('a marketer submits a Draft for approval; an approver activates it and the Active version goes to Closing', async ({ app }) => {
    await openJourney(app, 'JRN-03');
    await app.locator('#btn-copyv').click();
    await expect(app.locator('#vsel')).toHaveValue('3');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    await expect(app.locator('#jb')).not.toHaveClass(/locked/);
    // a version note, typed inline, shows in the dropdown
    await app.fill('#vb-note', 'V3 – SMS copy');
    await app.locator('#vb-note').press('Enter');
    await expect(app.locator('#vsel option[value="3"]')).toHaveText(/V3 – SMS copy/);
    // the marketer cannot activate — only submit
    expect(await app.locator('#btn-activate').count()).toBe(0);
    await app.locator('#btn-submit').click();
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Pending approval');
    await expect(app.locator('#vbar .vb-who')).toContainText('waiting for an approver');
    // an edit withdraws the submission
    await app.evaluate(() => { selNode = 's4'; renderCanvas(); renderNodePanel(); });
    await app.fill('#f-label', 'E-mail · bienvenue (v3)');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    await app.locator('#btn-submit').click();

    await setRole(app, 'approver');
    await expect(app.locator('#btn-activate')).toBeEnabled();
    await app.locator('#btn-activate').click();
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by Camille Tremblay');
    // the welcome contacts inside v2 keep finishing their steps; Closed comes when they are all out
    await app.selectOption('#vsel', '2');
    await expect(app.locator('#vbar .vb-who')).toContainText('closing since');
  });

  test('Stop offers Closing or Closed; Closed releases the contacts inside', async ({ app }) => {
    await setRole(app, 'approver');
    await openJourney(app, 'JRN-04');
    const inside = await app.evaluate(() => Object.values(sim['JRN-04@1'].parts).filter((p) => p.status === 'active').length);
    expect(inside).toBeGreaterThan(0);
    await app.locator('#btn-stop').click();
    await expect(app.locator('[data-stop="closing"]')).toBeVisible();
    await app.locator('[data-stop="closed"]').click();
    expect(await versions(app, 'JRN-04')).toEqual([[1, 'Closed']]);
    expect(await app.evaluate(() => Object.values(sim['JRN-04@1'].parts).filter((p) => p.status === 'active').length)).toBe(0);
    // nothing live is left, so the journey moves to the Past tab
    await app.locator('#btn-jback').click();
    expect(await app.locator('#jl-table tr[data-jid="JRN-04"]').count()).toBe(0);
    await app.locator('#jtabs [data-jst="Past"]').click();
    await expect(app.locator('#jl-table tr[data-jid="JRN-04"]')).toBeVisible();
  });

  test('journey settings live on the panel: folder, ignore unsubscribe, test users (phase / priority / end date are Phase 2)', async ({ app }) => {
    await openJourney(app, 'JRN-02');
    const set = app.locator('#jset');
    await expect(set).toHaveAttribute('open', '');
    await app.selectOption('#js-folder', 'billing');
    expect(await app.locator('#js-phase, #js-priority, #js-endDate').count(), 'phase, priority and end date are Phase 2').toBe(0);
    await app.locator('#js-tu-add').click({ trial: true }); // the prompt() is not driven here
    const j = await app.evaluate(() => { const x = JOURNEYS.find((j) => j.id === 'JRN-02'); return { folder: x.folder, tu: x.testUsers.length }; });
    expect(j).toEqual({ folder: 'billing', tu: 1 });
    // selecting a step folds the settings away and shows the step
    await app.locator('#canvas .node').first().click();
    await expect(set).not.toHaveAttribute('open', '');
    await expect(app.locator('#jp-title')).toContainText('Step');
    await app.locator('#btn-jback').click();
    await expect(app.locator('#jl-table tr[data-jid="JRN-02"]')).toContainText('billing');
  });

  test('Create your journey asks for folder and phase and starts a Draft v1', async ({ app }) => {
    await app.locator('#jl-new').click();
    await app.fill('#jc-name', 'Winback — unengaged 90d');
    await app.selectOption('#jc-folder', 'billing');
    await app.selectOption('#jc-phase', 'Winback');
    await app.locator('#jc-start').click();
    await expect(app.locator('#jsplit')).toBeVisible();
    await expect(app.locator('#vsel')).toHaveValue('1');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    const j = await app.evaluate(() => { const x = JOURNEYS[JOURNEYS.length - 1]; return [x.folder, x.phase, x.versions.length, x.versions[0].status]; });
    expect(j).toEqual(['billing', 'Winback', 1, 'Draft']);
  });
});
