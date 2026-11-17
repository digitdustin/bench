# Bench design system

Version 1.9 · 2026-11-08 · Owner: Dustin Karp
Live specimen: https://claude.ai/artifact/2HSALT2gU6Vq9UrHAo1cMW (publish from `dist/bench.html`, same URL every time)
Origin: "How a Polymarket market works" (Market Press), https://claude.ai/artifact/TjChdPg7oTrYbwcSNv8dhW

This file is the written spec. `src/tokens.css` and `src/bench.css` are the code. The specimen page is the picture. Keep all three in step: a change lands in `src/`, the specimen shows it, and the changelog below records it.

## Principles

1. **The page is a bench, and the figures are instruments on it.** Warm paper ground, with figures and charts framed in plates that carry corner labels.
2. **Grey does the hierarchy.** Four ink levels (strong, text, muted, and the hairlines) carry every distinction. There is no brand accent.
3. **Color is meaning.** Green is YES, up or done; red is NO, down or blocked; amber is partial or in progress; blue is info or a link. Nothing else gets color. In charts the primary series is strong ink and the comparison series is grey.
4. **Linear's handling of UI elements.** Sentence-case labels, medium weight for emphasis, quiet tables, soft radii that step up with size, low-contrast 1px rings, and pills whose dot carries the color. Shadows only lift interactive things.
6. **Every page opens the same way.** Masthead in a fixed format: eyebrow ending with the date (`Oct 15, 2026`), 40px headline, lede, then a details row of stacked label/value pairs that always starts with Author (avatar and name, added by the build).
7. **Nucleo icons only.** Nucleo UI outline from the local Nucleo library, unless the user names another set.
8. **Sans for numbers.** Stats and table figures use the sans with even-width digits. Mono is only for code and live figure readouts.
5. **Quiet type with one loud headline.** One large display line per page; everything else stays small and even.

## Tokens (see `src/tokens.css`)

| Group | Tokens | Light → Dark |
|---|---|---|
| Ground | `--b-page` `--b-card` `--b-raised` `--b-sunk` | #f2f2ef #fbfbfa #fff #ededea → #0b0b0b #131313 #1b1b1b #0f0f0f |
| Ink | `--b-strong` `--b-text` `--b-muted` | #18181a #57575a #7c7c80 → #e6e6e6 #a3a3a3 #85858a |
| Lines | `--b-line` `--b-line-2` `--b-line-3` | #8a8a8f #d0d0cd #e4e4e1 → #6a6a6a #333 #232323 (dividers and chart marks only) |
| Ring | `--b-ring` | #dcdcd8 → #2a2a2a, the one border for every container and control |
| Signal | `--b-green` `--b-red` `--b-amber` `--b-blue` (+ `-wash`) | #30a46c #e5484d #b8720a #3e63dd → #6be0a0 #ff6b6b #f0b14a #6b9bff |
| Face | `--b-sans` system UI · `--b-mono` SF Mono | |
| Size | display 30–40 · h1 26–32 · h2 20 · h3 15 · body 15 · small 13 · label 12.5 medium · stat 24–30 semibold | |
| Space | `--b-1`…`--b-9` = 4 8 12 16 24 32 48 64 96 | |
| Measure | `--b-measure` 780 (read) · `--b-wide` 1080 (wide, bleed) · `--b-prose` 62ch | |
| Shape | `--b-radius-xs` 4 · `--b-radius-sm` 6 · `--b-radius` 8 · `--b-radius-lg` 12 | |
| Buttons | `--b-btn-bg/fg/shadow/hover`, `--b-btn-solid-*` | lit top edge, ring and soft drop; the only gradients in the system |
| Motion | `--b-ease` cubic-bezier(.32,.72,0,1) · `--b-fast` 160ms · `--b-slow` 420ms | |

Ground, ink and signal colors match the anatomy kit's `--anatomy-*` values, so isometric figures sit on the page with no seam.

## Width

Choose the width from the widest thing a reader has to see at once, not from how long the page is or how many tables it has. Every page declares it on `<main class="b-page" data-width="…">`; the checker fails a page that doesn't.

