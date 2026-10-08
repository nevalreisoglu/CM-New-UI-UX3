# Etiya Journey Studio — prototype

Single-file, click-through prototype of the **Journey Studio**: the journey-only descendant of the Etiya Campaign
Management redesign prototype, scoped for a product demo to **Fizz** (Canadian telco, FR/EN, email-heavy, ~2 M contacts).
It covers every journey capability of Symplify and keeps the CM capabilities Symplify lacks.

**Open it:** download `index.html` and open it in a browser — no build, no server, no external calls (fonts are optional).
Append **`?notour`** to the URL for a clean start in demos and automated runs.

**Deploy:** it is a static file. On Vercel, import the repository with no framework preset and no build command; the
root `index.html` is served as is. GitHub Pages works the same way.

## What is in the prototype (v67 — Phase 1)

Phase 1 covers **event-triggered journeys** end to end. Everything from the earlier Journey Studio round that is
not in Phase 1 stays in the file behind one `PHASE2` flag (off by default) and does not show in the palette, the
menus or the sample data.

- **Journeys** — the list on three tabs **Drafts · Live · Past** (name · project · event · channels · active version
  with its note · entered 30d · last modified · modified by; filters by project / event / channel; duplicate and move
  to project). *Create your journey*: name, description, project, entry type.
- **Journey model** — a journey is a container (project, contact list Customers / Prospects, override unsubscribe
  with confirmation and badge, test users); its steps live in a **version** with a free-text note: Draft → Active →
  Closing → Closed. **Activation is the approval**: a marketer submits (validation must be green), an approver or
  admin activates; an edit withdraws the submission. One Active version per journey; activating puts the current
  Active into Closing (no new entries, contacts inside finish, auto-Closed when empty). Status Draft / Live / Past is
  derived.
- **Canvas** — grouped palette **Entry · Message · Wait · Split · Action**; one Entry per version: **Event – single
  contact** or **Event – multiple contacts** on five named events, with payload placeholders, create-if-missing and
  an API code sample; **Delivery** with Email · SMS · Push, FR / EN variants and a default language, offer and payload
  placeholders, control-group share, policy picker, per-step send-even-if-unsubscribed, and a **skip rule** (no
  address / token / consent → skipped, counted); Wait duration; Segment split, Shuffle, Engagement split (opened /
  clicked + Remaining); named Control group; Exit. Cards show type, name, summary and — on live versions — a
  **stats strip** (Delivery: sent · skipped · opened · clicked). A **version bar** (dropdown with notes, Submit /
  Activate, Stop ▾, Copy to new version, Test ▾ incl. *Send a test event* with an editable payload, Execution report)
  and a **validation panel** that blocks Submit and Activate.
- **Journey Monitor** — per journey: *General* (entered / in journey / exited, channel totals with skipped, versions
  table), *View version* (read-only canvas with the stats strip, time range) and **Contacts** (contact, event,
  received at, version, current step, status, last delivery result → step history and test payload).
- **Segments** (workbench, read-mostly) and **Policies** (read-only list picked by Delivery steps) — kept from CM.
- **Roles**: Marketer · Approver · Admin — the same pages; the marketer submits, the approver/admin activates and stops.
- **Simulation strip** (demo only): send an event, advance the clock, reset; it drives every counter. One simulated
  contact stands for ≈6,500 real ones.
- **User manual** behind a button in the top bar — embedded in the file, so it works offline.

Demo data only (Fizz-flavoured, fictional names, 6 journeys in 4 projects, 30 simulated contacts). Nothing is sent.

## Repository layout

```
index.html                        the prototype (single file)
docs/product-description.md       what it is, who uses it, why each screen is shaped that way
docs/user-manual.md               how to drive it, screen by screen (also embedded in the prototype)
docs/decisions.md                 every product decision with its reason
docs/brand.md                     palette, token map, type scale, contrast rules
docs/meetings/                    meeting notes (Turkish) of the earlier CM redesign
tests/specs/                      Playwright regression specs
tests/screenshots/                reference screenshots of the main screens
tests/brand-audit.js              AA contrast of every rendered text node
tests/README.md                   how to run them and what they cover
tools/embed-manual.js             copies the user manual into index.html
CHANGELOG.md
```

## Working on it

The prototype is one HTML file with inline CSS and vanilla JS. Data lives in constants near the top of the script
(`JOURNEYS`, `POLICIES`, `MLS` segments, `TEMPLATES`, `CONTENT_ITEMS`, `DATAMART_ROWS`); the Phase 2 switch is
`PHASE2`. `CLAUDE.md` is the architecture page.

After a change, run the regression suite (see `tests/README.md` for what it covers):

```bash
cd tests && npm install && npm test
```

It opens `index.html` over `file://`, so there is nothing to build or serve. `npm run shots` refreshes
`tests/screenshots/`; `node brand-audit.js` measures the rendered contrast of every text node on every page.
