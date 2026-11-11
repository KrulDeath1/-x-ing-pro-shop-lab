---
name: X-ING Pro Shop Lab
description: A drilling layout app for bowlers and pro shops, with the reasons behind every layout.
colors:
  lane-white: "#eef0f3"
  bench-grey: "#e2e5ea"
  pin-black: "#0b0c0e"
  slate-muted: "#4b515c"
  cobalt: "#1f2de6"
  cobalt-ink: "#ffffff"
  night-bg: "#0b0c0e"
  night-surface: "#17181a"
  night-ink: "#eef0f3"
  night-muted: "#8e8f92"
  window-slate: "#1b2028"
  window-ink: "#eceef0"
  sky-ground: "#c6d3df"
  sky-surface: "#d6e0e9"
  sky-ink: "#25303a"
  paper: "#ffffff"
typography:
  display:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "clamp(38px, 3.24vw + 25.4px, 72px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "clamp(30px, 1.72vw + 23.3px, 48px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  lead:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "16px"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  s-9: "96px"
  s-10: "128px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 24px"
  button-secondary:
    backgroundColor: "{colors.bench-grey}"
    textColor: "{colors.pin-black}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 24px"
  pill:
    backgroundColor: "{colors.bench-grey}"
    textColor: "{colors.pin-black}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.bench-grey}"
    textColor: "{colors.pin-black}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-plan-featured:
    backgroundColor: "{colors.bench-grey}"
    textColor: "{colors.pin-black}"
    rounded: "{rounded.lg}"
    padding: "24px"
  app-window:
    backgroundColor: "{colors.window-slate}"
    textColor: "{colors.window-ink}"
    rounded: "{rounded.lg}"
  drill-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pin-black}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: X-ING Pro Shop Lab

## Overview

**Creative North Star: "The Lit Lane"**

The page is a lane under bright, even light: a cool off-white ground, near-black ink, and a single cobalt mark that works like the bench lamp over a drill press. The light shows you exactly where to look. Everything else stays quiet and exact, so the numbers (PAP, speed, revs, pin-to-PAP, VAL angle) and the app's own screens carry the page.

Density is comfortable, not airy. Sections pair a short heading with real proof: a captured app screen, a printed drill sheet, a worked example, a ruled comparison. Depth comes from tone (ground, bench grey, white paper, one dark app window) rather than from shadows. The hero's dark window, the drilled ball over a lane seen from above, is the one heavy object on the page and the reason the rest can stay light.

The tone is a driller's: exact terms a pro shop trusts, plain words a bowler can follow. No decoration that doesn't explain something.

