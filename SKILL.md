---
name: bench
description: The "Bench" house style for HTML artifacts, memos, readouts, explainers and small tools. It combines a warm paper ground and figure plates with Linear-style labels and controls, Medusa-style tables, Nucleo icons, and a fixed masthead that carries the author's avatar. Pages are built from shared CSS, so every artifact looks the same. Use ONLY when the user runs /bench or explicitly asks for the Bench style. Never apply it on your own.
disable-model-invocation: true
---

# Bench

Bench pages look the same because every page is assembled from the same files. The shared CSS is pasted in word for word, the masthead is fixed, components come from a cookbook, and the build refuses drift. You write the content and choose the layout. You never restyle.

## Skill layout (`~/.claude/skills/bench/`)

If `assets/author.json` still says `Your name`, ask the user for their name (and optionally a square photo for `assets/avatar.jpg`) before the first build.

```
SKILL.md              this file: workflow and hard rules
DESIGN.md             the spec: principles, tokens, components, layouts, open questions, changelog. Read it first.
src/                  the system itself; edit only with the user's approval
  tokens.css          every color, face, size, space, radius, button and motion value, light and dark
  bench.css           all components, built only from tokens
  bench.js            behaviors (segmented control)
templates/            memo, readout, explainer and tool (.src.html); every page starts from one
references/
  components.md       copy-paste markup for every component
  charts.md           chart recipe: series colors, classes, hatch pattern, SVG helper
scripts/
  build.mjs           runs the check, then inlines CSS, JS, icons, avatar and figures into a publishable .html
  check.mjs           drift linter (the build runs it)
  icons.py            Nucleo UI outline icons from the local Nucleo library
assets/               author.json and avatar.jpg for the automatic Author field
icons/                exported icon cache
specimen/             source of the live design-system page; builds to dist/bench.html
examples/             market-press: the page Bench came from (anatomy figure source and fragments)
                      before-we-ship-5m: a full memo built with Bench (first trial, Oct 15); copy patterns from it
```

## Workflow

1. **Read** `DESIGN.md`, then `references/components.md`. Also read `references/charts.md` if the page has charts.
2. **Pick a layout and width** (DESIGN.md › Layouts and Width) and say which in one line. Width comes from the widest thing the reader must see at once: `read` (780) for anything read top to bottom, `wide` (1080) for tools and dashboards. In a read page, give the one or two blocks that need room `.b-bleed`. Declare it on `<main class="b-page" data-width="read|wide">`.
3. **Copy the template** into the scratchpad as `<slug>.src.html`. Keep `<!--bench:css-->` and the template's `data-width`.
4. **Write the masthead first, exactly as the template has it:** eyebrow (1–2 context items, then the date last, written like `Oct 15, 2026`), a `.b-display` headline in sentence case, a `.b-lede`, and `<dl class="b-meta">` with 2–4 short fields. The build adds the Author field (name from `assets/author.json`, photo from `assets/avatar.jpg`, initials if there is none) first. If the page drew on MCPs or connectors (Hex, Notion, Slack, Amplitude…), end the row with `<!--bench:connectors hex notion-->`. Slugs are the file names in `assets/connectors/`.
5. **Write the body from cookbook markup only.** The page `<style>` may set layout (grid columns, widths in `var(--b-*)`) and nothing else. If you need something the cookbook doesn't have, stop and propose it (step 8). Don't invent CSS.
6. **Icons:** write `<!--icon:name-->`, adding `:12` for the 12 grid and `:fill` for the filled style (`<!--icon:caret-up:12:fill-->`). Pick the size from the text beside the icon (DESIGN.md › Icons): 12 for text up to 13px, 18 for body and controls, 18 for headings. Use outline for actions and objects, filled for states. Find names and their sizes with `python3 ~/.claude/skills/bench/scripts/icons.py --search word`. Nucleo only.
7. **Build:** run `node ~/.claude/skills/bench/scripts/build.mjs <slug>.src.html`, which writes `<slug>.html`. It runs the drift check first and fails on literal colors, fonts, radii, uppercase or leftover `{{placeholders}}`. Take one screenshot look if one is available, fix what it shows, then publish the `.html`.
8. **Grow the system on purpose.** A new token or component goes into `src/`, `references/components.md`, the specimen and DESIGN.md's changelog together, after the user agrees. Rebuild the specimen, republish it if the user keeps a live copy, and tell the user what you added.

