// @ts-check
const { test, expect, setRole } = require('./fixtures');

/**
 * The step inventory: a grouped palette, one entry step per version whose type is picked
 * from the Entry group, type-driven path labels on waits and splits, and validation that
 * blocks Activate.
 */
async function openDraft(app) {
  await app.locator('.nav button[data-view="journeys"]').click();
  await app.locator('#jtabs [data-jst="Draft"]').click();
  await app.locator('#jl-table [data-jopen="JRN-05"]').click();
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
    // Phase 1 inventory (PHASE2 off): one Event entry, Delivery, Duration wait, three splits, Control group and Exit
    expect(labels).toEqual(['Event – single contact', 'Event – multiple contacts', 'Delivery', 'Wait duration', 'Engagement split', 'Segment split', 'Shuffle', 'Control group', 'Exit']);
  });

  test('the Entry group offers the two Event entries in Phase 1, with single and batch API code samples', async ({ app }) => {
    await openDraft(app);
    expect(await app.locator('#palette button[data-tour^="pal-entry-"]').count()).toBe(2);
    await app.locator('#canvas .node[data-id="e1"]').click();
    expect(await app.locator('#jp-body [data-ek]').count()).toBe(2);
    await expect(app.locator('#jp-title')).toContainText('Entry · Event – single contact');
    await expect(app.locator('#jp-body')).toContainText('processed within 60 s');
    await expect(app.locator('#jp-body .param').first()).toContainText('{{payload.');
    await app.locator('#btn-apicode').click();
    await expect(app.locator('#apicode')).toContainText('POST https://api.example.com/journeys/v1/events');
    await expect(app.locator('#apicode')).toContainText('"contactId": "{{contactId}}"');
    // the batch entry swaps in and shows a list of contacts
    await app.locator('#jp-body [data-ek="eventBatch"]').click();
    await app.locator('#btn-apicode').click();
    await expect(app.locator('#apicode')).toContainText('/events/batch');
    await expect(app.locator('#apicode')).toContainText('"contacts"');
  });

  test('a Segment split always ends with Remaining and the port takes the next free path', async ({ app }) => {
    await openDraft(app);
    await app.locator('#canvas .node[data-id="s2"]').click();
    await app.locator('#palette button[data-tour="pal-splitSeg"]').click();
    const paths = await app.$$eval('#jp-body .paths .path b', (els) => els.map((e) => e.textContent.trim()));
    expect(paths.length).toBe(2);
    expect(paths[paths.length - 1]).toBe('Remaining');
    const sid = await app.evaluate(() => selNode);
    expect(await app.evaluate((id) => connect(curCtx(), id, 's3'), sid)).toBe(true);
    expect(await app.evaluate((id) => connect(curCtx(), id, 'e1'), sid)).toBe(true);
    expect(await app.evaluate((id) => connect(curCtx(), id, 's2'), sid), 'every path has a target').toBe(false);
    const edges = (await nodesOf(app)).find((n) => n[0] === sid)[2];
    expect(edges.some((e) => e.startsWith('Remaining→'))).toBe(true);
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
    // Phase 1: opened and clicked only
    expect(await app.locator('#jp-body [data-int]').count()).toBe(2);
    const paths = await app.$$eval('#jp-body .path b', (els) => els.map((e) => e.textContent.trim()));
    expect(paths).toEqual(['opened', 'clicked', 'Remaining']);
  });

  test('validation names the gaps and blocks Activate until they are fixed', async ({ app }) => {
    await setRole(app, 'approver');
    await openDraft(app);
    // the sample draft's e-mail is not connected to its Exit yet
    await app.locator('#btn-validate').click();
    await expect(app.locator('#jvalid')).toContainText('Every path ends in an Exit: E-mail · changement de forfait');
    await app.locator('#btn-activate').click();
    await expect(app.locator('#toast')).toContainText('Cannot activate');
    expect(await app.evaluate(() => JOURNEYS.find((j) => j.id === 'JRN-05').versions[0].status)).toBe('Draft');
    // connect the path and it goes through
    await app.evaluate(() => { connect(curCtx(), 's2', 's3'); renderCanvas(); });
    await app.locator('#btn-activate').click();
    expect(await app.evaluate(() => JOURNEYS.find((j) => j.id === 'JRN-05').versions[0].status)).toBe('Active');
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

test.describe('delivery parity (Phase 1)', () => {
  test('Email · SMS · Push only, FR / EN variants with a default language, offer placeholders and the SMS counter', async ({ app }) => {
    await openDraft(app);
    await app.evaluate(() => { selNode = 's2'; renderCanvas(); renderNodePanel(); });
    const chans = await app.$$eval('#f-channel option', (os) => os.map((o) => o.value));
    expect(chans).toEqual(['email', 'sms', 'push']);
    await app.selectOption('#f-channel', 'sms');
    await app.fill('#f-l-text', 'Fizz: votre forfait passe à {{payload.to}} le {{payload.effectiveOn}}.');
    await expect(app.locator('.langtabs .tabs button.on')).toContainText('FR');
    await expect(app.locator('.langtabs .tabs button.on small')).toHaveText('default');
    await expect(app.locator('#jp-body .smscount')).toContainText('segment');
    // the EN tab edits a separate variant; the default moves with the radio
    await app.locator('.langtabs [data-lang="en"]').click();
    await app.fill('#f-l-text', 'Fizz: payment pending. Update your card: fizz.ca/pay');
    await app.locator('#jp-body input[data-deflang="en"]').check();
    const cfg = await app.evaluate(() => { const n = curCtx().nodes.find((x) => x.id === 's2'); return { def: n.cfg.lang.default, en: n.cfg.lang.en.text, fr: n.cfg.lang.fr.text }; });
    expect(cfg.def).toBe('en');
    expect(cfg.en).toContain('payment pending');
    expect(cfg.fr).not.toBe(cfg.en);
    // an offer adds its placeholders
    await app.selectOption('#f-offer', 'OFR-10');
    await expect(app.locator('#jp-body [data-jins="offer.name"]')).toBeVisible();
    await expect(app.locator('#jp-body [data-jins="payload.effectiveOn"]')).toBeVisible();
    // a test send exists per language
    expect(await app.locator('#jp-body [data-testsend]').count()).toBe(2);
  });

  test('a contact without a phone number skips the SMS step and continues on the path', async ({ app }) => {
    // the live payment-failed journey sends an SMS first: a contact without a number skips it
    await app.locator('.nav button[data-view="journeys"]').click();
    await app.locator('#jl-table [data-jopen="JRN-04"]').click();
    await expect(app.locator('#jsplit')).toBeVisible();
    const r = await app.evaluate(() => {
      const C = curCtx(); const c = CUSTOMERS[0]; const S = simOf(C); const saved = c.row.MSISDN; c.row.MSISDN = '';
      sendEvent('payment_failed', c.id); for (let i = 0; i < 5; i++) tick(); c.row.MSISDN = saved;
      const p = S.parts[c.id]; const e = p && p.eng['s2'];
      return { skipped: !!(e && e.skipped), reason: e && e.reason, status: p && p.status, skips: p && p.skips, stat: nodeStats(C, C.nodes.find((n) => n.id === 's2')).skipped };
    });
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no phone number');
    expect(r.skips).toBe(1);
    expect(r.stat).toBeGreaterThanOrEqual(1);
    expect(['exited', 'completed', 'converted']).toContain(r.status);
  });
});
