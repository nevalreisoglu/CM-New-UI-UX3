# Journey Studio — product description

What the prototype is, who uses it, and why each screen is shaped the way it is.
The click-through walkthrough is in `user-manual.md`; the decisions and their reasons in
`decisions.md`.

## 1. What it is for

Fizz runs its lifecycle communication in Symplify today: journeys built on a canvas, started
by BSS events, sent mostly by email in French and English to about 1.96 million contacts.
The **Journey Studio** is Etiya's answer: the same journey capabilities, in the Etiya design
system, plus what Symplify lacks — communication and invitation **policies**, an approval
before a version goes live, and a per-contact log on the monitor.

**Phase 1** (this prototype) covers event-triggered journeys end to end: entry, deliveries,
splits, waits, control groups, versions with approval, a monitor with a Contacts tab.
Everything beyond that — segment and date entries, schedules, lifecycle phases, further
waits and actions, anomaly alerts, exports — is built and kept behind one `PHASE2` flag, off
by default, so it does not appear in the palette, the menus or the sample data.

The prototype exists to align the team and the customer on that scope before development
starts. It is one HTML file; nothing is sent, nothing is saved between reloads.

## 2. Who uses it

| Role | What they do here |
| --- | --- |
| Marketer | Builds journeys and segments, edits step content, tests, **submits a version for approval**. |
| Approver | Reviews, **activates** a submitted version and **stops** a live one. |
| Admin | Both, plus the projects and journey settings across projects. |

All three roles see the same four pages — Journeys · Journey Monitor · Segments · Policies.
The role changes what a page lets you do, not which pages exist.

## 3. The object model

- A **journey** is a container: name, description, **project** (`relance_abandon`,
  `prospect_comm`, `onboarding`, `billing`), **contact list** (Customers or Prospects), an
  **override unsubscribe** flag (confirmed, badged) and test users.
- The steps live in a **journey version**, each with a free-text **note**. A version is
  **Draft → Active → Closing → Closed**:
  - **Draft** — fully editable. A marketer **submits** it; it reads *Pending approval*
    until an approver activates it or an edit withdraws it.
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
- Every contact that enters keeps a **state per version**: the step it is in, waiting or
  exited or held out, and the result of each delivery — what the monitor's Contacts tab
  shows.
- A **segment** (kept from CM) is a saved audience on the datamart; journeys reference
  segments in Segment splits. A **policy** is a communication or invitation rule a Delivery
  step picks; consent and exclusion lists always apply underneath.

## 4. Journeys — the list

The list answers "what runs where" on three tabs — **Drafts · Live · Past**, Live first:
name, project, event, channels, the active version with its note (a Closing or Draft
sibling as a chip), contacts entered in the last 30 days, last modified and by whom.
Filters by project, event and channel; row actions open · duplicate · move to project.

**Create your journey** is one centred screen: name, description, project and the entry
type (single or multiple contacts). It creates a Draft v1 with the entry and an Exit in
place and opens the canvas. A copy of a recent journey is one click away.

## 5. The canvas

The **palette** is grouped Entry · Message · Wait · Split · Action. Exactly one Entry step
exists per version; the Entry group *swaps its type*:

| Entry | Config | Note |
| --- | --- | --- |
| Event – single contact | event, payload fields, create contact if missing, re-entry rule | one contact per request; **API code** shows a sample request |
| Event – multiple contacts | the same, for a batch of contacts in one request | **API code** shows a batch request |

Events: `order_abandoned`, `account_created`, `device_back_in_stock`, `plan_changed`,
`payment_failed`; processed within 60 seconds. The payload fields become `{{payload.…}}`
placeholders in every Delivery of the version.

**Message** — Delivery: channel Email · SMS · Push with the channel's fields (subject,
preheader, body; SMS text with a character and segment counter; push title, text, link),
**FR / EN variants** with a default language picked from the contact's language, an
optional **offer** (name and URL as placeholders), placeholders from contact attributes and
the entry payload, control-group share, **policies** applied at send time, test send per
language, and — only when the journey overrides unsubscribe — a per-step "send even if
unsubscribed" that asks for confirmation. A contact without an address, token or consent
**skips** the step, continues, and is counted as skipped. Its engagement feeds the
Engagement split.

**Wait** — a duration in hours or days, relative to the previous step.

**Split** — Engagement (bound to a previous Delivery; opened and clicked, plus
**Remaining**); Segment (ordered list, evaluated top-down, plus Remaining); Shuffle
(weights summing to 100, "Set equal").

**Action** — Control group (named hold-out; the contacts stay there and read *held out*);
Exit (optionally a goal that counts as a conversion).

Behaviours: drag from a port to connect — a multi-path step takes its next free path label;
paths may merge; a step can be disconnected and re-attached; a Delivery dropped after a
Delivery gets a one-day Wait slipped in between. Cards show the type, the name, a one-line
summary of the configuration and, on live versions, a **stats strip** (entered · waiting ·
exited; for Delivery sent · skipped · opened · clicked).

The **version bar** on top: version dropdown (number, note, status, activated by / when),
the inline note, Submit for approval / Withdraw (marketer) or Activate (approver, admin),
Stop ▾ (Closing or Closed), Copy to new version, Test ▾ (send a test event with an editable
payload, count matches, first 10 matching contacts, test send FR + EN), Execution report.
The **validation panel** lists every check — entry set up, every segment split names a
segment, every engagement split bound to a Delivery, every path ending in an Exit or a
Control group, every step reachable, every Delivery with content in its default language,
shuffle weights at 100 % — and blocks Submit and Activate until all are green; a failing
item selects the step.

The right panel holds the **journey settings** (collapsible) above the **step details**.

## 6. Journey Monitor

One journey at a time. **General**: entered / in journey / exited, channel totals (sent ·
skipped · opened · clicked), the versions table (number and note, status, activated by /
when, entry, counters, View version). **View version**: the read-only canvas with the stats
strip, a steps table, "Open in builder"; the **time range** (7 / 30 / 90 days / all) scales
the numbers.

**Contacts**: every contact that entered — contact, event, received at, version, current
step, status (waiting · in step · exited · held out), last delivery result including
*skipped · reason* — with a lookup box; a row opens the contact's **step history** and, for
a test event, its payload.

## 7. Segments and Policies

Both are kept from CM with their previous screens. Segments: a list and the workbench
(definition beside a live audience insight, query builder, natural-language assistant in a
dialog). Policies: a read-only list of communication and invitation policies, with the
journeys that pick each one.

## 8. What is prototype scaffolding, not product

- The **simulation strip** ("⚗ Simulation · demo only") — send an event, advance the
  clock, reset — and the day counter. Deliberately styled as not part of the product.
- The simulation runs on 30 synthetic contacts; every number shown is multiplied so that
  one simulated contact stands for about 6,500 real ones (1.96 M in total). The execution
  report and the Contacts tab stay per simulated contact.
- API code, test sends and test events are mocked and say so.

## 9. Non-goals

Campaign and offer management, the email content editor's internals, real integrations,
authentication, i18n of the UI (English UI, FR/EN sample content). Phase 2 items are listed
in `decisions.md` (P1-A).

## 10. Visual language

The Etiya brand kit: navy and lilac primary, orange as accent, turquoise as action, Roboto.
Palette, token map and contrast rules are in `brand.md`; `tests/brand-audit.js` checks every
rendered text node against AA.
