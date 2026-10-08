# Journey Studio — user manual

How to drive the prototype, screen by screen. It is a click-through model of the
Etiya Journey Studio: **nothing is sent and nothing is saved between reloads.**

> Open `index.html` in a browser. No build, no server, no sign-in.

## The frame

| Part | What it does |
| --- | --- |
| Top bar | **User manual** opens this text. **Role view** switches between Marketer, Approver and Admin — the pages stay the same, what you may do on them changes. |
| Left menu | **Journeys · Journey Monitor · Segments · Policies.** The burger collapses it to an icon rail. |
| Breadcrumb | Journey Studio › page › what is open (a journey id, a segment name). |
| Toasts | Bottom right. Every action confirms itself, including the ones the prototype only pretends to do. |

## Roles

The role view in the top bar changes what you may do, not what you see:

1. **Marketer** builds journeys and segments, edits step content, tests and **submits a
   version for approval**.
2. **Approver** **activates** a submitted version and stops a live one (Closing or Closed).
3. **Admin** does both, and maintains the projects.

## Journeys

The page opens on the **journey list** with three tabs — **Drafts · Live · Past**; Live is
the default. Columns: journey (name and description), project, event, channels, active
version (its number and note; a Closing or Draft sibling as a chip), contacts entered in
the last 30 days, last modified and modified by. Search by name, description or id; filter
by project, event and channel. Tick rows for the bulk actions (duplicate, move to project).
**Open** puts a journey on the canvas; **More** offers Monitor, Execution report, Duplicate
and Move to project.

### Create your journey

- **+ New journey** asks for a name, a description, a project and what starts the
  journey — **Event – single contact** (one contact per request) or **Event – multiple
  contacts** (a batch).
- **Start building** creates a Draft v1 with the entry and an Exit in place and opens
  the canvas. *Start from a template* copies a recent journey instead.

### Versions

A journey is a container; its steps live in a **version**. The **version bar** on top of
the canvas shows the version dropdown (number, note, status, who activated it and when) and
the actions:

- **Version note** — a free text next to the dropdown (*V14 – new template*). Type it and
  press Enter; it shows in the dropdown, the list and the monitor.
- **Submit for approval** (marketer) — a Draft only; blocked until the validation is
  green. The version reads *Pending approval*; **Withdraw** takes it back, and so does any
  edit of the steps.
- **Activate** (approver or admin) — approves and activates the submitted version. The
  current Active version goes to **Closing**: no new entries, the contacts inside finish
  their steps, and it closes itself when empty.
