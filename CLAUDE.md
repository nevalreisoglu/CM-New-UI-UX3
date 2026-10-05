# Journey Studio prototype — project memory

Read this before touching anything. It carries the decisions and constraints from the
redesign sessions and from the Journey Studio brief, so you do not have to rediscover
(or accidentally undo) them.

Related reading, load when relevant:
- @docs/decisions.md — every product decision, with the reason behind it
- @docs/product-description.md — what the prototype is, screen by screen
- @docs/user-manual.md — the click-through walkthrough (also embedded in the file)
- @docs/meetings/ — the source meeting notes of the earlier CM redesign (Turkish)
- @CHANGELOG.md — version history

## What this is

A **click-through prototype** of Etiya's **Journey Studio** — a single self-contained
`index.html` (HTML + CSS + vanilla JS). It is the journey-only descendant of the CM
"new UI/UX" prototype: it covers every journey capability of Symplify (the tool Fizz
uses today) and keeps the few CM capabilities Symplify lacks (policies, Digital Twin and
Agent entries, Marketing Agent alerts). Audience: a product demo to **Fizz** (Canadian
telco, French/English, email-heavy, ~2 M contacts).

Owner: Neval Reisoğlu (Senior PM). The code is a reference for the development team,
not the product itself.

## Hard constraints

- **One file.** Everything lives in `index.html`. No build step, no bundler, no framework,
  no new UI library. It deploys to Vercel (or GitHub Pages) as a static file.
- **No external requests** except the Google Fonts stylesheet. It must render correctly
  from a `file://` URL, offline, weeks from now.
- **No browser storage** (`localStorage` and friends). State lives in JS variables.
- **Do not rename ids, classes or `data-*` hooks.** The Playwright specs in `tests/`
  select on them. If a rename is genuinely necessary, update the specs in the same commit.
- **The brand is "Etiya"** (the old "Etya" spelling must not come back). The product
  name in the chrome is "Journey Studio".
- **Demo data carries no real person, customer or employee names.** Fictional names,
  masked ids (`CUS-****4821`), `@example.com`, `+1 5XX …`. Sample content is FR/EN;
  the UI is English.
- **Keep the design system.** Tokens are CSS custom properties in `:root`; some names
  are historical (`--green` is the primary, not a green) — change values, keep names.
  Do not restyle while doing a feature task.

## Architecture in one page

- **Views**: `journeys`, `monitor`, `segmentation`, `policies` — switched by `data-view`
  on the left nav; each has a `render<View>()` called from `render()`. **Roles**
  (`marketer`, `approver`, `admin`) are applied by `applyRole()`; all roles see all four
  pages, the role decides what a page lets you do (`jCanAct()` — activate / stop).
- **Journey model** (`JOURNEYS`, `jBlank`): a journey is a container — name, description,
  `folder` (`FOLDERS`), lifecycle `phase` (`PHASES`), priority, end date + `expiryAction`,
  `ignoreUnsub`, `testUsers`. Its steps live in **versions** (`j.versions[]`, each
  `{v, status, nodes, activatedAt, activatedBy}`) with `Draft → Active → Closing → Closed`.
  One Active version per journey: `activateVersion` demotes the current Active to Closing;
  `autoClose` closes a Closing version when nobody is left inside; `stopVersion(mode)`;
  `copyVersion` makes a new Draft. Journey status is derived: `jStatus(j)` = Draft / Live /
  Past. `vLocked(V)` — Active/Closing lock the structure (no add / delete / relink), Closed
  is read-only.
- **Run context** (`ctxOf(j,V)`, `curCtx()`, `mainCtx(j)`, `allCtx()`): the engine, the
  canvas and the monitor work on one version through an object that looks like the old
  journey (`id` = `"JRN-04@4"`, `nodes`, `status`, `j`, `V`). The simulation is keyed by
  that id: `sim['JRN-04@4'] = {parts, history}`.
