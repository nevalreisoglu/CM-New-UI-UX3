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

## Journeys

The page opens on the **journey list**: name, status, validation, trigger, steps,
version, customers inside, entered and converted. Search by name or id, filter by
status, open the advanced filters for trigger type, channel, owner, datamart and
dates. **Open** puts a journey on the canvas; **More** offers Monitor, Execution
report, Copy and Pause / Resume.

### Create your journey

- **+ New journey** asks for a name, a description and what starts the journey:
  an event, a segment entry or a schedule.
- **Start building** creates a Draft with its entry step in place and opens the
  canvas. A copy of a recent journey is one click away under *Start from a template*.

### The canvas

- The **palette** on the left lists the step types. Drag one onto the canvas, or
  click it to add it after the selected step.
- Drag a step to move it; drag from the orange port to connect it; click a link's
  label to remove the connection; × on a step or the Delete key removes it.
- The **Journey Builder Info** panel on the right holds the journey name and the
  selected step's settings. A Delivery step is a full delivery: channel, template,
  content text, A/B or dynamic content, control group and communication rules.
- **Validate** checks the structure; **Activate** needs an approver or an admin.

### The simulation strip — demo only

Both Journeys and Journey Monitor carry a dashed strip badged **⚗ Simulation · demo only**.
It is not part of the product. The prototype has no clock and sends nothing; the
strip moves a simulated clock so you can watch customers move:

- **Send event** admits a customer through an event entry and runs the immediate steps.
- **Advance 1 day** lets timers and waits expire.

## Roles

The role view in the top bar changes what you may do, not what you see:

1. **Marketer** builds journeys and segments and submits them.
2. **Approver** activates and stops journey versions.
3. **Admin** does both, and maintains the lifecycle phase list and folders.

## Journey Monitor

Pick a journey. The page shows status, version and activation for every journey,
then for the selected one:

- **Participants · Active now · Goal reached · Exited** as four tiles.
- The **funnel** — how many customers reached each step.
- The **participant list at a point in time**: drag the slider to see who was where on an earlier day.
- **Download CSV** is a mock; the prototype exports nothing.

## Segments

Segments are built on a datamart and belong to a segment group. **+ New segment**
opens the workbench: the definition on the left, the query builder and a live
audience insight on the right. **Search** counts the audience. A segment can be
an exclusion list for chosen channels.

## Policies

Communication policies attached to journeys: invitation (quiet period after an
offer group), communication (may this outbound go out today, on this channel),
per-channel control group and region switches. The page is read-only; a journey's
Delivery step picks the policy it applies.

## Tips for a demo

- Append `?notour` to the URL for a clean start.
- Use **Send event** on an Active journey, then **Advance 1 day**, and watch the step badges and the monitor change.
- Switch the role to **Approver** before activating a journey — a marketer cannot.
- Toasts tell you when an action is only pretended (test send, export, activation side effects).
