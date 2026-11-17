# Bench component cookbook

Copy markup from here. Every class is defined in `src/bench.css`; `specimen/bench.src.html` shows each one rendered.
Tones everywhere: `yes` (green), `no` (red), `warn` (amber), `info` (blue), `none` (hollow dot: unknown or not started). Omit for neutral.

## Page and width
```html
<main class="b-page" data-width="read">   <!-- read 780 (default for docs) | wide 1080 (tools, dashboards) -->
  …
  <div class="b-bleed">…a 6+ column table or wide chart…</div>   <!-- breaks out to 1080 inside a read page -->
</main>
```

## Masthead (required, first thing in `.b-page`)
```html
<header class="b-masthead">
  <div class="b-eyebrow"><span class="b-label">Polymarket US</span><span class="b-label">Decision memo</span><span class="b-label">Oct 15, 2026</span></div>
  <h1 class="b-display">Headline, sentence case</h1>
  <p class="b-lede">One to three sentences.</p>
  <dl class="b-meta">                         <!-- Author is inserted first automatically -->
    <div><dt class="b-label">Status</dt><dd>Draft</dd></div>
  </dl>
</header>
```
Eyebrow: 1–2 context items, then the page date last (`Oct 15, 2026`), separated by `/` automatically. `check.mjs` fails a page whose eyebrow doesn't end with the date. Don't repeat the date in the details row. Details row: 2–4 fields after Author, each value short. A field can carry a chip: `<dd><span class="b-chip" data-tone="warn">Hold</span></dd>`.
Connectors go last: `<!--bench:connectors hex notion slack-->` inside the `<dl>`. They render as logos only, with the name on hover. The row scrolls sideways when it overflows, with a fade on the cut edge.
Borders: containers and controls use `var(--b-ring)`. Dividers inside a container use `var(--b-line-3)`.

## Section
```html
<section class="b-section">
  <div class="b-section-head"><span class="b-label">Optional eyebrow</span><h2 class="b-h2">Heading that says the point</h2><p class="b-small">Optional one-line framing.</p></div>
  <div class="b-prose"><p>…</p><ul><li>…</li></ul></div>
</section>
```

## Stats
```html
<div class="b-stats">
  <div class="b-stat"><span class="b-label">Up/Down notional, 10/14</span><span class="b-stat-v">$28.2M</span><span class="b-delta" data-dir="up">32% w/w</span></div>
  <div class="b-stat"><span class="b-label">Traders</span><span class="b-stat-v">75.4K</span><span class="b-delta">Context line, neutral</span></div>
</div>
```
Units inline at full size. 3–4 tiles. `data-dir="up|down"` makes the change green/red and the build adds a filled 12px caret, so don't add an icon. A large change beside a heading or big number takes `data-size="18"`. `.b-delta` also works inline in prose or tables.

## Plate (every chart, image or figure)
```html
<figure style="margin:0">
  <div class="b-plate">
    <div class="b-corners" aria-hidden="true">
      <span class="b-corner" data-corner="fig">Fig 1</span><span class="b-corner" data-corner="title">Title</span>
      <span class="b-corner" data-corner="hint">Source or hint</span><span class="b-corner" data-corner="readout">Live or last value</span>
    </div>
    <div class="b-chart-wrap"><svg class="b-chart" viewBox="0 0 640 240" role="img" aria-label="…">…</svg></div>
  </div>
  <figcaption class="b-caption"><strong>Lead.</strong> What to notice.</figcaption>
</figure>
```
Isometric figures: `<!--bench:figure NAME-->` in place of `.b-plate` (see SKILL.md). Charts: see `references/charts.md`.

## Linked stats and chart
Stats that describe the chart right below them share its box:
```html
<figure style="margin:0">
  <div class="b-linked">
    <div class="b-stats">…</div>
    <div class="b-plate">…corners… chart…</div>
  </div>
  <figcaption class="b-caption">…</figcaption>
</figure>
```

## Pair (two boxes side by side)
```html
<div class="b-pair">
  <div class="b-plate">…corners… <svg class="b-chart">…</svg><p class="b-plate-caption">Caption goes inside.</p></div>
  <div class="b-panel"><h3 class="b-h3">…</h3><ul>…</ul><span class="b-source">Source line, pinned to the bottom</span></div>
</div>
```
Both boxes are always the same height. If one would naturally be more than about 1.5× the other, stack them (or move text out of the box) instead of pairing.

## Table (Medusa-style)
```html
<div class="b-table-wrap"><table class="b-table">
  <thead><tr><th>Name</th><th data-num>Value</th></tr></thead>
  <tbody><tr><td data-strong>Row</td><td data-num>4,200</td></tr></tbody>
</table></div>
```
Long text cells: add `data-wrap` on `<table>` (rows grow, cells top-align, alternate rows get a faint stripe in place of row lines). Group rows: `<tr data-group><td colspan="4">Group name</td></tr>`. Status cell: `<td><div class="b-cell"><span class="b-chip" data-tone="warn">Partly known</span><span class="b-small">Detail…</span></div></td>`. Depth bars: `<div class="b-meter" data-tone="yes"><span style="width:40%"></span></div>`.

## Rows (numbered list with a trailing chip)
```html
<ol class="b-rows">
  <li class="b-row"><span class="b-row-n">1</span><div class="b-row-body"><h3 class="b-h3">Title</h3><p>Detail.</p></div><span class="b-chip" data-tone="yes">High</span></li>
<!-- the trailing chip is a level, so it takes a dot tone -->
</ol>
```

