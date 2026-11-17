// Bench drift check. Run on the SOURCE page (before build) to catch anything that leaves the system.
//
//   node ~/.claude/skills/bench/scripts/check.mjs <page.src.html>
//
// Fails on: literal colors, font-family or font shorthands that don't use a --b- face, web-font links,
// border-radius values other than the radius tokens, uppercase text, container borders not using --b-ring, an eyebrow that doesn't end with the date, hand-placed up/down arrows, an undeclared page width, and a missing <title> or bench:css marker.
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: node check.mjs <page.src.html>"); process.exit(1); }
const html = readFileSync(file, "utf8");
const problems = [];
const lines = html.split("\n");
const scan = (re, msg, filter = () => true) => lines.forEach((l, i) => { for (const m of l.matchAll(re)) if (filter(m, l)) problems.push(`${i + 1}: ${msg}: ${m[0].trim().slice(0, 80)}`); });

if (!/<title>[^<]+<\/title>/.test(html)) problems.push("missing <title>");
if (!html.includes("<!--bench:css-->")) problems.push("missing <!--bench:css--> marker");
// every page declares its width on purpose: data-width="read" or "wide" on .b-page
const pageTag = html.match(/<main[^>]*class="b-page"[^>]*>/);
if (pageTag && !/data-width="(read|wide)"/.test(pageTag[0])) problems.push('declare the page width on <main class="b-page">: data-width="read" (memos, docs, explainers) or "wide" (tools, dashboards). See DESIGN.md, Width');
// the eyebrow always ends with the page date, written like "Oct 15, 2026"
const eyebrow = html.match(/<div class="b-eyebrow">([\s\S]*?)<\/div>/);
if (!eyebrow) problems.push("missing masthead eyebrow (.b-eyebrow)");
else {
  const items = [...eyebrow[1].matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => m[1].trim());
  const last = items[items.length - 1] || "";
  if (!/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}$/.test(last) && !/^\{\{.*\}\}$/.test(last))
    problems.push(`eyebrow must end with the date, like "Oct 15, 2026" (last item is "${last}")`);
}
// literal colors: only inside page CSS, i.e. <style> blocks and style="..." attributes
const lineOf = (idx) => html.slice(0, idx).split("\n").length;
const cssRegions = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>|style="([^"]*)"/g)].map((m) => ({ text: m[1] ?? m[2], at: m.index + m[0].indexOf(m[1] ?? m[2]) }));
for (const r of cssRegions) {
  for (const m of r.text.matchAll(/#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgb|rgba|hsl|hsla|oklch)\(/g))
    problems.push(`${lineOf(r.at + m.index)}: literal color, use a --b- token: ${m[0]}`);
}
scan(/font-family\s*:\s*(?!var\(--b-(?:sans|mono)\)|inherit)[^;"}]+/g, "font-family outside tokens");
scan(/fonts\.googleapis|@font-face/g, "new typeface, the system uses --b-sans and --b-mono only");
scan(/(?:box-shadow\s*:[^;"}]*?(?:inset\s+)?0 0 0 1(?:\.5)?px\s+var\(--b-line(?:-[23])?\)|border\s*:\s*1px solid var\(--b-line(?:-[23])?\))/g, "container or control ring, use var(--b-ring) (line tokens are for dividers)");
scan(/<!--icon:(?:arrow-(?:up|down)|caret-(?:up|down))[\w:-]*-->|[↑↓▲▼]/g, "write up/down changes as <span class=\"b-delta\" data-dir=\"up|down\">; the build adds the caret");
// mockups: no circled lead icons, one lit element per device, wires that point at real frames
scan(/class="bm-badge"/g, "lead icons are a filled icon on their own (.bm-lead-icon), never in a circle or ring");
for (const seg of html.split(/class="bm-(?:phone|browser)"/).slice(1)) {
  const body = seg.split(/class="bm-step-cap"|class="bm-(?:phone|browser)"/)[0];
  const n = (body.match(/data-focus/g) || []).length;
  if (n > 1) problems.push(`a mockup screen has ${n} lit elements (data-focus); light only the one the step is about`);
}
for (const m of html.matchAll(/data-wire="([^"]+)"/g)) for (const id of m[1].split(/\s+/)) if (!new RegExp(`id="${id}"`).test(html)) problems.push(`data-wire points at "${id}", which isn't an id on the page`);
scan(/text-transform\s*:\s*uppercase/g, "uppercase text, labels are sentence case");
scan(/border-radius\s*:\s*(?!0[;\s"}]|var\(--b-radius|50%)[^;"}]+/g, "radius outside tokens");

if (problems.length) { console.log(`✗ ${problems.length} drift issue(s) in ${file}\n` + problems.map((p) => "  " + p).join("\n")); process.exit(1); }
console.log(`✓ ${file} stays inside the bench system`);
