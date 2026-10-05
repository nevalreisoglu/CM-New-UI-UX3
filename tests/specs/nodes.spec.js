// @ts-check
const { test, expect, setRole } = require('./fixtures');

/**
 * The step inventory: a grouped palette, one entry step per version whose type is picked
 * from the Entry group, type-driven path labels on waits and splits, and validation that
 * blocks Activate.
 */
async function openDraft(app) {
  await app.locator('.nav button[data-view="journeys"]').click();
  await app.locator('#jl-table [data-jopen="JRN-06"]').click();
  await expect(app.locator('#jsplit')).toBeVisible();
  await expect(app.locator('#vbar [data-tour="v-status"]')).toHaveText('Draft');
}
const nodesOf = (app) => app.evaluate(() => curCtx().nodes.map((n) => [n.id, n.type, n.next.map((x) => (typeof x === 'string' ? x : x.label + '→' + x.to))]));

test.describe('step inventory', () => {
  test('the palette is grouped Entry · Message · Wait · Split · Action in that order', async ({ app }) => {
    await openDraft(app);
    const groups = await app.$$eval('#palette .pg span', (els) => els.map((e) => e.textContent.trim()));
    expect(groups).toEqual(['Entry', 'Message', 'Wait', 'Split', 'Action']);
    const labels = await app.$$eval('#palette button:not(.tog) span', (els) => els.map((e) => e.textContent.replace(/\s*CM$/, '').trim()));
    expect(labels).toEqual([
      'Segment', 'Date attribute', 'Event (API / BSS)', 'Joins list', 'Unengaged', 'Digital Twin signal', 'Agent suggestion',
      'Delivery',
      'Wait duration', 'Wait until date', 'Wait for event', 'Wait for segment match', 'Priority',
      'Engagement split', 'Segment split', 'Shuffle',
      'Set attribute', 'Call external', 'Control group', 'Audience sync', 'Exit',
    ]);
  });

  test('an Entry palette item swaps the type of the one entry step instead of adding a step', async ({ app }) => {
    await openDraft(app);
    const before = (await nodesOf(app)).length;
    await app.locator('#palette button[data-tour="pal-entry-unengaged"]').click();
    const nodes = await nodesOf(app);
    expect(nodes.length).toBe(before);
    expect(nodes.filter((n) => n[1] === 'entry').length).toBe(1);
    expect(await app.evaluate(() => curCtx().nodes[0].cfg.kind)).toBe('unengaged');
    await expect(app.locator('#jp-title')).toContainText('Entry · Unengaged');
    await expect(app.locator('#f-days')).toHaveValue('90');
    // the Event entry shows an API code sample
    await app.locator('#jp-body [data-ek="event"]').click();
    await app.locator('#btn-apicode').click();
    await expect(app.locator('#apicode')).toContainText('POST https://api.example.com/journeys/v1/events');
  });

  test('a Wait for event has accepted · rejected · timeout paths and the port takes the next free one', async ({ app }) => {
    await openDraft(app);
    await app.locator('#canvas .node[data-id="s3"]').click();
    const paths = await app.$$eval('#jp-body .path b', (els) => els.map((e) => e.textContent.trim()));
    expect(paths).toEqual(['accepted', 'rejected', 'timeout']);
    await expect(app.locator('#jp-body .path').nth(1)).toContainText('not connected');
    // connecting from the wait takes the free "rejected" path
    const ok = await app.evaluate(() => connect(curCtx(), 's3', 's5'));
    expect(ok).toBe(true);
    expect((await nodesOf(app)).find((n) => n[0] === 's3')[2]).toEqual(['accepted→s6', 'timeout→s4', 'rejected→s5']);
    // a fourth connection is refused: every path has a target
    expect(await app.evaluate(() => connect(curCtx(), 's3', 's2'))).toBe(false);
  });

  test('a Delivery dropped after a Delivery gets a Wait slipped in between', async ({ app }) => {
    await openDraft(app);
    await app.locator('#canvas .node[data-id="s2"]').click();
    await app.locator('#palette button[data-tour="pal-delivery"]').click();
    const nodes = await nodesOf(app);
    const s2 = nodes.find((n) => n[0] === 's2');
    const wait = nodes.find((n) => n[1] === 'waitDur' && s2[2].includes(n[0]));
    expect(wait, 'the delivery now points at a new Wait duration').toBeTruthy();
    expect(nodes.find((n) => n[0] === wait[2][0])[1]).toBe('delivery');
    await expect(app.locator('#toast')).toContainText('Wait added');
  });

  test('an Engagement split binds to a Delivery and offers one path per interaction plus Remaining', async ({ app }) => {
    await openDraft(app);
    await app.locator('#canvas .node[data-id="s2"]').click();
    await app.locator('#palette button[data-tour="pal-splitEng"]').click();
    await expect(app.locator('#jp-title')).toContainText('Engagement split');
    await expect(app.locator('#f-delivery')).toHaveValue('s2');
    await app.locator('#jp-body [data-int="converted"]').click();
    const paths = await app.$$eval('#jp-body .path b', (els) => els.map((e) => e.textContent.trim()));
    expect(paths).toEqual(['opened', 'clicked', 'converted', 'Remaining']);
  });

  test('validation names the gaps and blocks Activate until they are fixed', async ({ app }) => {
    await setRole(app, 'approver');
    await openDraft(app);
    // the sample draft has an unconnected "rejected" path
    await app.locator('#btn-validate').click();
    await expect(app.locator('#toast')).toContainText('Every path ends in an Exit: Paid?');
    await app.locator('#btn-activate').click();
    await expect(app.locator('#toast')).toContainText('Cannot activate');
    expect(await app.evaluate(() => JOURNEYS.find((j) => j.id === 'JRN-06').versions[0].status)).toBe('Draft');
    // connect the path and it goes through
    await app.evaluate(() => { connect(curCtx(), 's3', 's5'); renderCanvas(); });
    await app.locator('#btn-activate').click();
    expect(await app.evaluate(() => JOURNEYS.find((j) => j.id === 'JRN-06').versions[0].status)).toBe('Active');
    // live versions show the stats strip on every card
    expect(await app.locator('#canvas text.stat').count()).toBeGreaterThan(0);
  });

  test('Shuffle weights are checked and "Set equal" fixes them', async ({ app }) => {
    await openDraft(app);
    await app.locator('#canvas .node[data-id="s2"]').click();
    await app.locator('#palette button[data-tour="pal-splitShuffle"]').click();
    await app.locator('#btn-sh-add').click();
    await expect(app.locator('#jp-body .pill.ok')).toHaveText('100%'); // A 50 · B 50 · C 0 — still 100
    await app.fill('#jp-body [data-sh-w="2"]', '30');
    await expect(app.locator('#jp-body .pill.warn')).toHaveText('130%');
    await app.locator('#btn-sh-eq').click();
    const ws = await app.evaluate(() => curCtx().nodes[curCtx().nodes.length - 1].cfg.paths.map((p) => p.w));
    expect(ws.reduce((a, b) => a + b, 0)).toBe(100);
    expect(ws).toEqual([34, 33, 33]);
  });
});