## Panels and options
```html
<div class="b-grid">
  <div class="b-panel"><span class="b-label">A</span><h3 class="b-h3">Option</h3><ul><li>…</li></ul></div>
  <div class="b-panel" data-selected><span class="b-panel-tag">Recommended</span><span class="b-label">B</span><h3 class="b-h3">Option</h3><ul><li>…</li></ul></div>
</div>
```
`data-selected` marks the one picked; `data-raised` lifts a panel without selecting it. A label for the whole card (Recommended, New, Current) is a `.b-panel-tag`: it sits centered on the top edge (`data-at="bottom"` for the bottom), outlined like the selected card, so the card's own label and heading keep their place. Never put that label inline as a chip.

## Media card (picture runs to the edges)
```html
<a class="b-panel b-media-card" href="https://…" target="_blank" rel="noopener">
  <span class="b-media" data-shape="tall"><img src="thumbs/id.jpg" alt="" loading="lazy"><span class="b-media-tag"><!--icon:media-play:12:fill-->60 s</span></span>
  <span class="b-media-body"><span class="b-h3">Title of the video</span><span class="b-small">Creator</span><span class="b-small">126M views</span></span>
</a>
```
The picture fills the card edge to edge and the card's corners clip it. Only `.b-media-body` is padded. `.b-media` is 16:9 unless `data-shape` says `tall` (9:16) or `square`. Never wrap the picture in its own padded box or give it a radius. Images come from the artifact's own files (publish them with `files`) or data URIs, since the artifact blocks images from other hosts.

## Quote (a message or draft as a specimen)
```html
<p class="b-quote">can you show a loading indicator…</p>      <!-- keeps line breaks; <s> inside marks a struck example -->
```

## Note
```html
<aside class="b-note" data-tone="info"><p><strong>Lead sentence.</strong> Detail.</p></aside>
```

## Chips, keys, details list, code
```html
<span class="b-chip" data-tone="yes">Green</span>  <span class="b-chip" data-plain>Tag</span>
<!-- level or status → always a dot tone: High yes, Medium warn, Low none. data-plain only for categories -->
<div class="b-keys"><span class="b-key"><i data-swatch></i>Polymarket US</span><span class="b-key"><i data-swatch="2"></i>Kalshi</span><span class="b-key"><i data-dash></i>Event</span></div>
<dl class="b-kv"><dt>Resolution</dt><dd>UMA</dd></dl>
<pre class="b-code">…</pre>   inline: <code>…</code>
```

## Status chips (progress)
```html
<span class="b-chip" data-status="check">Met</span>        <!-- todo · ongoing · progress · paused · check · canceled · aligned-intensified -->
<!--status:ongoing-->                                      <!-- the icon alone, inline with text -->
BENCH.status('progress', 'Partly done')                    // from a page script
```

## Figure numerals
```html
<span class="b-stat-v b-figure-num">$84,351.90</span>      <!-- only inside interactive figures and product recreations -->
```

## Vertical tabs (reference Q&A)
```html
<div class="b-vtabs">
  <div class="b-vtabs-list" role="tablist" aria-orientation="vertical" aria-label="Implementation questions">
    <button class="b-vtab" role="tab" id="q-1" aria-controls="p-1" aria-selected="true" type="button">What format is the stream?</button>
    <button class="b-vtab" role="tab" id="q-2" aria-controls="p-2" aria-selected="false" type="button">Who computes the TWAP?</button>
  </div>
  <div>
    <section class="b-vtab-panel" role="tabpanel" id="p-1" aria-labelledby="q-1"><h3 class="b-h2">Short answer.</h3><p>Context.</p><details class="b-details"><summary>Show detail</summary><div class="b-details-body">…</div></details></section>
    <section class="b-vtab-panel" role="tabpanel" id="p-2" aria-labelledby="q-2" hidden>…</section>
  </div>
</div>
```

## Choice list
```html
<div class="b-options" role="group" aria-label="Display rule">
  <button class="b-option" type="button" aria-pressed="true"><span class="b-key b-h3"><i data-series="1"></i>Option</span><p>What it does.</p></button>
  <button class="b-option" type="button" aria-pressed="false"><span class="b-panel-tag">Proposed</span>…</button>
</div>
```

## Icons
```html
<!--icon:copy-->              outline, 18 grid at 16px: body text, buttons, tabs
<!--icon:circle-info:12-->    outline, 12 grid: labels, chips, captions, table cells
<!--icon:check:12:fill-->     filled: states only
```
Size follows the text beside the icon (DESIGN.md › Icons). Beside a heading or stat value an 18-grid icon renders at 18px automatically.

## Controls
```html
<button class="b-btn" data-variant="solid" type="button">Primary</button>
<button class="b-btn" type="button"><!--icon:eye-->Secondary</button>
<button class="b-btn" data-variant="ghost" type="button">Ghost</button>
<div class="b-tabs" role="tablist" aria-label="…"><button class="b-tab" role="tab" aria-selected="true">One</button><button class="b-tab" role="tab" aria-selected="false">Two</button></div>
<div class="b-field"><label class="b-label" for="x">Label</label><input class="b-input" id="x"></div>
```

## Footer
```html
<footer class="b-footer"><span class="b-label">Sources</span><ol><li><a href="…">…</a></li></ol></footer>
```
