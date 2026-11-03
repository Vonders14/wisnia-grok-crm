---
name: Wisnia Deal Inbox
description: A cold-paper correspondence register with the reply instrument attached.
colors:
  paper: "#f5f6f4"
  sheet: "#ffffff"
  ink: "#17242d"
  ink-secondary: "#40515d"
  muted: "#6e7c85"
  rule: "#d8dddc"
  rule-strong: "#b9c2c1"
  navy: "#183e53"
  navy-deep: "#102d3e"
  urgency: "#a33b31"
  urgency-soft: "#f5e9e6"
  waiting: "#8a6426"
  waiting-soft: "#f6efdf"
  closed: "#607078"
  closed-soft: "#edf0ef"
  focus: "#2879a6"
  success: "#277157"
typography:
  headline:
    fontFamily: "Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Georgia, serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Public Sans, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "normal"
  reader:
    fontFamily: "Public Sans, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "normal"
  label:
    fontFamily: "Public Sans, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  square: "0px"
spacing:
  micro: "4px"
  compact: "7px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sheet}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.square}"
  button-quiet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0 10px"
    height: "32px"
  field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0 9px"
    height: "31px"
  status-urgent:
    backgroundColor: "{colors.urgency-soft}"
    textColor: "{colors.urgency}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "4px 6px"
  status-waiting:
    backgroundColor: "{colors.waiting-soft}"
    textColor: "{colors.waiting}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "4px 6px"
---

# Design System: Wisnia Deal Inbox

## Overview

**Creative North Star: "The Correspondence Docket"**

Wisnia Deal Inbox is a dense working register, not a dashboard. Cold paper, white sheets, navy ink, thin rules, and square controls make each surface feel like an operational docket: quiet enough for rapid scanning, explicit enough that ownership and the next move are never decorative.

Public Sans carries all utility work. Georgia appears only when correspondence is opened or the system presents an empty-state invitation, giving the selected letter a deliberate editorial shift without turning the whole product into an editorial layout. The visual system is compact, ruled, and flat at rest; depth is reserved for docked or overlaid instruments.

**Key Characteristics:**
- Cold paper and white sheets separated by fine rules.
- Dense register rows with a narrow status signal at the leading edge.
- Navy actions, oxblood urgency, ochre waiting, and restrained neutral closure.
- Square controls and compact uppercase docket labels.
- Georgia reserved for opened correspondence and related empty states.

## Colors

The palette combines cool neutral paper with sober navy action color and sparse, semantic urgency signals.

### Primary
- **Docket Navy** (`navy`): The principal action and active-navigation color; it marks deliberate operations such as save, send, and the active filter rule.
- **Deep Navy** (`navy-deep`): The hover state for decisive navy actions.

### Secondary
- **Oxblood Urgency** (`urgency`): Marks work that needs Devon and error states. Its soft companion is used behind urgent badges and alerts.
- **Ochre Waiting** (`waiting`): Marks work currently owed by the counterparty. Its soft companion supplies the waiting badge field.

### Tertiary
- **Focus Blue** (`focus`): The accessible keyboard focus outline only.
- **Ledger Green** (`success`): Positive connection and synchronization status.

### Neutral
- **Cold Docket Paper** (`paper`): The page ground and conversation-reader field.
- **Letter Sheet** (`sheet`): Headers, controls, register rows, the reply sheet, and drawers.
- **Navy-Black Ink** (`ink`): Primary text and strong selected controls.
- **Slate Ink** (`ink-secondary`): Subjects and supporting content that still needs reading priority.
- **Ledger Grey** (`muted`): Metadata, timestamps, counts, and utility labels.
- **Hairline Rule** (`rule`): Ordinary row, field, and section divisions.
- **Strong Rule** (`rule-strong`): Pane divisions and control boundaries.
- **Closed Slate** (`closed`): Completed or inactive state text; its soft companion supplies the closed badge field.

### Named Rules

**The Semantic Signal Rule.** Oxblood means Devon owes the move, ochre means the other party owes it, and green means healthy connection state; do not use these colors as decoration.

**The Paper-and-Ink Rule.** Build hierarchy first with paper, sheet, ink, and rules. Navy is an action signal, not a general-purpose fill.

## Typography

**Display Font:** Georgia (with serif fallback)
**Body Font:** Public Sans (with Segoe UI and sans-serif fallbacks)

**Character:** Public Sans is compact, neutral, and operational. Georgia gives the opened letter and empty correspondence states a measured human voice while remaining absent from controls, filters, rows, and metadata.

### Hierarchy
- **Headline** (regular, `headline`, compact line height): Opened thread subjects.
- **Title** (regular, `title`, compact line height): Drawer and empty-state headings.
- **Body** (regular, `body`): Controls, register content, and general UI copy.
- **Reader** (regular, `reader`, relaxed line height): Message bodies, limited to approximately 74 characters per line.
- **Label** (bold, `label`, tracked uppercase): Docket headings, field labels, column headings, and status tags.

### Named Rules

**The Open-Letter Rule.** Georgia belongs to opened correspondence and its empty-state invitation; every operational control remains Public Sans.

**The Docket Label Rule.** Utility labels are small, bold, uppercase, and tracked. They name structure but never compete with subject lines or people.

## Layout

