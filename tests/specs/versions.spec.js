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
    expect(statuses).toEqual(['Live', 'Live', 'Live', 'Live', 'Live', 'Draft', 'Past']);
    // JRN-01 carries an Active v13 and a Closing v12
    const row = app.locator('#jl-table tr[data-jid="JRN-01"]');
    await expect(row).toContainText('v13');
    await expect(row.locator('.pill.warn')).toContainText('v12 closing');
    // five phases, one of them without a live journey (Retain only has the Draft)
    expect(await app.locator('.cover .cv').count()).toBe(5);
    expect(await app.locator('.cover .cv.gap').count()).toBe(1);
    await app.locator('.cover .cv[data-cvp="Retain"]').click();
    expect(await app.locator('#jl-table tbody tr[data-jid]').count()).toBe(1);
    await expect(app.locator('#jl-table tbody tr[data-jid]')).toHaveAttribute('data-jid', 'JRN-06');
  });

  test('the version bar names the version, who activated it and when; the structure is locked', async ({ app }) => {
    await openJourney(app, 'JRN-01');
    await expect(app.locator('#vsel')).toHaveValue('13');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by');
    // Active: no delete handles, no ports, palette greyed; step content still editable
    expect(await app.locator('#canvas .ndel').count()).toBe(0);
    expect(await app.locator('#canvas .port').count()).toBe(0);
    await expect(app.locator('#jb')).toHaveClass(/locked/);
    await expect(app.locator('#canvas .nname input').first()).toBeEnabled();
    // the version dropdown switches to the Closing v12 and the Closed v11
    await app.selectOption('#vsel', '12');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Closing');
    await app.selectOption('#vsel', '11');
    await expect(app.locator('#vbar .vb-who')).toContainText('closed');
    await expect(app.locator('#canvas .nname input').first()).toBeDisabled();
  });

  test('a marketer cannot activate; an approver activates a Draft and the Active version goes to Closing', async ({ app }) => {
    await openJourney(app, 'JRN-03');
    await app.locator('#btn-copyv').click();
    await expect(app.locator('#vsel')).toHaveValue('2');
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
    await expect(app.locator('#jb')).not.toHaveClass(/locked/);
    await expect(app.locator('#btn-activate')).toBeDisabled();

    await setRole(app, 'approver');
    await expect(app.locator('#btn-activate')).toBeEnabled();
    await app.locator('#btn-activate').click();
    await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Active');
    await expect(app.locator('#vbar .vb-who')).toContainText('activated by Camille Tremblay');
    // the birthday contacts inside v1 keep finishing their steps; Closed comes when they are all out
    await app.selectOption('#vsel', '1');
    await expect(app.locator('#vbar .vb-who')).toContainText('closing since');
  });

  test('Stop offers Closing or Closed; Closed releases the contacts inside', async ({ app }) => {
    await setRole(app, 'approver');
    await openJourney(app, 'JRN-04');
    const inside = await app.evaluate(() => Object.values(sim['JRN-04@4'].parts).filter((p) => p.status === 'active').length);
    expect(inside).toBeGreaterThan(0);
    await app.locator('#btn-stop').click();
    await expect(app.locator('[data-stop="closing"]')).toBeVisible();
    await app.locator('[data-stop="closed"]').click();
    expect(await versions(app, 'JRN-04')).toEqual([[3, 'Closed'], [4, 'Closed']]);
    expect(await app.evaluate(() => Object.values(sim['JRN-04@4'].parts).filter((p) => p.status === 'active').length)).toBe(0);
    // nothing live is left, so the journey is Past
    await app.locator('#btn-jback').click();
    await expect(app.locator('#jl-table tr[data-jid="JRN-04"] td:nth-child(5) .pill')).toHaveText('Past');
  });

  test('journey settings live on the panel: folder, phase, priority, end date, ignore unsubscribe, test users', async ({ app }) => {
    await openJourney(app, 'JRN-05');
    const set = app.locator('#jset');
    await expect(set).toHaveAttribute('open', '');
    await app.selectOption('#js-phase', 'Retain');
    await app.fill('#js-priority', '90');
    await app.locator('#js-tu-add').click({ trial: true }); // the prompt() is not driven here
    const j = await app.evaluate(() => { const x = JOURNEYS.find((j) => j.id === 'JRN-05'); return { phase: x.phase, priority: x.priority, tu: x.testUsers.length }; });
    expect(j).toEqual({ phase: 'Retain', priority: 90, tu: 1 });
    // selecting a step folds the settings away and shows the step
    await app.locator('#canvas .node').first().click();
    await expect(set).not.toHaveAttribute('open', '');
    await expect(app.locator('#jp-title')).toContainText('Step');
    // and the phase change is already on the list's coverage strip
    await app.locator('#btn-jback').click();
    await expect(app.locator('.cover .cv[data-cvp="Retain"] b')).toHaveText('1');
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
