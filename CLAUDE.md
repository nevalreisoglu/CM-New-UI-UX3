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
"new UI/UX" prototype. **Phase 1** (the current brief, v3 of 8 Oct 2026) covers
**event-triggered journeys** end to end — event entries, Delivery at CM parity, splits,
waits, control groups, versions with an approval step, a monitor with a Contacts tab —
plus the CM capabilities Symplify lacks (policies). Everything from the earlier Journey
Studio round that is not in Phase 1 stays in the file behind **one `PHASE2` flag**
(default `false`) and must not appear in the palette, the menus or the sample data while
it is off. Audience: a product demo to **Fizz** (Canadian telco, French/English,
email-heavy, ~2 M contacts).

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
  pages, the role decides what a page lets you do (`jCanAct()` — activate / stop; a
  marketer submits). **`PHASE2`** (next to `PHASES`) gates every Phase 2 item;
  `p1(m)` filters `ENTRY_KINDS` / `NODE_META` entries marked `p2:true`.
- **Journey model** (`JOURNEYS`, `jBlank`): a journey is a container — name, description,
  `folder` (`FOLDERS`, shown as **Project**), `contactList` (Customers / Prospects),
  `overrideUnsub`, `testUsers`, `updated` / `updatedBy`; Phase 2 fields `phase`
  (`PHASES`), priority, end date + `expiryAction` stay in the data. Its steps live in
  **versions** (`j.versions[]`, each `{v, status, note, nodes, activatedAt, activatedBy,
  submittedBy, submittedAt, approval}`) with `Draft → Active → Closing → Closed`.
  **Approval**: `submitVersion` (marketer, validation green) marks the Draft pending
  (`vPending(V)`); `vTouch(j)` on any edit withdraws it (`withdrawVersion`);
  `activateVersion` (approver / admin) activates and demotes the current Active to
  Closing; `autoClose` closes a Closing version when nobody is left inside (skipped while
  `quietInit`); `stopVersion(mode)`; `copyVersion` makes a new Draft. Journey status is
  derived: `jStatus(j)` = Draft / Live / Past. `vLocked(V)` — Active/Closing lock the
  structure (no add / delete / relink), Closed is read-only.
- **Run context** (`ctxOf(j,V)`, `curCtx()`, `mainCtx(j)`, `allCtx()`): the engine, the
  canvas and the monitor work on one version through an object that looks like the old
  journey (`id` = `"JRN-04@4"`, `nodes`, `status`, `j`, `V`). The simulation is keyed by
  that id: `sim['JRN-04@4'] = {parts, history}`.
- **Steps** (`NODE_META`, grouped by `NODE_GROUPS`): exactly one `entry` step per version,
  whose `cfg.kind` is one of `ENTRY_KINDS` — Phase 1: `eventSingle`, `eventBatch`
  (`isEventKind`, `EVENT_NAMES`, `EVENT_PAYLOADS`, `payloadFields`, `placeholdersFor`);
  Phase 2 (`p2:true`): segment, dateAttr, joinsList, unengaged, twin, agent. Phase 1
  steps: `delivery`, `waitDur`, `splitEng`, `splitSeg`, `splitShuffle`, `ctrlGroup`
  (named; a legitimate end of a path), `exit`; Phase 2: `waitDate`, `waitEvent`,
  `waitSeg`, `waitPrio`, `setAttr`, `callExt`, `audSync`. `pathsOf(n)` gives a step's
  labelled paths; `connect()` takes the next free path; `prunePaths()` drops edges whose
  path disappeared. `nodeDefaults`, `nodeSummary`, `nodeStats` and `renderNodePanel` hold
  the per-type config; `entryDefaults`, `entryPool`, `entryText` the per-entry-type logic.
- **Delivery** (`CHANNELS` = email / sms / push, `CH_FIELDS`, `LANGS`): content lives in
  `cfg.lang = {default, fr:{…}, en:{…}}` (`jPlanDefaults`, `jPlanEnsure` migrates old
  `text`; `dText(n)` = default-language primary field); `OFFERS` / `offerOf` for the
  offer placeholders; `policies`, `controlGroup`, `sendUnsub`. The engine's **skip rule**
  writes `p.eng[nid] = {skipped, reason}` when a contact has no address / token / consent;
  `nodeStats` and `channelTotals` count `skipped`. `openTestEvent` (`#tev-modal`) sends a
  test event with an editable payload through the real entry (`lastPayload`).
- **Engine**: `initSim` preloads live versions from their entry pool; `tick` is one
  simulated day (scheduled entries admit new matches, `processCustomer` moves every
  contact one step, `autoClose` runs); `sendEvent` admits into event entries and resolves
  `waitEvent` steps; `runNow` chains immediate steps. Splits route deterministically
  (`hashOf`). Deliveries write `p.eng[nodeId]` (sent / opened / clicked / converted /
  bounced / skipped) that `splitEng` and the stats read. Boot: `quietInit = true`, three
  `tick`s, `seedClosing()` (contacts into Closing versions), eight `sendEvent`s, then
  `quietInit = false`; Reset repeats it.
- **Canvas**: `drawVersion(svg, C, view, opts)` draws a version (used by the builder with
  handles, by the monitor read-only); `renderCanvas` adds interaction; `renderVersionBar`
  (version dropdown with notes, inline note `#vb-note`, Submit for approval / Withdraw or
  Activate, Stop ▾, Copy to new version, Test ▾ incl. the test event, Execution report);
  `renderValidation` is the panel above the canvas fed by `jValidate` (blocking rules);
  `renderJSettings` is the journey-settings block on the right panel.
- **Scale**: the simulation runs on the 30-row demo datamart (`DATAMART_ROWS` →
  `CUSTOMERS`); every displayed number is multiplied by `DEMO_K` (one simulated contact ≈
  6,500 real ones; `CONTACTS_TOTAL` = 1.96 M). The monitor adds a time-range factor
  (`RANGE_K`). The execution report and the Contacts tab stay per simulated contact.
- **Journey list**: `renderJList` — tabs `J_TABS` (Drafts / Live / Past, `jStatusF`
  defaults to Live, `#jtabs [data-jst]`), filters `jFilter` (folder, event, channel;
  `jEvent`, `jChannels`), bulk duplicate / move to project; the **Lifecycle coverage**
  strip `coverageHtml` is Phase 2. `renderJCreate` (name, description, project, entry
  type). `jOpen(id, nodeId, v)` is the only way onto the canvas.
- **Monitor**: `renderMonitor` with `monTab` general / version / contacts →
  `renderMonGeneral` (totals, `channelTotals`, versions table), `renderMonVersion`
  (read-only canvas + steps table) and `renderMonContacts` (`#ctable`, `contactState`,
  `lastDelivery`, lookup `conQ`, step history `.chist` / `.clog`). `anomaliesFor` and
  `openExport` (`EXPORT_STRATEGIES`) are Phase 2.
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
- Do not surface a Phase 2 item (segment / date / list / unengaged / Twin / Agent entries,
  schedules, the extra waits and actions, lifecycle phase, priority, end date, anomaly
  alerts, step export) while `PHASE2` is off, and do not delete it either — gate it
  (decision P1-A). Sample data uses Phase 1 steps only.
- Do not restructure the flow or restyle while doing a copy or data task.
- Do not add dependencies, a router, or a component framework.
- Do not put real integration calls, authentication or i18n into the prototype
  (non-goals of the brief).