| Width | Size | Use for | Examples |
|---|---|---|---|
| `read` | 780px | Anything read top to bottom: memos, proposals, reports, explainers, write-ups | Before We Ship 5-Minute, Dustin's Voice Skill, Market Press |
| `wide` | 1080px | Tools and dashboards, where most sections are side by side or interactive | Settlement Glide, a KPI readout with several charts |
| `.b-bleed` | 1080px, inside a read page | The one or two blocks in a read page that need room: a table with 6+ columns, a chart with long time axes, vertical tabs whose panels hold tables | The scenario table and the field guide in Dustin's Voice Skill |

- Default to `read`. Go `wide` only when more than about half the sections need the room. If only one or two blocks do, keep `read` and give those blocks `.b-bleed`.
- Running text stays at 62 characters per line at every width. Wide pages get wider boxes, not wider paragraphs.
- On phones every width is the same full column.

## Illustrations and mockups

Two kinds of picture, for two jobs:

| Kind | Use it to show | Built with |
|---|---|---|
| Isometric figure | How a mechanism or idea works (a market, a cache, a settlement rule) | `/anatomy`, placed with `<!--bench:figure name-->` |
| 2D mockup | Where something lives in a product and how a user moves through it, on web and mobile | The mockup kit, `bm-` classes (`src/mockups.css`, `src/mockups.js`) |

Mockups follow the anatomy discipline, drawn flat:

- **A real device, built from small parts.** Phones are 220px wide with bezel, island, side buttons and a soft halo. Browsers are 460px (620px with `data-size="wide"`) with window controls and an address bar. The same frames on every page, never a bare rectangle.
- **Low fidelity, precise.** Real words only on the elements the flow is about. Everything else is skeleton rule lines (`.bm-skel`), the way anatomy's label plates stand in for print. No real data beyond what the step needs, no brand colors, no screenshots.
- **One lit element per screen.** The thing being tapped or introduced gets `data-focus` (an ink outline) and a `.bm-tap` pulse. Everything else stays grey.
- **Wires land on things.** In a flow, `data-wire="next-id"` on the tapped element draws a dashed, slowly moving wire from that element to the next screen. System diagrams use the same wires between `.bm-node`s: outlined (`data-lit`) for what we build, dashed for third-party pieces. No text arrows, no floating labels.
- **Framed and captioned.** Every flow sits in a plate (Fig N, a title, "Low-fidelity, for flow and placement", the step count). Each screen has a step caption: a small label (Step 1), a one-word name, then the detail.
- **Phones are a fixed size.** 220 × 477, set on the frame, so content can never stretch one phone taller than its neighbors.
- **Two to four screens per flow.** Longer flows split into several plates. Options that aren't a sequence (three release levels) sit side by side with no wires, and the plate's hint says so.
- **Mixed devices.** App flows and web flows get separate plates, since phones and browsers don't share a scale.
- **Actions pin to the bottom.** In every sheet, form and full screen, the primary action (and any ghost buttons under it) sits pinned to the bottom (`.bm-actions`), never floating under the fields. Fine print that belongs to the action ("Something broken? Contact support") stays under the button, 8px below it, centered.
- **Message screens center their content.** An icon, title and subtitle (confirmation, update prompt, empty state) center vertically in the space between the header and the actions.
- **Headers breathe.** Screen titles and sheet headers start a few pixels below the status bar or grabber, never tight against it.
- **Sheets have no border.** A sheet rising from the bottom edge is separated by the dimmed backdrop and a soft upward shadow (`--b-sheet`). In dark mode a faint light edge along the top keeps it from merging with the backdrop. Floating dialogs and menus keep `--b-elev`.
- **Image placeholders are 6px round**, and concentric with whatever they sit in.
- **Buttons are small and stacked buttons step down.** Mockup buttons are 26px tall. In a stack only the first is filled; every button after it is a ghost (text only). The CSS does this automatically.
- **A lit button gets no outline.** It's already the loudest thing on screen; the tap mark alone shows it's the step. Rows, menu items and cards get the ink outline.
- **The tap mark always shows.** It takes the element's own text color, so it's light on a dark button and dark on a light row.
- **Lead icons stand alone.** An icon above a title and subtitle (confirmations, empty states, update prompts) is a filled Nucleo icon on its own, 26px, never inside a circle or ring. The checker fails the old circled style. The same applies outside mockups.
- **The status bar is iOS-tight.** Time centered in the left ear, battery (rounded, with a nub) centered in the right, island in the middle.
- **Figures never scroll.** Flows wrap to fit, diagrams restack into one column on narrow screens, and charts scale down. When a flow wraps so screens stack, its wires are left out, since they would cut through screens and captions, and the step labels carry the order. Only tables scroll sideways, inside their own wrapper.
- **Mockup text keeps its full-size tracking.** Everything inside a device is a real interface drawn at about 60% scale. System fonts switch to a wider, lighter cut below about 20px, so mockup text is set at weight 450 with −2% letter spacing to look the way it would on the device. Row chevrons are 8px and quiet (muted ink at 75%), as on iOS.
- **Mockup titles are set tight.** Nav titles, sheet headers and screen titles use weight 650 and about −2% letter spacing, the way system UI sets them.
- The checker also fails a screen with more than one lit element and a wire that points at an id that doesn't exist.