**Key Characteristics:**
- Cool off-white ground (#eef0f3) with one cobalt accent (#1f2de6), used sparingly.
- Host Grotesk throughout, medium weight with tight tracking for headings; JetBrains Mono for numbers and specs.
- Soft corners (12–20px) on panels and cards; pill buttons and chips.
- Flat at rest; hairline lines (ink at 11% / 20%) do the structuring.
- Real app screens and printed sheets as the imagery, never stock or illustration.

## Colors

A cool, nearly colourless lane palette with one saturated blue that means "act here" or "this is yours".

### Primary
- **Bench-Lamp Cobalt** (#1f2de6): primary buttons, links, focus, the featured Pro plan's outline and column tint, tick marks, numbered steps, and the "yours" row in the chart-vs-yours comparison. It is also the oil colour in the lane graphic. White text on it (cobalt-ink).

### Neutral
- **Lane White** (#eef0f3): the page ground and the browser theme colour.
- **Bench Grey** (#e2e5ea): cards, panels and the alternating section surface.
- **Pin Black** (#0b0c0e): all read text and headings. Body copy stays in ink, not grey.
- **Slate Muted** (#4b515c): captions, notes, small labels, and secondary table text only.
- **Hairlines**: ink at 11% (`--line`) for rows and card borders, ink at 20% (`--line-strong`) for emphasis. These are mixes, not new colours.
- **Night** (#0b0c0e / #17181a / #eef0f3 / #8e8f92): the inverted section and footer, with the light ink as its action colour.
- **Window Slate** (#1b2028, text #eceef0): the app window frame in the hero, matching the app's own dark ball view.
- **Sky Ground** (#c6d3df / #d6e0e9, ink #25303a): the lit ground behind the hero window.
- **Paper** (#ffffff): printed sheets and app captures, shown as paper on the section.

### Named Rules
**The One Lamp Rule.** Cobalt is the only saturated colour on the page. It marks action, selection or "yours", never decoration, and covers a small share of any screen.

**The Ink Floor Rule.** Text people read is 16px or more in Pin Black. Slate Muted is for captions and labels, never for paragraphs.

## Typography

**Display Font:** Host Grotesk (with system-ui, sans-serif)
**Body Font:** Host Grotesk (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Menlo, Consolas)

**Character:** One grotesk at two voices: medium weight, tightly tracked (−0.035em, −0.04em at the largest sizes) for headings; regular for reading. Mono marks the numbers a driller would write on a sheet.

### Hierarchy
- **Display** (500, clamp 38–72px, 1.04): the hero heading and the closing word only.
- **Headline** (500, clamp 30–48px, 1.1): section headings.
- **Title** (500, 18px, 20px from 1024px, 1.3, −0.01em): card and plan titles, in the text face.
- **Lead** (400, 18px, 20px from 1024px, 1.5, max 60ch): the sentence under a section heading, in ink.
- **Body** (400, 16px, 1.55, max about 52–78ch): read text.
- **Small** (400, 14px, 1.5): captions, notes and table cells, in Slate Muted.
- **Label** (500, 13px, 1.4, +0.01em): chips, group rows, table sub-labels.
- **Mono** (500): values such as speeds, rev rates and distances inside running text and tables.

### Named Rules
**The No Lone Word Rule.** Read text uses `text-wrap: pretty`; headings break by sense, not by width.

## Layout

A 1280px container with an 80px gutter on desktop (48px from 640px, 24px on a phone) and a 24px column gap (12px on a phone). Spacing runs on a 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. One heading-to-content gap of 48px (32px on a phone).

Sections are at least one screen tall and grow with their content. Surfaces alternate (Lane White, Bench Grey) as pairs, with one inverted Night section. The hero is centred: heading, lead, the two audiences as chips, then the 600px app window over the lane ground. On phones sections pad 96px top and 48px bottom, side-by-side items stack, and wide tables shrink their plan columns to 72px and drop sub-labels.

## Elevation & Depth

Flat by default. Depth comes from tone: ground, bench-grey cards, white paper, and the one dark window. Shadows appear only where a real object sits on the page (a printed sheet, an app capture, the hero window), and always as a hairline ring plus one long, soft drop.

### Shadow Vocabulary
- **Paper** (`box-shadow: 0 0 0 1px rgb(11 12 14 / 6%), 0 24px 48px -24px rgb(11 12 14 / 28%)`): printed sheets and document captures.
- **Capture** (`box-shadow: 0 1px 2px rgb(11 12 14 / 6%), 0 24px 48px -24px rgb(11 12 14 / 22%)`): app screens in the worked example.
- **Window** (`box-shadow: 0 0 0 1px rgb(255 255 255 / .08), 0 30px 60px -30px rgb(11 12 14 / .55)`): the hero's dark app window only.

### Named Rules
**The Real Object Rule.** Only things that exist off the page (paper, a screen, a window) cast a shadow. Cards and panels never do.

## Shapes

Soft, consistent corners: 8px small, 12px for panels and paper, 20px for cards and windows. Buttons and chips are full pills. Circles mark small counters (numbered steps, ticks). Lines are 1px hairlines; the only heavier line is the 3px cobalt top rule on the featured plan's column.

## Components

### Buttons
- **Shape:** full pill (999px), 44px tall (36px small), 24px side padding.
- **Primary:** cobalt with white label, a small chevron after the label that slides 3px on hover; hover darkens toward ink.
- **Secondary:** tonal (ink at 8% on the ground), no border; on a phone in a button row it becomes an underlined text link.
- **Active:** presses down 1px and scales to 98.5%. Transitions run 180ms on `cubic-bezier(.2, .8, .2, 1)`.

### Chips
- **Style:** pill, 32px tall (36px in the hero, 44px on touch), bench-grey with a hairline border, 13px label.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** Bench Grey on Lane White (and the reverse on bench sections).
- **Shadow Strategy:** none (see The Real Object Rule).
- **Border:** 1px hairline.
- **Internal Padding:** 24px (16px on a phone). An "open" card drops its box so a panel of app UI sits directly on the section.
- **Featured plan:** cobalt border plus a 1px cobalt inner ring.

### Comparison table
A bench-grey box with 20px corners holding a fixed table: hairline rows, muted group rows, cobalt tick circles for "yes", faint crosses for "no", and the Pro column tinted cobalt at 6% with a 3px cobalt top rule. Folded under the plan cards behind a disclosure.

### Navigation
Card-style nav bar, 72px tall (56px on a phone), with the primary button at 44px; on a phone it opens to a full-width menu with a 48px button.

### App window (signature)
A dark slate window (#1b2028) with a 40px title bar, three grey dots and a 13px caption, holding the app's own ball view. It sits over a top-down lane drawing (boards, gutters, arrows, range dots, cobalt oil fading at 38 ft). It is the hero's proof and is sized so its labels (Pin, PAP, PSA, VAL) stay readable.

### Drill sheet (signature)
A white paper card with 12px corners and the Paper shadow, showing the printed sheet whole with a one-line centred caption beneath.

## Do's and Don'ts

### Do:
- **Do** use Bench-Lamp Cobalt (#1f2de6) only for action, selection and "yours".
- **Do** show the real app and real printed sheets as the page's imagery, cropped so each ends on whole content.
- **Do** keep read text at 16px or more in Pin Black, with `text-wrap: pretty`.
- **Do** put numbers a driller would write down in JetBrains Mono.
- **Do** structure with 1px hairlines and tonal surfaces before reaching for shadows.

### Don't:
- **Don't** add a second saturated colour or a gradient accent.
- **Don't** put shadows on cards or panels; only paper, captures and the hero window cast one.
- **Don't** set paragraphs in Slate Muted.
- **Don't** use stock photos or illustration where an app screen or sheet can show the real thing.