**Mockups and flows:** before publishing, screenshot the whole row of devices at 2× in both themes and compare each phone to its neighbors for size and visual weight.

**Mockup kit:** to show where something lives in a product and how a user moves through it, use the 2D mockup kit (DESIGN.md › Illustrations and mockups; markup in `references/mockups.md`; full example in `examples/suggest-feature/`). Use real device frames, skeleton lines for text that doesn't matter, one `data-focus` element per screen, and `data-wire` from the tapped element to the next screen. Build `/anatomy` figures only to explain how a mechanism works.

**Isometric figures:** build them with `/anatomy`. Write the fragment as `out/<name>.json` beside the page source (follow `writeFigure` in `examples/market-press/common.mjs`), then place `<!--bench:figure <name>-->`. The build restyles the figure's plate to match.

## Hard rules

- Bench overrides the aesthetic guidance in `artifact-design`. That skill's page contract still applies: title, viewport meta, gutters, theme tokens, CDN rules, phone width and title naming.
- The eyebrow always ends with the page date (`Oct 15, 2026`). Don't repeat that date in the details row. Use a details field only for a different date, like "Data through".
- Every page gets the light/dark toggle top right from the build. Don't add another theme control.
- Every page opens with the masthead. Use one `.b-display` per page, and `.b-h2` for section headings.
- Up/down changes are always `<span class="b-delta" data-dir="up|down">`. The build adds the filled caret (12px, or 18px with `data-size="18"`). Never write arrows or ↑↓ yourself.
- No uppercase text. Labels (`.b-label`) are sentence case.
- Borders: boxes on the page use `--b-ring` (see-through). Floating surfaces (modals, sheets, menus) use `--b-elev`. Things inside a box (inputs, code, quotes, notes, groups) get a grey fill and no border. `--b-line-3` is only for dividers.
- Rows inside a grey-filled group are split by gaps in the surface color behind it, never by darker lines.
- Corners are concentric: an inner box's radius is the outer radius minus the gap between them.
- When a page reports progress (gates, checklists, roadmaps, status updates), statuses are `<span class="b-chip" data-status="NAME">Label</span>` using the Slack status icons: todo, ongoing, progress, paused, check, canceled, aligned-intensified (once per page). DESIGN.md has the meaning of each. Page scripts use `BENCH.status(name, label)`.
- Big numbers inside an interactive figure or product recreation may use `.b-figure-num` (condensed). Nowhere else.
- A reference section with 4+ topics read one at a time (Q&A, FAQ, implementation notes) is `.b-vtabs`: questions on the left, one answer panel on the right. Never a stack of full-width cards.
- A pick-one set of options is one `.b-options` box with `button.b-option` children, never separate cards. Beside a figure it matches the figure's height.
- A chip that shows a level other than progress (confidence, risk) has a dot tone (green high or done, amber medium or partial, red blocked, hollow low or unknown). `data-plain` chips are only for categories.
- A label for a whole card (Recommended, New) is a `.b-panel-tag` on the card's edge, never an inline chip.
- Any table whose cells run to several lines takes `data-wrap`, which also stripes its rows. Short one-line tables don't.
- Stats that describe the chart right below them go in one `.b-linked` box with it. Two boxes side by side go in a `.b-pair` and end at the same height. A figure's caption goes inside its plate, and a panel's source line is a `.b-source`. If one would be more than about 1.5× the other, stack them.
- Stats are one bordered block with dashed dividers (`.b-stats`), never separate cards. Cells align part by part (label, value, note all top-aligned on shared rows). Keep labels to one line (about 24 characters in a row of four) and notes to two lines.
- Container padding comes from the components and scales with the box: 16px for cards in a row and stat tiles, 24px for a panel spanning the full column. Don't pad them in page CSS.
- Heading spacing comes from `.b-section-head` (label 4px, description 6px, content 16px). Don't add margins around headings.
- The details row stays on one line and scrolls sideways when it overflows. Never make it wrap.
- Numbers use the sans with tabular digits, and units sit inline at full size. Mono is only for code and live figure readouts.
- Color carries meaning: green is yes, up or done; red is no, down or blocked; amber is partial or in progress; blue is info or a link. In charts, the primary series is strong ink and the comparison series is `line-2`.
- Icons are Nucleo only. No emoji and no web fonts. Gradients appear only inside the button tokens, and radii come only from the radius tokens.
- Number sections only when the order means something.
- Re-running an existing artifact in Bench publishes a **new** artifact unless the user asks to replace the original.
