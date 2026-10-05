# Etiya Journey Studio — prototype

Single-file, click-through prototype of the **Journey Studio**: the journey-only descendant of the Etiya Campaign
Management redesign prototype, scoped for a product demo to **Fizz** (Canadian telco, FR/EN, email-heavy, ~2 M contacts).
It covers every journey capability of Symplify and keeps the CM capabilities Symplify lacks.

**Open it:** download `index.html` and open it in a browser — no build, no server, no external calls (fonts are optional).
Append **`?notour`** to the URL for a clean start in demos and automated runs.

**Deploy:** it is a static file. On Vercel, import the repository with no framework preset and no build command; the
root `index.html` is served as is. GitHub Pages works the same way.

## What is in the prototype (v62)

- **Journeys** — the list (name · folder · lifecycle phase · status · active version · entered 30d · last activated;
  filters by status / folder / phase / entry type; bulk duplicate and move to folder) under a **Lifecycle coverage**
  strip (live journeys per phase, gaps highlighted). *Create your journey*: name, folder, phase, entry type.
- **Journey model** — a journey is a container; its steps live in a **version**: Draft → Active → Closing → Closed.
  One Active version per journey; activating a Draft puts the current Active into Closing (no new entries, contacts
  inside finish, auto-Closed when empty). Journey status Draft / Live / Past is derived. Settings: folder, phase,
  priority 1–100, end date + expiry action, ignore unsubscribe (per-step confirmation), test users.
- **Canvas** — grouped palette **Entry · Message · Wait · Split · Action**; one Entry step per version with seven entry
  types (Segment, Date attribute, Event with an API code sample, Joins list, Unengaged, Digital Twin signal, Agent
  suggestion); Delivery with template, FR/EN text, A/B and dynamic variants, control group, policy picker; waits
  (duration, until date, for event with accepted · rejected · timeout, for segment match, Priority); splits
  (Engagement bound to a Delivery, Segment top-down, Shuffle with weights); actions (Set attribute, Call external as
  webhook / MCP tool, Control group, Audience sync, Exit). Cards show type, name, a one-line summary and — on live
  versions — a **stats strip**. Paths are type-driven and may merge. A **version bar** (version dropdown, Activate,
  Stop ▾ Closing / Closed, Copy to new version, Test ▾, Execution report) and a **validation panel** that blocks
  Activate.
- **Journey Monitor** — per journey: *General* (entered / active / exited / conversions, channel totals, **Marketing
  Agent anomaly alerts** with confidence, versions table, participants at a point in time) and *View version* (read-only
  canvas with the stats strip); **step export** with four strategies (mock download); a time range filter.
- **Segments** (workbench, read-mostly) and **Policies** (read-only list picked by Delivery steps) — kept from CM.
- **Roles**: Marketer · Approver · Admin — the same pages; the approver/admin activates and stops versions.
- **Simulation strip** (demo only): send an event, advance the clock; it drives every counter. One simulated contact
  stands for ≈6,500 real ones.
- **User manual** behind a button in the top bar — embedded in the file, so it works offline.

Demo data only (Fizz-flavoured, fictional names, 7 journeys, 30 simulated contacts). Nothing is sent.

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
(`JOURNEYS`, `POLICIES`, `MLS` segments, `TEMPLATES`, `CONTENT_ITEMS`, `DATAMART_ROWS`). `CLAUDE.md` is the
architecture page.

After a change, run the regression suite (see `tests/README.md` for what it covers):

```bash
cd tests && npm install && npm test
```

It opens `index.html` over `file://`, so there is nothing to build or serve. `npm run shots` refreshes
`tests/screenshots/`; `node brand-audit.js` measures the rendered contrast of every text node on every page.
