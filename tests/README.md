# Regression tests

Playwright scripts that open `../index.html` over `file://` and check that the
decisions taken in the UX/UI meetings still hold. There is no build and no
server: the prototype is one HTML file, and the specs drive it directly.

## Running them

```bash
cd tests
npm install        # once — installs @playwright/test only
npm test           # the whole suite
npm run test:headed  # watch it happen in a real window
npm test -- specs/roles.spec.js      # one file
npm test -- -g "simulation strip"    # one group
```

`@playwright/test` is pinned to **1.56.1**. Playwright refuses to run against a
browser build it does not know, so if `npm test` reports a missing executable,
the pin and the installed Chromium have drifted apart — either install the
matching browser (`npx playwright install chromium`) or move the pin to the
version that matches.

## What is covered

| Spec | What it protects |
| --- | --- |
| `branding.spec.js` | The brand reads ETIYA everywhere; the old "ETYA" spelling cannot come back. |
| `navigation.spec.js` | The four Journey Studio pages open from the menu, the stripped modules are gone from the page, the breadcrumb follows, the menu collapses to an icon rail. |
| `roles.spec.js` | Role views: Marketer, Approver and Admin all see the same four pages; the footer note and the actions follow the role. |
| `segments.spec.js` | The segment workbench: definition beside live audience insight, Search counting the audience, and the assistant living in a dialog rather than the form. |
| `journey.spec.js` | The list opens first, a journey opens on the canvas and returns, Create your journey, the canvas is fitted on first open, the palette collapses, and the simulation strips are demo-only and share one clock. |
| `versions.spec.js` | The journey model: the Drafts / Live / Past tabs derived from versions, the version bar (note, who activated, when) and locked structure, Submit for approval → Activate → Closing, Stop (Closing / Closed), journey settings (project, override unsubscribe, test users; phase / priority / end date are Phase 2), Create. |
| `nodes.spec.js` | The step inventory in Phase 1: palette groups and order (no Phase 2 step), the Entry group swapping single / multiple contacts (and the API code sample), Segment split paths ending in Remaining and the next-free-path connect, the Wait slipped between two deliveries, the engagement split binding, validation blocking Submit, shuffle weights, Delivery parity (Email · SMS · Push, FR / EN, offer placeholders, SMS counter, the skip rule). |
| `monitor.spec.js` | Journey Monitor: General (totals, channel totals with skipped, versions; no anomaly alerts or step export while `PHASE2` is off), View version (read-only canvas with the stats strip), the Contacts tab and the step history, time range and the simulation driving the numbers, the validation panel. |
| `manual.spec.js` | The **User manual** button in the top bar: the dialog opens, closes three ways, renders the markdown as headings/lists/tables, the contents list jumps, and the embedded copy still matches `docs/user-manual.md`. |
| `demo-data.spec.js` | No real person is named in the file; every e-mail address is on example.com; sample customers have masked ids and +90 5XX numbers; the top-bar user comes from `DEMO_USERS`. |
| `screenshots.spec.js` | Writes reference screenshots of the main screens to `screenshots/`. |

Node scripts (run with `node <name>.js`; an empty error list is the pass condition, screenshots go to `shots/`):

| Script | What it walks |
| --- | --- |
| `brand-audit.js` | AA contrast of every rendered text node on the four pages (two widths, menu open and collapsed) and a set of deep states: live and draft canvases, the step panels, a closed version, the three list tabs, create, the execution report, the monitor's three tabs, the segment workbench. |

## Screenshots

`screenshots/*.png` are review material for the UX meetings, refreshed with:

```bash
npm run shots
```

They are committed so a change to a screen shows up as a visible diff in review.
Nothing compares them pixel by pixel — the run only fails if a screen cannot be
reached or renders empty.

## Writing a new spec

Import the fixture rather than `@playwright/test` directly:

```js
const { test, expect, setRole, openPage } = require('./fixtures');

test('...', async ({ app }) => { /* `app` is the loaded prototype */ });
```

The `app` fixture blocks the Google Fonts request so a run works offline and
takes the same time every time, and it fails the test if the prototype threw an
uncaught error — so every spec doubles as a smoke test for JavaScript errors on
the screens it touches.

## Things the specs deliberately pin down

These surprised us once, so they are asserted rather than assumed:

- The prototype **boots on the journey list**, and the journey canvas is therefore
  fitted the first time the builder is opened rather than at boot — `fitView`
  measures the SVG, which is 0x0 while the view is hidden. `fitView` also has a
  zoom floor of 0.45, so a wide journey can still run off the right edge.
- The Journey Monitor opens on **day 3**: the prototype runs three simulated days
  at load, seeds the Closing version and sends eight events so the monitor and the
  Contacts tab have something to show.
- The journey list opens on the **Live** tab, so a spec that needs the Draft
  journey clicks the Drafts tab first.
- `prompt()` and `confirm()` are auto-dismissed in headless runs, so the version
  note is an inline input and the approver's Activate asks for no confirmation.
- Every dialog closes on **Escape**, including the segment assistant and the
  manual.

## The embedded user manual

`docs/user-manual.md` is embedded in `index.html` so a downloaded single file
carries its own manual with no server and no network. After editing the
markdown, re-embed it:

```bash
node ../tools/embed-manual.js          # update index.html
node ../tools/embed-manual.js --check  # exit 1 if out of date
```

`manual.spec.js` fails the suite if the two drift apart, so a forgotten re-embed
shows up as a test failure rather than a stale manual in someone's browser.
