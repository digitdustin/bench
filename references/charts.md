# Charts in Bench

Charts are hand-drawn SVG inside a plate, styled only by `.b-chart` classes. No chart library, no inline colors.

## Series colors
Grey does hierarchy, so a chart has at most two series colors:
- **Primary series (us, the thing the page is about):** `.bar` / `.line` → `--b-strong`
- **Comparison series (competitor, baseline, prior period):** `.bar[data-series="2"]` → `--b-line-2`
- **Meaning, not identity:** `data-tone="yes|no"` only when the mark is good/bad news (a YES price, a loss).
- Partial periods (month to date): `.bar[data-partial]`, with the hatch pattern below in `<defs>`.

Legend: `.b-keys` with `<i data-swatch>` / `<i data-swatch="2">` / `<i data-dash>` (event marker).

## Classes
| Class | Mark |
|---|---|
| `.grid` | horizontal gridlines, one `<path>` |
| `.axis` | tick labels (11px sans, tabular) |
| `.line`, `.area`, `.dot` | line chart, area fill under it, emphasized endpoint |
| `.bar` | bars; `data-series="2"`, `data-tone`, `data-partial` |
| `.marker` | dashed vertical event line |
| `.note` | annotation text on the chart |
| `.value` | value label above a bar |

## Hatch pattern (for partial bars)
```html
<defs><pattern id="b-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect class="hatch-bg" width="6" height="6"/><line class="hatch-line" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>
```

## Rules
- One scale per axis; every tick label is a value the axis reaches. Leave room in the viewBox for the outermost labels.
- Y labels right-aligned at `x = left - 8`; x labels on `y = height - 6`. Label every 3rd–5th category on dense axes.
- Draw static SVG when data is fixed and small. Generate with a short inline script (the `el()` helper below) when there are 20+ points; set classes, never `fill`/`stroke` values.
- Wrap in `.b-chart-wrap` so wide charts scroll on phones instead of squashing (`min-width:520px`).
- Corner readout = the latest or headline value; caption says what to notice.

```js
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; };
const label = (parent, x, y, s, anchor = "middle", cls = "axis") => { const t = el("text", { x, y, "text-anchor": anchor, class: cls }, parent); t.textContent = s; return t; };
```
