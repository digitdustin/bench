# Mockup kit (2D, web and mobile)

Low-fidelity product mockups and system diagrams. Classes start with `bm-`; the build adds `src/mockups.css` and `src/mockups.js` only when a page uses them. Copy the full patterns from `examples/suggest-feature/suggest-feature.src.html`.

## A flow, in a plate
```html
<figure style="margin:0"><div class="b-plate">
  <div class="b-corners" aria-hidden="true"><span class="b-corner" data-corner="fig">Fig 1</span><span class="b-corner" data-corner="title">iOS and Android</span><span class="b-corner" data-corner="hint">Low-fidelity, for flow and placement</span><span class="b-corner" data-corner="readout">3 steps</span></div>
  <div class="bm-flow">                                  <!-- data-gap="tight" for browsers or options -->
    <div class="bm-step">
      <div class="bm-phone" id="s1"><div class="bm-screen">…</div></div>
      <div class="bm-step-cap"><span class="b-label">Step 1</span><strong>Entry</strong><span>Detail, with <code>names</code>.</span></div>
    </div>
    …
  </div>
</div></figure>
```

## Phone screen parts
```html
<div class="bm-status"><span>9:41</span><span class="bm-island"></span><span class="bm-battery"></span></div>
<div class="bm-nav"><!--icon:chevron-left:12-->Settings<span class="bm-end"><!--icon:xmark:12--></span></div>
<div class="bm-section">Support</div>
<div class="bm-group">
  <div class="bm-row"><span class="bm-skel" data-w="m"></span><!--icon:chevron-right:12--></div>       <!-- text that doesn't matter -->
  <div class="bm-row" data-focus data-wire="s2"><span>Suggest a feature</span><!--icon:chevron-right:12--><span class="bm-tap"></span></div>
</div>
<div class="bm-scrim"></div><div class="bm-sheet"><div class="bm-grab"></div><div class="bm-head">…</div><div class="bm-form">…</div></div>
<div class="bm-field"><span>Title</span><div class="bm-input">Real text</div></div>   <div class="bm-input" data-multiline>…</div>
<div class="bm-actions"><div class="bm-btn">Update</div><div class="bm-btn">Not now</div></div>   <!-- pinned to the bottom; the second becomes a ghost automatically -->
<div class="bm-done"><span class="bm-lead-icon"><!--icon:circle-check:fill--></span><span class="bm-title">Thanks</span><span class="bm-fine">…</span></div>   <!-- filled icon alone, no circle -->
<div class="bm-banner">…</div>  <div class="bm-list"><div><span><strong>Lead.</strong> Rest.</span></div></div>  <div class="bm-media"></div> (image placeholder)
```

## Browser
```html
<div class="bm-browser" id="w1">                         <!-- data-size="wide" for 620px -->
  <div class="bm-chrome"><i></i><i></i><i></i><span class="bm-url"><!--icon:lock:12:fill-->polymarket.us</span></div>
  <div class="bm-viewport">
    <div class="bm-topbar"><span class="bm-logo">Polymarket</span><div><span class="bm-pill">$1,240.18</span><span class="bm-avatar"></span></div></div>
    <div class="bm-tiles"><div class="bm-tile"><span class="bm-skel" data-w="l"></span></div>…</div>
    <div class="bm-menu"><div>Item</div><hr><div data-focus data-wire="w2">New item<span class="bm-tap"></span></div></div>
    <div class="bm-scrim"></div><div class="bm-modal">…</div>       <!-- data-size="wide": text left, art right · data-layout="split": title + subtitle left (.bm-intro), form right, close in .bm-close -->
  </div>
</div>
```

## System diagram
```html
<div class="bm-diagram" style="grid-template-columns:200px 220px 200px 1fr">   <!-- layout in page CSS -->
  <div class="bm-node" data-wire="api"><strong>App, Settings row</strong><span>How it connects</span></div>
  <div class="bm-node" id="api" data-lit data-wire="vendor"><strong>POST /api/feedback</strong><code>userId · version</code></div>
  <div class="bm-node" id="vendor" data-dashed><strong>Slack</strong></div>
</div>
```
`data-lit` outlines what we build; `data-dashed` marks third-party pieces. Group labels go in a `.bm-cluster` with a `.b-label`.

## Rules
- One `data-focus` per screen, on the element the step is about. Add `.bm-tap` when the step is a tap.
- Real words only where the flow needs them; `.bm-skel` (data-w s, m, l, full) everywhere else.
- `data-wire` goes on the tapped element and names the next frame's id. Options that aren't a sequence get no wires.
- 2–4 screens per plate. App and web flows in separate plates.
- Buttons: 26px; in a stack the first is filled and the rest are ghosts. A lit button has no outline.
- Lead icons: filled, alone, 26px. Never a circled icon.
- Rows in a `.bm-group` are split by gaps in the screen color, never darker lines.
- Every sheet or screen with a primary action puts it in `.bm-actions` (pinned to the bottom), with any fine print after the button. Fields go in `.bm-form` above it.
- Message screens (`.bm-done`) center between header and actions. Never pad them down by hand.
- Figures never scroll: flows wrap, diagrams restack.