The desktop is a fixed-height three-row shell: a 66px top bar, a 48px filter strip, and the remaining workspace. The workspace splits 58%/42%, giving the action register enough room for seven independently labeled fields while keeping the selected thread and docked reply sheet visible on the right. Priority, company, contact, current state, last activity, ownership, and recommended action remain separate columns; decision-critical action copy may wrap rather than disappear behind ellipsis.

Spacing is compact and purposeful. Controls cluster around 7–12px internal gaps; pane and drawer edges use 18–22px. Message content centers in an 820px maximum sheet, and prose stops near 74ch.

At 940px, the register becomes the base view and the reader becomes a full-width slide-over with an explicit back action. At 640px, search docks beneath the top bars, nonessential status and sender controls collapse, and message metadata reflows vertically. The mobile transformation preserves the register-to-letter sequence rather than shrinking two panes side by side.

**The Two-Pane Priority Rule.** On desktop, the register and selected correspondence remain visible together; neither becomes a card stack or a collection of floating panels.

## Elevation & Depth

The system is flat by default. Borders, ruled edges, and tonal changes establish hierarchy across the register, reader, and reply instrument. Shadows appear only where a surface is physically docked over content or leaves the page plane: the reply sheet receives a faint upward shadow, while the settings drawer and transient toast use the stronger overlay shadow.

### Shadow Vocabulary
- **Docked Reply:** A low, upward shadow separates the reply sheet from the message history without making it float.
- **Overlay Instrument:** A broad ambient shadow plus a short contact shadow grounds drawers and toasts above the docket.

### Named Rules

**The Ruled-First Rule.** Use borders and tonal fields for ordinary hierarchy. Shadows are reserved for docked or overlaid instruments.

## Shapes

The form language is square and ledger-like. Buttons, inputs, selects, badges, attachment tags, rows, and the settings drawer use zero radius. Thin one-pixel rules define every control and division. The only circular shape is the tiny synchronization lamp, where the circle communicates status rather than softness.

**The Square Instrument Rule.** Interactive instruments and status tags have square corners. Do not round controls to make the surface friendlier.

## Components

### Buttons
- **Shape:** Square, one-pixel boundary, compact height.
- **Primary:** Navy field with white text; deep navy on hover.
- **Secondary / Quiet:** White field with strong neutral rule; hover shifts to a cool grey field and darker rule.
- **AI Outline:** White or transparent field with navy text and navy rule, keeping optional drafting visually distinct from send.
- **Focus:** Every keyboard-focusable control receives the same two-pixel focus-blue outline with a two-pixel offset.

### Chips
- **Style:** Square, uppercase, tracked, one-pixel outlined status tags.
- **State:** Urgent, waiting, and closed each use a semantic text/border color with a pale tonal field. The narrow leading row stripe repeats the same ownership state without adding another text column.

### Cards / Containers
- **Corner Style:** Square.
- **Background:** Paper for the reader ground; sheet for operational surfaces.
- **Shadow Strategy:** Flat at rest; see the Ruled-First Rule.
- **Border:** One-pixel rules carry structure.
- **Internal Padding:** Compact in rows and controls, wider only at pane edges.

### Inputs / Fields
- **Style:** White fill, strong neutral one-pixel border, square corners. Search is the exception: it uses only a bottom rule to remain quiet in the top bar.
- **Focus:** The global focus outline applies; embedded compose fields suppress local outlines because the ruled reply sheet provides field structure.
- **Disabled:** Reduced opacity and a blocked cursor.

### Navigation
- **Style:** Action-state scopes are text tabs inside the filter strip: Needs me, Questions, Send materials, NDA / legal, Schedule calls, Waiting on them, Blocked / monitor, Closed, and All. The active scope uses darker ink and a two-pixel navy underline; inactive scopes remain transparent with slate text. Counts are smaller, muted, and tabular. P1–P4 remains row-level priority, never the sole explanation of why work needs attention.
- **Responsive:** Navigation stays horizontally scrollable instead of wrapping into a second control row.

### Correspondence Row

Each row is a full-width, borderless register line with a one-pixel bottom rule and a four-pixel semantic ownership stripe. The selected row receives a cool blue-grey wash; hover receives a lighter neutral wash. Identity, subject, next move, preview, ownership, and time read in descending emphasis without separate action controls.

### Reply Sheet

The composer is docked to the bottom of the reader. To/from and subject fields are divided by rules, while the body remains an uninterrupted white writing field. Optional AI drafting sits at the left; save and send sit deliberately at the right, with send as the only filled action.

## Do's and Don'ts

### Do:
- **Do** preserve the 58%/42% action-register-to-reader split on wide screens.
- **Do** use rules and tonal fields before reaching for shadows.
- **Do** reserve Georgia for opened correspondence, empty correspondence states, and drawer titles.
- **Do** keep semantic ownership visible through both the leading stripe and compact status tag.
- **Do** keep send as a deliberate, filled navy action and AI drafting as an optional outline action.

### Don't:
- **Don't** turn correspondence into cards, dashboard widgets, or a boxed deal-desk stack.
- **Don't** round buttons, fields, badges, rows, or drawers.
- **Don't** use oxblood, ochre, or green decoratively; each color has an operational meaning.
- **Don't** introduce a left filter rail or merge current state with recommended action; both must remain separately scannable columns.
- **Don't** use Georgia for controls, filters, table rows, metadata, or body UI.
