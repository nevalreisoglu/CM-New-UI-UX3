# Journey Studio — product description

What the prototype is, who uses it, and why each screen is shaped the way it is.
The click-through walkthrough is in `user-manual.md`; the decisions and their reasons in
`decisions.md`.

## 1. What it is for

Fizz runs its lifecycle communication in Symplify today: journeys built on a canvas, driven
by events, dates, segments and engagement, sent mostly by email in French and English to
about 1.96 million contacts. The **Journey Studio** is Etiya's answer: the same journey
capabilities, in the Etiya design system, plus the few things Symplify cannot do —
communication and invitation **policies**, entries from **Digital Twin** signals and the
**Marketing Agent**, and the Agent's **anomaly alerts** on the monitor.

The prototype exists to align the team and the customer on that scope before development
starts. It is one HTML file; nothing is sent, nothing is saved between reloads.

## 2. Who uses it

| Role | What they do here |
| --- | --- |
| Marketer | Builds journeys and segments, edits step content, tests, submits. |
| Approver | Reviews, **activates** a Draft version and **stops** a live one. |
| Admin | Both, plus the lifecycle phase list and journey settings across folders. |

All three roles see the same four pages — Journeys · Journey Monitor · Segments · Policies.
The role changes what a page lets you do, not which pages exist.

## 3. The object model

- A **journey** is a container: name, description, **folder** (project), **lifecycle
  phase** (Acquire · Onboard · Grow · Retain · Winback — an editable list), priority
  (1–100), end date with its expiry action, an "ignore unsubscribe" flag and test users.
- The steps live in a **journey version**. A version is **Draft → Active → Closing →
  Closed**:
  - **Draft** — fully editable.
  - **Active** — one per journey. Admits contacts. Structure locked (no adding, removing
    or re-connecting steps); step content stays editable so copy can be fixed live.
  - **Closing** — set when a newer version is activated or when an approver stops it
    gently. No new entries; the contacts inside finish their steps; it closes itself when
    empty.
  - **Closed** — final. Nothing moves, nothing can be reactivated; copy it to a new
    version instead.
- A journey's status is derived from its versions: **Live** while any version is Active or
  Closing, **Draft** while it only has drafts (and closed history), **Past** when
  everything is closed.
- A **segment** (kept from CM) is a saved audience on the datamart; journeys reference
  segments in entries, waits and splits. A **policy** is a communication or invitation rule
  a Delivery step picks; consent and exclusion lists always apply underneath.

## 4. Journeys — the list

The list answers "what runs where": name, folder, phase, status, the active version (with
a Closing or Draft sibling as a chip), contacts entered in the last 30 days and the last
activation. Filters by status, folder, phase and entry type; bulk duplicate and move to
folder.

Above it, the **Lifecycle coverage** strip counts live journeys per phase and highlights
empty phases — the demo's "where are the gaps" view. Clicking a phase filters the list.

**Create your journey** is one centred screen: name, description, folder, phase and the
entry type (seven cards). It creates a Draft v1 with the entry and an Exit in place and
opens the canvas. A copy of a recent journey is one click away.

## 5. The canvas

The **palette** is grouped Entry · Message · Wait · Split · Action. Exactly one Entry step
exists per version; the Entry group *swaps its type*:

| Entry | Config | Note |
| --- | --- | --- |
| Segment | segment, evaluation frequency, time slot | Symplify "Custom" |
| Date attribute | attribute, N days before / after / on, yearly | covers Birthday |
| Event (API / BSS) | event, payload fields, create contact if missing | immediate; **API code** shows a sample payload |
| Joins list | list, source (API / import / opt-in / any) | immediate |
| Unengaged | channel, inactivity days | |
| Digital Twin signal | signal, threshold | CM-only |
| Agent suggestion | read-only card with the rationale | CM-only |

Common to all: include the project (folder) segment, re-entry rule (never / after N days /
always).

**Message** — Delivery: channel, template (design), the journey's own FR/EN text, A/B or
dynamic variant, control group, **policies** applied at send time, and — only when the
journey's ignore-unsubscribe flag is on — a per-step "send even if unsubscribed" that asks
for confirmation. Its engagement feeds the Engagement split.

**Wait** — duration (minutes / hours / days); until date (weekdays, day of month, date);
for event (**accepted · rejected · timeout**, with an explainer of the webhook and the
one-time release URL); for segment match (**matched · timeout**); Priority (**allowed ·
denied**, against a priority rollup).

**Split** — Engagement (bound to a previous Delivery; one path per chosen interaction plus
**Remaining**); Segment (ordered list, evaluated top-down, plus Remaining); Shuffle
(weights with "Set equal").

**Action** — Set attribute (static value or the timestamp when reached); Call external
(labelled webhook or MCP tool); Control group (hold-out, exportable, a segment can be
built from it); Audience sync (Meta / Google); Exit (optionally a goal that counts as a
conversion).

Behaviours: drag from a port to connect — a multi-path step takes its next free path label;
paths may merge; a step can be disconnected and re-attached; a Delivery dropped after a
Delivery gets a one-day Wait slipped in between. Cards show the type, the name, a one-line
summary of the configuration and, on live versions, a **stats strip** (entered · waiting ·
exited; for Delivery sent / opened / clicked / conv).

The **version bar** on top: version dropdown (status, activated by / when), Activate,
Stop ▾ (Closing or Closed), Copy to new version, Test ▾ (count matches, first 10 matching
contacts, test send), Execution report. The **validation panel** lists every check — entry
set up, waits with a duration or date, splits with a segment, engagement splits bound to a
Delivery, every path ending in an Exit, every step reachable, every Delivery with content,
shuffle weights at 100 % — and blocks Activate until all are green; a failing item selects
the step.

The right panel holds the **journey settings** (collapsible) above the **step details**.

## 6. Journey Monitor

One journey at a time. **General**: entered / active / exited / conversions, channel
totals (sent · opened · clicked · converted), the **Marketing Agent's anomaly alerts** —
two or three steps whose daily volume deviates from the 30-day baseline, with a confidence
level, "Open step" and "Dismiss" — the versions table (status, activated by / when, entry,
counters, View version, Step export) and the participant list at a point in time.
**View version**: the read-only canvas with the stats strip and alert markers, a steps
table, "Open in builder".

**Step export** opens from any step: strategy entered / exited / was in / entered and
exited, the time range, a count and the columns; the download is a mock.

The **time range** (7 / 30 / 90 days / all) scales what the monitor shows.

## 7. Segments and Policies

Both are kept from CM with their previous screens. Segments: a list and the workbench
(definition beside a live audience insight, query builder, natural-language assistant in a
dialog). Policies: a read-only list of communication and invitation policies, with the
journeys that pick each one.

## 8. What is prototype scaffolding, not product

- The **simulation strip** ("⚗ Simulation · demo only") — send an event, advance the
  clock — and the day counter. Deliberately styled as not part of the product.
- The simulation runs on 30 synthetic contacts; every number shown is multiplied so that
  one simulated contact stands for about 6,500 real ones (1.96 M in total). The execution
  report and the participant list stay per simulated contact.
- Anomaly alerts, API code, test sends, exports and audience syncs are mocked and say so.

## 9. Non-goals

Campaign and offer management, the email content editor's internals, real integrations,
authentication, i18n of the UI (English UI, FR/EN sample content).

## 10. Visual language

The Etiya brand kit: navy and lilac primary, orange as accent, turquoise as action, Roboto.
Palette, token map and contrast rules are in `brand.md`; `tests/brand-audit.js` checks every
rendered text node against AA.