- **Steps** (`NODE_META`, grouped by `NODE_GROUPS`): exactly one `entry` step per version,
  whose `cfg.kind` is one of `ENTRY_KINDS` (segment, dateAttr, event, joinsList, unengaged,
  twin, agent); `delivery`; waits `waitDur`, `waitDate`, `waitEvent`, `waitSeg`,
  `waitPrio`; splits `splitEng`, `splitSeg`, `splitShuffle`; actions `setAttr`, `callExt`,
  `ctrlGroup`, `audSync`, `exit`. `pathsOf(n)` gives a step's labelled paths; `connect()`
  takes the next free path; `prunePaths()` drops edges whose path disappeared.
  `nodeDefaults`, `nodeSummary`, `nodeStats` and `renderNodePanel` hold the per-type
  config; `entryDefaults`, `entryPool`, `entryText` the per-entry-type logic.
- **Engine**: `initSim` preloads live versions from their entry pool; `tick` is one
  simulated day (scheduled entries admit new matches, `processCustomer` moves every
  contact one step, `autoClose` runs); `sendEvent` admits into event entries and resolves
  `waitEvent` steps; `runNow` chains immediate steps. Splits route deterministically
  (`hashOf`). Deliveries write `p.eng[nodeId]` (sent / opened / clicked / converted /
  bounced) that `splitEng` and the stats read.
- **Canvas**: `drawVersion(svg, C, view, opts)` draws a version (used by the builder with
  handles, by the monitor read-only); `renderCanvas` adds interaction; `renderVersionBar`
  (version dropdown, Activate, Stop ▾, Copy to new version, Test ▾, Execution report);
  `renderValidation` is the panel above the canvas fed by `jValidate` (blocking rules);
  `renderJSettings` is the journey-settings block on the right panel.
- **Scale**: the simulation runs on the 30-row demo datamart (`DATAMART_ROWS` →
  `CUSTOMERS`); every displayed number is multiplied by `DEMO_K` (one simulated contact ≈
  6,500 real ones; `CONTACTS_TOTAL` = 1.96 M). The monitor adds a time-range factor
  (`RANGE_K`). The execution report and the participant list stay per simulated contact.
- **Journey list**: `renderJList` (filters, bulk duplicate / move to folder, the
  **Lifecycle coverage** strip `coverageHtml`), `renderJCreate` (name, folder, phase, entry
  type). `jOpen(id, nodeId, v)` is the only way onto the canvas.
- **Monitor**: `renderMonitor` → `renderMonGeneral` (totals, `channelTotals`,
  `anomaliesFor` = Marketing Agent alerts, versions table, participants) and
  `renderMonVersion` (read-only canvas + steps table); `openExport` is the step export
  modal (`EXPORT_STRATEGIES`).
- **Segments** (`MLS`) and the datamart catalogue are kept from CM as a read-only-ish
  list + workbench; `POLICIES` feed the Policies page and the Delivery policy picker.
  `TEMPLATES` / `CONTENT_ITEMS` are only reachable from the Delivery step.
- The **simulation strip** ("⚗ Simulation · demo only") is deliberately styled as not
  part of the product. Keep it that way.

## Working method

1. Make the change in `index.html`.
2. Run the regression suite and **look at the screenshots** — they catch what the
   console does not (invisible text, collapsed columns, overflowing tiles):
   ```
   cd tests && npm install && npm test
   ```
   `npm run shots` refreshes `tests/screenshots/`; `node brand-audit.js` checks AA
   contrast on every page and deep state. An empty error list is the pass condition.
3. Commit in logical steps with a clear message; add a `CHANGELOG.md` entry per version.
4. If a decision was made along the way, append it to `docs/decisions.md`.
5. If the user manual changes, edit `docs/user-manual.md` and run
   `node tools/embed-manual.js` (a spec fails if the two drift apart).

## Do not

- Do not bring back Campaign, Program, Dashboard, Offers, Surveys, Reports, Operation
  analysis, Decision API, Datamart admin, Templates admin, Parameters or Release pages —
  they were removed on purpose (decision J-A).
- Do not add a second entry step, message-level versioning or a separate Delivery
  module — see the assumptions in `docs/decisions.md`.
- Do not restructure the flow or restyle while doing a copy or data task.
- Do not add dependencies, a router, or a component framework.
- Do not put real integration calls, authentication or i18n into the prototype
  (non-goals of the brief).