## Rules for borders, spacing and the details row

- **Borders are see-through, and floating things get elevation.** `--b-ring` is black at about 9% (white in dark), so an edge takes the color of what's under it. Anything that floats above the page (modals, sheets, menus, popovers) uses `--b-elev`: the same kind of see-through edge plus a layered shadow, never a grey ring, and never a ring stacked on a separate shadow.
- **Borders for boxes on the page, fills for things inside them.** Plates, panels, stats, tables and chips get the ring. Inputs, code, quotes, notes, list groups, tiles and pills inside a box get a grey fill (`--b-sunk`) and no border.
- **Dividers in a filled group are gaps.** When rows sit in a grey-filled group (settings lists, menus, option lists in mockups), the line between rows is the color of the surface behind the group, so it reads as a cut, never a darker rule. Darker divider lines (`--b-line-3`) are only for unfilled tables and lists on the page.
- **Corners are concentric.** A box inside a box takes the outer radius minus the gap between their edges (14px modal, 8px inset, 6px art). Nested panels drop to the smaller radius automatically. Never put the same radius on a box and the box inside it.
- **Hover only with a mouse.** Every hover style sits behind `@media (hover:hover) and (pointer:fine)`, so taps on phones don't leave things stuck in hover.
- **Borders.** Every container on the page uses the same 1px ring, `--b-ring`: plates, panels, stat tiles, notes, code, chips, inputs, avatars. `--b-line-3` is only for dividers inside a container (table rows, the header band, the details-row rule). Nothing uses `--b-line-2` as a border. `check.mjs` fails a full ring drawn with a line token.
- **Heading spacing.** Label to heading 4px. Heading to its description 6px. Heading group to the first block 16px. Blocks inside a section 24px, sections 48px apart. Headings and descriptions never carry default `<p>` margins.
- **Container padding scales with the box.** Cards that share a row (panels in a grid, stat tiles): 16px on every side, 8px between parts. A panel that spans the full column (a summary or callout box): 24px, 12px between parts. List items 4px apart in both. Plates keep their larger padding because the corner labels sit inside it. The CSS picks the size from where the panel sits, so pages never set it.
- **Stats are one block.** A set of stats is a single box with the ring around it, and the cells are split by 1px dashed lines in the ring color. No floating separate cards. Use 2–4 stats per set. They sit in one row, and on phones in two columns where an odd last cell spans the full width. The dashes follow the rows.
- **Stat cards line up by row.** A row of stat cards shares three rows: label, value, note. Every part starts at the top of its row, so labels, values and notes align across cards, and a part that wraps to two lines adds space below itself. Keep labels short enough to fit one line at the row's width (about 24 characters in a row of four) and notes to two lines.
- **Chips that carry a level or status always have a dot.** Status: green done or clear, amber partial or in progress, red blocked, hollow unknown. Ordinal levels such as confidence: green high, amber medium (in-between levels like medium-high take amber), hollow low. Plain chips with no dot (`data-plain`) are only for categories and tags, where no value is better than another.
- **Card tags sit on the edge.** A label for a whole card (Recommended, New, Current) is a panel tag centered on the card's top edge (or bottom edge), outlined in the same ring as the selected card. It never goes inline, so every card in the row keeps its label and heading at the same height.
- **Link stats to their chart.** When a stat set describes the chart right below it, the two share one box (`.b-linked`), split by the same dashed line used between stat cells. The caption stays outside, under the box.
- **Boxes in a row are the same height.** In a pair (`.b-pair`) the taller box sets the height and the shorter one stretches: a chart centers in its plate, a text panel keeps its content at the top and pins its source line (`.b-source`) to the bottom. A figure's caption moves inside its plate (`.b-plate-caption`) so both boxes end on the same line. When one box would be more than about 1.5× the other's natural height, don't pair them: stack them, or move the longer text out of its box, or cut it.
- **Progress uses the Slack status icons.** Whenever a page reports where work stands (gates, checklists, roadmaps, launch plans, status updates), the status is a chip with one of the Polymarket Slack status reactions (`assets/status/`, from Shivkanth's Oct 8 thread in #us-web-product-engineering). Pick by meaning:

  | Icon | Use it for | Example labels |
  |---|---|---|
  | `todo` | not started, planned, not measured yet | Planned, Unknown, To check |
  | `ongoing` | work moving right now | In progress, Shipping today |
  | `progress` | partly done or partly known | Partly met, Partly known |
  | `paused` | stopped on purpose or waiting | Hold, Blocked on legal, Deferred |
  | `check` | done, met, confirmed | Done, Met, Shipped |
  | `canceled` | dropped, won't do, failed a gate | Canceled, Cut |
  | `aligned-intensified` | a decision everyone agreed to (animated, once per page at most) | Aligned, Decided |

  The neutral two are swapped per theme: `todo` (a pale ring) gets a mid-grey copy on light pages, and `canceled` (a dark disc) gets an inverted copy on dark pages. Use dot-tone chips only for levels that aren't progress (confidence, risk) and for categories. Never mix status icons and dot tones for the same column.
- **Figure numerals.** Big numbers inside an interactive figure or a product recreation (prices, timers, live readouts) may use the condensed figure face, `.b-figure-num` (Instrument Sans at 75% width, bold). It's illustrative: never for body text, labels or ordinary stat blocks in a memo. The build loads the font only on pages that use it.
- **Reference sections use vertical tabs.** When a section is a set of topics the reader looks up one at a time (implementation Q&A, FAQs, how-it-works notes, glossaries), and there are 4 or more, use `.b-vtabs`: the questions in a quiet list on the left, the current one on a raised thumb that slides between them, one answer panel on the right. Don't stack many full-width cards for this. Stack instead when the items should be read in order, or there are 3 or fewer. In the panel, the short answer is the heading, then a paragraph, then detail in a `.b-details` disclosure. On phones the questions become a sideways-scrolling row.
- **Choices are one connected box.** A set of options where the reader picks one (display rules, scenarios with descriptions) is a `.b-options` list: a single ring with dashed dividers, the current option outlined. Beside a figure it stretches to the figure's height and the options share it. A tag for one option sits on that option's top edge.
- **Tables with long rows are striped.** A table whose cells wrap to several lines (`data-wrap`: checklists, comparisons, field guides) gets a faint stripe on every other row (`--b-zebra`, about 3% ink) and loses its row lines, so the eye can follow a row across. Group rows don't count toward the stripe. Tables of short one-line values (numbers, names) keep plain row lines and no stripes.
- **Card grids fill their rows.** Pick `data-cols` so the cards divide evenly (4 cards: 2 columns, 3 or 6: 3 columns). Never let one card sit alone in a row.
- **Icons.** Nucleo UI only. Size follows the text beside the icon:

  | Text beside it | Grid | Rendered | Where |
  |---|---|---|---|
  | up to 13px | 12 | 12px | labels, small text, chips, deltas, table cells, captions |
  | 14–17px | 18 | 16px | body, lede, buttons, tabs, inputs |
  | 20px and up | 18 | 18px | headings, stat values, large deltas |

  Outline for actions and objects (eye, copy, search). Filled (`:fill`, Nucleo "glyph") for states (carets, status).
- **Up and down changes.** Always a filled caret, `caret-up` / `caret-down`, colored green or red with the text. Write `<span class="b-delta" data-dir="up">4.2%</span>` and the build adds the 12px caret. Add `data-size="18"` for a large change beside a heading or big number. The checker fails arrow icons and ↑↓ characters.
- **Theme toggle.** Every page has a light/dark toggle fixed top right: a pill-shaped segmented control with filled 12px Nucleo icons (`sun`, `moon-stars`). The build adds it. It follows the OS until the viewer picks, then remembers the pick in that browser.
- **Details row.** One line under the lede: Author first (automatic), then 2–4 short fields, and a Connectors field last when the page drew on MCPs (`<!--bench:connectors hex notion-->`, logos from Spool, logos only with the name on hover). When it runs out of room it scrolls sideways with a 40px fade on the cut edge. It never wraps.

### Pictures in cards

A picture inside a card (a video still, a screenshot, a photo, a thumbnail) runs to the card's edges. Nothing pads it, and the card's corners clip it, so the picture never gets its own radius or border. Only the text under it is padded: 12px on the sides and top and 16px at the bottom for cards in a row, 16px and 24px for a card that spans the column. Build it from `.b-media-card` on the panel, `.b-media` for the picture (16:9 by default, `data-shape="tall"` for 9:16 video, `"square"` for 1:1) and `.b-media-body` for the text. A video length or type goes in a `.b-media-tag` in the picture's bottom-left corner, white on a dark scrim in both themes.

When the card opens something, the whole card is the `<a>`. Artifacts can't embed YouTube or TikTok players, so a video card opens a modal on the page instead. The modal keeps the same rule: the still runs to its edges, the text below or beside it is padded, and a button opens the video in a new tab.

## Components (see `src/bench.css`, markup in the specimen)

page · masthead (eyebrow, display, lede, meta) · section + section-head · plate + corners + caption · chart marks (`.b-chart`) · panel · media card · stats + delta · table (Medusa-style) + meter · segmented control (sliding thumb, `src/bench.js`) · icons (`<!--icon:name-->`) · author field (auto) · kv · chips · note · buttons, input, tabs · legend keys · grid · footer

## Layouts

| Layout | Width | Opens with | Built from |
|---|---|---|---|
| Memo | read | Headline, lede, details row | Prose sections, notes, tables, at most one plate per section; `.b-bleed` for a wide table |
| Explainer | read | Headline, then a hero plate | Figures in plates, captions, short prose between them |
| Readout | wide | Headline, then stats | Stats, linked charts, tables with depth bars, sources |
| Tool | wide | Short header, the tool already working | Plates with controls, choice lists, vertical tabs |

## Open questions


- Should the display face stay the system sans, or get a distinct face (only via inlined @font-face; would need a new token and a check.mjs exception)?
- The chart marks are minimal (grid, axis, line, area, dot). Do readouts need more (bars, multiple series, tooltips)?
- Should this become the default for every artifact once it has been tried on a few concepts?

## Changelog

- **v1.9 · 2026-11-08.** Media cards (`.b-media-card`, `.b-media`, `.b-media-body`, `.b-media-tag`) and two tokens for tags laid over a picture (`--b-media-scrim`, `--b-media-ink`). Rule: a picture in a card runs to the card's edges and only the text is padded. Added at Dustin's request while building the Alex Kallis field guide.
- **v1.8.2 · 2026-10-16.** Reverted the Home feed mockup and removed the home-feed kit parts and their rules (v1.8, v1.8.1) at Dustin's request. The minor-release phone is back to its earlier version. Kept: fixed phone height.
- **v1.8.1 · 2026-10-16.** Dustin rejected the first home-feed mockup (heavy blocks, invented logo, loud button, phone taller than its neighbors). Rebuilt quiet: light fills, small dots, plain wordmark, one spacing rhythm, fixed phone height, feed running under a pinned tab bar. Rule added: skeletons are quiet, and every mockup is checked against its neighbors before it's shown.
- **v1.8 · 2026-10-16.** App home feed parts for mockups (app bar, categories, carousels with peeking cards, outcome rows, promo card, tab bar). Rule: skeleton the real screen's structure when a step lives on an existing screen. Suggest a Feature's minor-release phone now shows the 2.10 card in the Home feed's New on Polymarket carousel.
- **v1.7.1 · 2026-10-16.** Mockup text set at weight 450 and −2% tracking so small UI text reads like the real thing; smaller, quieter row chevrons.
- **v1.7 · 2026-10-16.** Actions pin to the bottom of sheets and screens with centered fine print 8px under the button; message screens center their content; headers sit a little lower; sheets drop their border for a soft upward shadow (`--b-sheet`).
- **v1.6.1 · 2026-10-16.** Dividers inside filled groups use the background color behind the group, so they read as gaps.
- **v1.6 · 2026-10-16.** Dustin's review plus an Emil design-engineering pass: alpha borders (`--b-ring`) and alpha elevation for floating surfaces (`--b-elev`); fills in place of borders for inputs, code, quotes, notes and mockup groups, tiles, pills and banners; concentric corners (nested panels, menus, the wide modal's art); 10px between a button and the fine print under it; 6px image placeholders; the sheet's double top edge removed; hover styles gated to fine pointers.
- **v1.5 · 2026-10-16.** Dustin's mockup review: buttons 26px with no outline when lit; tap mark uses the element's text color; stacked buttons after the first are ghosts; lead icons are filled icons with no circle (checker enforced); iOS-tight status bar with a rounded battery; figures never scroll (flows wrap, diagrams restack, charts scale); tighter mockup titles. Checker: one lit element per screen, wires must point at real ids.
- **v1.4 · 2026-10-16.** 2D mockup kit (`bm-` classes): phone and browser frames, screen parts, sheets, modals, menus, focus and tap marks, wires for flows and system diagrams. Rule for when to use a mockup and when an `/anatomy` figure. New tokens `--b-halo`, `--b-scrim`, `--b-device`. Fourth trial: Suggest a Feature Flows. The `.bm-media` placeholder hatch is the one gradient outside buttons.
- **v1.3 · 2026-10-16.** Wrapping-text tables stripe alternate rows with `--b-zebra` in place of row lines.
- **v1.2 · 2026-10-15.** Width rule: pages declare `read` (780) or `wide` (1080), and a read page breaks single wide blocks out with `.b-bleed`. The checker requires the declaration. Dustin's Voice Skill moved to read width with two bleeds. Prose stays 62ch at every width, which answers the open text-width question.
- **v1.1.1 · 2026-10-15.** `.b-grid[data-cols="2"|"3"]` are now exact column counts (one column on phones), so a set of cards can't leave one alone in a row. `.b-quote` for message specimens. Third trial: Dustin's Voice Skill.
- **v1.1 · 2026-10-15.** Vertical tabs (`.b-vtabs`) for reference sections, modeled on Medusa's tabs and the original Settlement Glide Q&A. Settlement Glide's implementation section moved back to it.
- **v1.0 · 2026-10-15.** Status icons from the Polymarket Slack reactions, with per-theme variants for the neutral ones and a still frame for reduced motion. Figure numerals (`--b-figure`, `.b-figure-num`). Connected choice lists (`.b-options`). Applied to both trials: the 5-minute checklist uses status chips, and Settlement Glide uses figure numerals and a connected rule list that matches the playground's height.
- **v0.9 · 2026-10-15.** Stats linked to the chart below them (`.b-linked`). Pairs keep equal heights (`.b-pair`, `.b-plate-caption`, `.b-source`), with a 1.5× limit before stacking.
- **v0.8.1 · 2026-10-15.** Stats become one bordered block with dashed dividers between cells, replacing separate cards.
- **v0.8 · 2026-10-15.** From Dustin's review and the Settlement Glide rebuild: stat cards top-align every part on shared rows. Level and status chips always carry a dot (confidence: green high, amber medium, hollow low). Card tags (`.b-panel-tag`) sit centered on the card edge, outlined like the selected card. New for interactive pages: chart series tokens `--b-series-1…4` (**proposed, pending Dustin's OK**), `button.b-panel` for selectable cards, `.b-details` disclosure, `.b-range` and `.b-check`, table cell tones and selected rows, code token colors, and `window.BENCH.icon()` so page scripts can draw carets.
- **v0.7 · 2026-10-15.** Light/dark toggle added to every page by the build (pill segmented control, `data-shape="pill"`, icon-only segments). The specimen's own System/Light/Dark bar removed in favor of it.
- **v0.6.1 · 2026-10-15.** Full-column panels get 24px padding and 12px between parts. Cards in a row keep 16px.
- **v0.6 · 2026-10-15.** Up/down changes use filled Nucleo carets, inserted by the build on every `.b-delta[data-dir]`. Icon sizing table added (12 grid to 13px text, 18 grid at 16px to 17px text, 18px from 20px). Icons can be filled (`<!--icon:name:12:fill-->`). The checker fails hand-placed arrows.
- **v0.5.2 · 2026-10-15.** The page date is always the last eyebrow item, and the checker enforces it. The details row no longer repeats it. A details field is used only for a different date ("Data through").
- **v0.5.1 · 2026-10-15.** Panels and stat tiles padded 16px all round (was 24px), with 8px between parts and 4px between list items. Connectors show logos only, 18px, the name on hover.
- **v0.5 · 2026-10-15.** Dustin's review of the trial: stat cards and plates had different border colors, heading-to-text spacing was too big, and he wanted Spool's MCP logos in the details row. Added `--b-ring` and moved every container and control onto it. Heading groups tightened (4/6/16px) with `<p>` margins reset. Details row is now single-line and scrolls with an edge fade. Connectors field added (54 logos from spool-electron/resources/mcp-logos, names and dark-mode inversion from its manifest). Checker fails rings drawn with line tokens.
- **v0.4 · 2026-10-15.** Skill restructured (scripts/, templates for memo/readout/explainer/tool, references/components.md and charts.md; build runs check and rejects leftover `{{placeholders}}`). Trial: "Before we ship 5-minute" rebuilt in Bench. New from the trial: `--b-amber` signal (**proposed, pending Dustin's OK**), chip tones warn/none, `.b-rows`, table `data-wrap`, group rows and `.b-cell`, `.b-panel[data-selected]`, chart bars/marker/note/value/hatch, `.b-key i[data-swatch]`. Fixes: caption is block (inline code no longer breaks out), stat tiles use subgrid so values align.
- **v0.3.2 · 2026-10-15.** Segmented control track loses its outer ring (it doubled up with the thumb's edge). The track is now a flat `--b-line-3` fill, which stays visible on the page in both themes.
- **v0.3.1 · 2026-10-15.** Author avatar added from Dustin's Slack profile photo (`assets/avatar.jpg`, 192px, from ca.slack-edge.com via the Slack web app). To refresh it, replace that file.
- **v0.3 · 2026-10-15.** Dustin's review: liked dark Preview button, wanted the same depth on all buttons; no small grey units in stats; Medusa tables; smaller and consistent headers; author with Slack photo in the details row; smoother segmented control; Nucleo for icons. Done: button tokens with lit edge and drop in both themes; stat units inline at full size, deltas with Nucleo arrows; tables unenclosed with a tinted header band and 48px rows (from @medusajs/ui Table source); display 30–40px and masthead made mandatory; build adds the Author field automatically; segmented control thumb slides at 280ms on the bench ease, with arrow-key support; `icons.py` exports Nucleo UI outline icons on demand.
- **v0.2 · 2026-10-15.** Dustin's review: uppercase captions, tables, large mono numbers and some elements felt off. Took labels, tables, controls and shape from Linear. Uppercase mono labels replaced by sentence-case sans (12.5 medium). Stats and table figures in sans with even-width digits. Tables get a quiet header and a rounded container. Radii 4/6/8/12, lighter lines, pill chips colored by their dot, softer note. Muted ink darkened for legibility. The specimen's spread gauge was swapped for a plain chart plate. `check.mjs` now fails uppercase text.
- **v0.1 · 2026-10-15.** First cut from Market Press. Palette, mono labels, plate and ease kept as they were. Headline scale added (52px display, 32px H1), body up from 14px to 15px. Components and four layout variants added. Skill is opt-in (`/bench`).
