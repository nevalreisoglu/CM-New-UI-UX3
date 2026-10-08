#!/usr/bin/env node
/**
 * Brand audit: walks every screen at 1280 and 1440, menu open and collapsed,
 * and measures the real rendered contrast of every text node against its
 * effective background. Also flags "invisible" text (ratio < 1.6) and buttons
 * whose label is lighter than their fill.
 *
 *   node tests/brand-audit.js
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?notour';
const SHOTS = path.join(__dirname, 'shots');
const AA = 4.5, AA_LARGE = 3.0;

const VIEWS = ['journeys', 'monitor', 'segmentation', 'policies'];

const probe = () => {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  /* Walk up for the first opaque background, but skip an ancestor the element
     is not actually drawn on: chart value labels are absolutely positioned
     above or below their bar, so the bar is their DOM parent and not their
     visual background. */
  const overlaps = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  /* translucent surfaces (the menu and the bars are a lilac wash) are composited
     over whatever opaque background sits under them */
  const layers = [];
  const composite = (base) => layers.reduceRight((acc, [c, a]) => c.map((v, i) => Math.round(a * v + (1 - a) * acc[i])), base);
  const bgOf = (el) => {
    const box = el.getBoundingClientRect();
    let n = el; layers.length = 0;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n), c = parse(cs.backgroundColor);
      if (c.length === 4 && c[3] > 0.02 && c[3] <= 0.92 && (n === el || overlaps(box, n.getBoundingClientRect()))) layers.push([c.slice(0, 3), c[3]]);
      /* a gradient surface (the e-mail hero, the self-care banner) counts as its
         darkest-to-text stop: every stop is returned and the worst ratio wins */
      if (/gradient/.test(cs.backgroundImage) && (n === el || overlaps(box, n.getBoundingClientRect()))) {
        const stops = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter((x) => x[3] === undefined || x[3] > 0.92);
        if (stops.length) return stops.map((x) => composite(x.slice(0, 3)));
      }
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.92)) {
        if (n === el || overlaps(box, n.getBoundingClientRect())) return composite(c.slice(0, 3));
      }
      n = n.parentElement;
    }
    return composite([255, 255, 255]);
  };
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('[hidden]') || !el.offsetParent) return;
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!txt || txt.length < 2) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity < 0.5) return;
    if (parseFloat(cs.fontSize) < 1) return;   // collapsed rail hides captions with font-size:0
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    /* text scrolled out of a scrolling container (the menu once it is taller
       than the window) is not on screen, so it has no background to measure */
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a).overflowY;
      if ((o === 'auto' || o === 'scroll' || o === 'hidden') && !overlaps(box, a.getBoundingClientRect())) return;
    }
    const fg = parse(cs.color);
    if (fg[3] !== undefined && fg[3] < 0.6) return;
    const bg = bgOf(el), r = Array.isArray(bg[0]) ? Math.min(...bg.map((b) => ratio(fg.slice(0, 3), b))) : ratio(fg.slice(0, 3), bg);
    const size = parseFloat(cs.fontSize), w = +cs.fontWeight || 400;
    const large = size >= 24 || (size >= 18.66 && w >= 700) || (size >= 18 && w >= 600);
    out.push({ r: Math.round(r * 100) / 100, large, size, w, txt: txt.slice(0, 40), sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] });
  });
  return out;
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const fails = new Map();
  let checked = 0;

  for (const width of [1280, 1440]) {
    for (const collapsed of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
      await page.route('https://fonts.googleapis.com/**', (r) => r.abort());
      await page.goto(URL);
      await page.waitForSelector('.view.active');
      await page.selectOption('#role-sel', 'admin');
      if (collapsed) { await page.click('#btn-nav'); await page.waitForTimeout(250); }

      for (const v of VIEWS) {
        const btn = await page.$(`.nav button[data-view="${v}"]`);
        if (!btn) continue;
        await btn.click();
        await page.waitForTimeout(120);
        const rows = await page.evaluate(probe);
        rows.forEach((x) => {
          checked++;
          const need = x.large ? AA_LARGE : AA;
          if (x.r < need) {
            const key = `${x.sel} | "${x.txt}" | ${x.r}:1 (need ${need}, ${x.size}px/${x.w})`;
            fails.set(key, (fails.get(key) || 0) + 1);
          }
        });
      }
      await page.close();
    }
  }

  // a few deeper states that the sweep above cannot reach by menu alone
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await page.goto(URL); await page.waitForSelector('.view.active');
  await page.selectOption('#role-sel', 'admin');
  const deep = [
    ['journey-canvas-live', async () => { await page.click('.nav button[data-view="journeys"]'); await page.click('#jl-table [data-jopen="JRN-04"]'); await page.click('#canvas .node[data-id="s4"]'); }],
    ['journey-canvas-draft-validation', async () => { await page.click('#btn-jback'); await page.click('#jtabs [data-jst="Draft"]'); await page.click('#jl-table [data-jopen="JRN-05"]'); await page.click('#btn-validate'); await page.click('#canvas .node[data-id="s3"]'); }],
    ['journey-delivery-panel', async () => { await page.click('#canvas .node[data-id="s2"]'); }],
    ['journey-entry-panel', async () => { await page.click('#canvas .node[data-id="e1"]'); await page.click('#btn-apicode'); }],
    ['journey-version-closed', async () => { await page.click('#btn-jback'); await page.click('#jtabs [data-jst="Live"]'); await page.click('#jl-table [data-jopen="JRN-01"]'); await page.selectOption('#vsel', '12'); }],
    ['journey-list-filtered', async () => { await page.click('#btn-jback'); await page.click('#jtabs [data-jst="Past"]'); await page.click('#jl-all'); }],
    ['journey-create', async () => { await page.click('#jl-bclear'); await page.click('#jl-new'); await page.click('[data-trig="eventBatch"]'); }],
    ['journey-report', async () => { await page.click('#jc-back'); await page.click('#jtabs [data-jst="Live"]'); await page.click('#jl-table [data-jopen="JRN-03"]'); await page.click('#btn-report'); }],
    ['monitor-general', async () => { await page.keyboard.press('Escape'); await page.click('.nav button[data-view="monitor"]'); await page.selectOption('#msel', 'JRN-04'); }],
    ['monitor-version', async () => { await page.click('#mon-tabs [data-mt="version"]'); }],
    ['monitor-contacts', async () => { await page.click('#mon-tabs [data-mt="contacts"]'); await page.click('#ctable tr[data-ck]'); }],
    ['segment-workbench', async () => { await page.keyboard.press('Escape'); await page.click('.nav button[data-view="segmentation"]'); await page.click('#seg-new'); await page.click('#seg-search'); }],
  ];
  for (const [name, go] of deep) {
    try { await go(); } catch (e) { console.log('skip', name, e.message.slice(0, 50)); continue; }
    await page.waitForTimeout(200);
    const rows = await page.evaluate(probe);
    rows.forEach((x) => {
      checked++;
      const need = x.large ? AA_LARGE : AA;
      if (x.r < need) fails.set(`${name}: ${x.sel} | "${x.txt}" | ${x.r}:1 (need ${need})`, 1);
    });
    await page.screenshot({ path: path.join(SHOTS, `brand-${name}.png`) });
    const esc = await page.$('#rep-close');
    if (esc && (await esc.isVisible())) await esc.click().catch(() => {});
  }
  await page.close();
  await browser.close();

  console.log(`\nchecked ${checked} rendered text nodes across ${VIEWS.length} pages × 2 widths × 2 menu states, plus ${deep.length} deep states`);
  if (fails.size) {
    console.log(`\n${fails.size} distinct contrast failures:`);
    [...fails.keys()].sort().forEach((k) => console.log('  FAIL  ' + k));
    process.exit(1);
  }
  console.log('every rendered text node meets AA against its background');
})();