- **Stop ▾** — *Closing* (gentle) or *Closed* (release everyone now). Closed is final.
- **Copy to new version** — a new Draft with the same steps.
- **Test ▾** — **Send a test event** with an editable JSON payload (it goes through the
  entry like a real BSS call; the contact then shows on the monitor's Contacts tab), count
  the entry's matches, show the first 10 matching contacts, test-send every Delivery to the
  test users in FR and EN (mock).
- **Execution report** — one row per step executed for a simulated contact.

An Active or Closing version has a **locked structure**: no adding, removing or
re-connecting steps, but every step's content can still be edited. A Closed version is
read-only. The pill on the right of the bar counts the contacts in the version.

### The canvas

- The **palette** is grouped **Entry · Message · Wait · Split · Action**. Drag a step
  onto the canvas, or click it to add it after the selected step. The Entry group does not
  add a step — it **swaps the type** of the one entry step (single or multiple contacts).
- Drag a step to move it; drag from the orange port to connect it — a step with several
  paths (a split) takes its next free path label; click a path label to disconnect; × on
  a step or the Delete key removes it. Paths may merge.
- Two Deliveries in a row get a one-day **Wait** slipped in between.
- Cards show the step type, its name, a one-line summary and — on live versions — a
  **stats strip**: entered · waiting · exited, or sent · skipped · opened · clicked for a
  Delivery.
- **Validate** opens the validation panel above the canvas: every check, the failing ones
  naming the step (click it to select the step). Submit and Activate open the same panel
  when a check fails.

### The right panel

- **Journey settings** (collapsible): name, description, **project**, **contact list**
  (Customers or Prospects), **override unsubscribe** (asks for a confirmation and shows a
  badge on the version bar and the list; every Delivery step then has to confirm "send even
  if unsubscribed" on its own), test users.
- **Step details** for the selected step. Highlights:
  - **Entry**: single or multiple contacts, the event (`order_abandoned`,
    `account_created`, `device_back_in_stock`, `plan_changed`, `payment_failed`), its
    payload fields (they become `{{payload.…}}` placeholders), *create the contact if
    missing*, **API code** with a sample request, the re-entry rule. Events are processed
    within 60 seconds.
  - **Delivery**: channel (Email, SMS, Push) with its fields — subject, preheader and body;
    SMS text with a character and segment counter; push title, text and link — in **FR and
    EN** with a default language; an optional **offer** whose name and URL become
    placeholders; control-group share; the **policies** applied at send time; test send per
    language. A contact without an address, token or consent **skips** the step and
    continues.
  - **Segment split**: an ordered segment list, evaluated top-down, plus Remaining.
    **Shuffle**: weights that add up to 100 and *Set equal*. **Engagement split**: the
    Delivery it evaluates and the interactions (opened, clicked), one path each plus
    Remaining.
  - **Wait**: a duration in hours or days. **Control group**: a name and the hold-out
    share — the contacts stay there and are reported as *held out*. **Exit**: optionally a
    goal that counts as a conversion.

### The simulation strip — demo only

Both Journeys and Journey Monitor carry a dashed strip badged **⚗ Simulation · demo only**.
It is not part of the product. The prototype has no clock and sends nothing; the strip
moves a simulated clock so you can watch contacts move:

- **Send event** admits a contact through the entry of every live journey listening to it.
- **Advance 1 day / 5 days** lets waits expire and delivery outcomes come in.
- **Reset** returns to day 0 with the sample contacts reloaded.
- One simulated contact stands for about 6,500 real ones in every number shown.

## Journey Monitor

Pick a journey. **General** shows:

- **Entered · In journey · Exited** as three tiles, and the channel totals (sent ·
  skipped · opened · clicked).
- The **versions** table — number and note, status, activated by / when, entry, counters —
  with *View version*.

**View version** draws the version read-only with the stats strip, lists the steps with
their counters, and offers *Open in builder*. The **time range** (7 / 30 / 90 days / all)
scales the numbers.

**Contacts** lists every contact that entered the journey: contact, event, received at,
version, current step, status (waiting · in step · exited · held out) and the last delivery
result (the channel and outcome, or *skipped* with the reason). The lookup box narrows the
list; a row opens the contact's **step history** and, for a test event, the payload it came
in with.

## Segments

Segments are built on a datamart and belong to a segment group. **+ New segment**
opens the workbench: the definition on the left, the query builder and a live
audience insight on the right. **Search** counts the audience. A segment can be
an exclusion list for chosen channels. Journeys reference segments in Segment splits.

## Policies

Communication policies (caps, quiet hours) and invitation policies (quiet periods after a
journey) that a Delivery step picks. The page is read-only and shows which journeys pick
each policy; consent and exclusion lists always apply underneath.

## Tips for a demo

- Append `?notour` to the URL for a clean start.
- Open **Device order flow abandonment**: v14 Active with its stats strip, v13 Closing
  with contacts still finishing. **Copy to new version**, give it a note, change a step,
  **Submit for approval**; switch to Approver and **Activate** — v14 goes to Closing.
- Open **Welcome – account created** for the Shuffle → control group and the Engagement
  split to Push or SMS; **Test ▾ › Send a test event** and find the contact on the
  monitor's Contacts tab.
- Open **Plan change – confirmation** on the Drafts tab: a Draft whose validation fails on
  an unconnected Delivery; connect it and Submit.
- In the Monitor, pick a journey, read the channel totals (note the skipped column), switch
  to **View version**, then **Advance 5 days** and watch the strip change.
- Toasts tell you when an action is only pretended (test send, export).
