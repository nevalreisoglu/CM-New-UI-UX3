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

1. **Marketer** builds journeys and segments, edits step content and tests.
2. **Approver** activates a Draft version and stops a live one (Closing or Closed).
3. **Admin** does both, and maintains the lifecycle phase list and folders.

## Journeys

The page opens on the **journey list**: name, folder, lifecycle phase, status
(Draft / Live / Past), active version, contacts entered in the last 30 days and the last
activation. Search by name, description or id; filter by status, folder, phase and entry
type. Tick rows for the bulk actions (duplicate, move to folder). **Open** puts a journey
on the canvas; **More** offers Monitor, Execution report, Duplicate and Move to folder.

Above the list, the **Lifecycle coverage** strip counts live journeys per phase and
highlights the phases without one. Click a phase to filter the list by it.

### Create your journey

- **+ New journey** asks for a name, a description, a folder, a lifecycle phase and
  what starts the journey — one of the seven entry types.
- **Start building** creates a Draft v1 with the entry and an Exit in place and opens
  the canvas. *Start from a template* copies a recent journey instead.

### Versions

A journey is a container; its steps live in a **version**. The **version bar** on top of
the canvas shows the version dropdown (status, who activated it and when) and the actions:

- **Activate** — approver or admin; a Draft only; blocked until the validation is green.
  The current Active version goes to **Closing**: no new entries, the contacts inside
  finish their steps, and it closes itself when empty.
- **Stop ▾** — *Closing* (gentle) or *Closed* (release everyone now). Closed is final.
- **Copy to new version** — a new Draft with the same steps.
- **Test ▾** — count the entry's matches, show the first 10 matching contacts, test-send
  every Delivery to the journey's test users (mock).
- **Execution report** — one row per step executed for a simulated contact.

An Active or Closing version has a **locked structure**: no adding, removing or
re-connecting steps, but every step's content can still be edited. A Closed version is
read-only.

### The canvas

- The **palette** is grouped **Entry · Message · Wait · Split · Action**. Drag a step
  onto the canvas, or click it to add it after the selected step. The Entry group does not
  add a step — it **swaps the type** of the one entry step.
- Drag a step to move it; drag from the orange port to connect it — a step with several
  paths (a wait for event, a split) takes its next free path label; click a path label to
  disconnect; × on a step or the Delete key removes it. Paths may merge.
- Two Deliveries in a row get a one-day **Wait** slipped in between.
- Cards show the step type, its name, a one-line summary and — on live versions — a
  **stats strip**: entered · waiting · exited, or sent · opened · clicked · conv for a Delivery.
- **Validate** opens the validation panel above the canvas: every check, the failing ones
  naming the step (click it to select the step). Activate opens the same panel when a check
  fails.

### The right panel

- **Journey settings** (collapsible): name, description, folder, lifecycle phase,
  priority 1–100, end date and what happens then (Closing or Closed), *Ignore
  unsubscribe* (service messages only — every Delivery step then has to confirm "send even
  if unsubscribed" on its own), test users.
- **Step details** for the selected step. Highlights:
  - **Entry**: the type buttons, the type's fields (segment + frequency, date attribute +
    offset, event + payload + *API code*, list, channel + inactivity, Digital Twin signal,
    the Agent's rationale), include-project-segment and the re-entry rule.
  - **Delivery**: channel, template, the journey's own text with parameters, content mode
    (single, A/B, dynamic), control group, the **policies** applied at send time, test send.
  - **Wait for event**: event, timeout and the explainer of the webhook and the one-time
    release URL; its paths accepted · rejected · timeout with their targets.
  - **Engagement split**: the Delivery it evaluates and the interactions, one path each
    plus Remaining. **Segment split**: an ordered segment list. **Shuffle**: weights and
    *Set equal*.
  - **Call external**: the endpoint, labelled webhook or MCP tool. **Control group**: the
    hold-out share, export and "build a segment from it".

### The simulation strip — demo only

Both Journeys and Journey Monitor carry a dashed strip badged **⚗ Simulation · demo only**.
It is not part of the product. The prototype has no clock and sends nothing; the strip
moves a simulated clock so you can watch contacts move:

- **Send event** admits a contact through an Event entry (or releases a Wait for event).
- **Advance 1 day** lets waits expire and scheduled entries admit new matches.
- One simulated contact stands for about 6,500 real ones in every number shown.

## Journey Monitor

Pick a journey. **General** shows:

- **Entered · Active now · Exited · Conversions** as four tiles, and the channel totals.
- **Anomaly alerts** from the Marketing Agent: steps whose daily volume deviates from the
  30-day baseline, with a confidence level. *Open step* jumps to it; *Dismiss* hides it.
- The **versions** table — status, activated by / when, entry, counters — with *View
  version* and *Step export*.
- The **participant list at a point in time**: drag the slider to see who was where on an
  earlier day. *Download CSV* is a mock.

**View version** draws the version read-only with the stats strip and the alert markers,
lists the steps with their counters, and offers *Open in builder*. Click a step for its
**export**: entered / exited / was in / entered and exited, the time range, the count and
the columns. The **time range** (7 / 30 / 90 days / all) scales the numbers.

## Segments

Segments are built on a datamart and belong to a segment group. **+ New segment**
opens the workbench: the definition on the left, the query builder and a live
audience insight on the right. **Search** counts the audience. A segment can be
an exclusion list for chosen channels. Journeys reference segments in entries, waits
and splits.

## Policies

Communication policies (caps, quiet hours) and invitation policies (quiet periods after a
journey) that a Delivery step picks. The page is read-only and shows which journeys pick
each policy; consent and exclusion lists always apply underneath.

## Tips for a demo

- Append `?notour` to the URL for a clean start.
- Open **Winback – unengaged 90d** as an Approver: the live version with its stats strip,
  then **Copy to new version**, change a step, **Activate** — v4 goes to Closing.
- Open **Payment failed – dunning**: a Draft whose validation fails on an unconnected path;
  connect it and Activate.
- In the Monitor, pick a journey, read the Agent's alerts, switch to **View version**, click
  a step for its export, then **Advance 5 days** and watch the strip change.
- Toasts tell you when an action is only pretended (test send, export, audience sync).
