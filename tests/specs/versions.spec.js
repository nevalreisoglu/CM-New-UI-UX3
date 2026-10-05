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
  test('the list derives Draft / Live / Past from the versions and shows the lifecycle coverage', async ({ app }) => {
    const statuses = await app.$$eval('#jl-table tbody tr[data-jid] td:nth-child(5) .pill', (ps) => ps.map((p) => p.textContent.trim()));
    expect(statuses).toEqual(['Live', 'Live', 'Live']);
    // JRN-07 carries an Active v3 and a Closing v2
    const row = app.locator('#jl-table tr[data-jid="JRN-07"]');
    await expect(row).toContainText('v3');
    await expect(row.locator('.pill.warn')).toContainText('v2 closing');
    // five phases, two of them without a live journey
    expect(await app.locator('.cover .cv').count()).toBe(5);
    expect(await app.locator('.cover .cv.gap').count()).toBe(2);
    await app.locator('.cover .cv[data-cvp="Retain"]').click();
    expect(await app.locator('#jl-table tbody tr[data-jid]').count()).toBe(1);
  });

  test('the version bar names the version, who activated it and when; the structure is locked', async ({ app }) => {
    await openJourney(app, 'JRN-07');
    await expect(app.locator('#vsel')).toHaveValue('3');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by');
    // Active: no delete handles, no ports, palette greyed; step content still editable
    expect(await app.locator('#canvas .ndel').count()).toBe(0);
    expect(await app.locator('#canvas .port').count()).toBe(0);
    await expect(app.locator('#jb')).toHaveClass(/locked/);
    await expect(app.locator('#canvas .nsel select').first()).toBeEnabled();
    // the version dropdown switches to the Closing v2 and the Closed v1
    await app.selectOption('#vsel', '2');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Closing');
    await app.selectOption('#vsel', '1');
    await expect(app.locator('#vbar .vb-who')).toContainText('closed');
    await expect(app.locator('#canvas .nsel select').first()).toBeDisabled();
  });

  test('a marketer cannot activate; an approver activates a Draft and the Active version goes to Closing', async ({ app }) => {
    await openJourney(app, 'JRN-20');
    await app.locator('#btn-copyv').click();
    await expect(app.locator('#vsel')).toHaveValue('2');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    await expect(app.locator('#jb')).not.toHaveClass(/locked/);
    await expect(app.locator('#btn-activate')).toBeDisabled();

    await setRole(app, 'approver');
    await expect(app.locator('#btn-activate')).toBeEnabled();
    await app.locator('#btn-activate').click();
    // JRN-20 is event-only: the Closing v1 has nobody inside, so it closes itself at once
    expect(await versions(app, 'JRN-20')).toEqual([[1, 'Closed'], [2, 'Active']]);
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by Ayşe Demir');
    await app.selectOption('#vsel', '1');
    await expect(app.locator('#vbar .vb-who')).toContainText('closed');
  });

  test('Stop offers Closing or Closed; Closed releases the contacts inside', async ({ app }) => {
    await setRole(app, 'approver');
    await openJourney(app, 'JRN-07');
    const inside = await app.evaluate(() => Object.values(sim['JRN-07@3'].parts).filter((p) => p.status === 'active').length);
    expect(inside).toBeGreaterThan(0);
    await app.locator('#btn-stop').click();
    await expect(app.locator('[data-stop="closing"]')).toBeVisible();
    await app.locator('[data-stop="closed"]').click();
    expect(await versions(app, 'JRN-07')).toEqual([[1, 'Closed'], [2, 'Closing'], [3, 'Closed']]);
    expect(await app.evaluate(() => Object.values(sim['JRN-07@3'].parts).filter((p) => p.status === 'active').length)).toBe(0);
    // the journey is still Live through the Closing v2
    await app.locator('#btn-jback').click();
    await expect(app.locator('#jl-table tr[data-jid="JRN-07"] td:nth-child(5) .pill')).toHaveText('Live');
  });

  test('journey settings live on the panel: folder, phase, priority, end date, ignore unsubscribe, test users', async ({ app }) => {
    await openJourney(app, 'JRN-12');
    const set = app.locator('#jset');
    await expect(set).toHaveAttribute('open', '');
    await app.selectOption('#js-phase', 'Acquire');
    await app.fill('#js-priority', '90');
    await app.locator('#js-tu-add').click({ trial: true }); // the prompt() is not driven here
    const j = await app.evaluate(() => { const x = JOURNEYS.find((j) => j.id === 'JRN-12'); return { phase: x.phase, priority: x.priority, tu: x.testUsers.length }; });
    expect(j).toEqual({ phase: 'Acquire', priority: 90, tu: 1 });
    // selecting a step folds the settings away and shows the step
    await app.locator('#canvas .node').first().click();
    await expect(set).not.toHaveAttribute('open', '');
    await expect(app.locator('#jp-title')).toContainText('Step');
    // and the phase change is already on the list's coverage strip
    await app.locator('#btn-jback').click();
    await expect(app.locator('.cover .cv[data-cvp="Acquire"] b')).toHaveText('1');
  });

  test('Create your journey asks for folder and phase and starts a Draft v1', async ({ app }) => {
    await app.locator('#jl-new').click();
    await app.fill('#jc-name', 'Winback — unengaged 90d');
    await app.selectOption('#jc-folder', 'churn_reduction');
    await app.selectOption('#jc-phase', 'Winback');
    await app.locator('#jc-start').click();
    await expect(app.locator('#jsplit')).toBeVisible();
    await expect(app.locator('#vsel')).toHaveValue('1');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    const j = await app.evaluate(() => { const x = JOURNEYS[JOURNEYS.length - 1]; return [x.folder, x.phase, x.versions.length, x.versions[0].status]; });
    expect(j).toEqual(['churn_reduction', 'Winback', 1, 'Draft']);
  });
});
