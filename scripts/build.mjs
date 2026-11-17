// Bench page builder. Turns a source page into a publishable artifact file.
//
//   node ~/.claude/skills/bench/scripts/build.mjs <page.src.html> [out.html]
//
// Runs scripts/check.mjs first and stops on any drift.
//
// Markers the source may use:
//   <!--bench:css-->            required; replaced by tokens.css + bench.css, verbatim, in one <style>
//   <!--icon:NAME[:12|18][:fill]-->  a Nucleo UI icon; 18 grid and outline by default (see DESIGN.md › Icons).
//                               Missing icons are exported from the local Nucleo library on the fly.
//   .b-delta[data-dir=up|down]  gets a filled caret automatically (12 grid; 18 with data-size="18")
//   <!--bench:figure NAME-->    an anatomy figure fragment (out/NAME.json), with its CSS, the iso kit CSS,
//                               the theme bridge and its live script added once
//   <!--bench:connectors hex notion slack-->
//                               the Connectors field: one logo per MCP/connector the page drew on (name on hover).
//                               Place it as the LAST item inside <dl class="b-meta">. Slugs match
//                               assets/connectors/<slug>.(png|svg); names come from its manifest.json.
// Automatic:
//   - a light/dark toggle (pill segmented control, filled 12px Nucleo icons) fixed top right
//   - an Author field (avatar + name from assets/author.json) is added as the first item of every
//     <dl class="b-meta">; put data-no-author on the <dl> to leave it out
//   - src/bench.js (segmented control) is appended to every page
// Figure fragments are looked up in ./out next to the source first, then in examples/market-press/out.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(dirname(fileURLToPath(import.meta.url))); // skill root
const [src, outArg] = process.argv.slice(2);
if (!src) { console.error("usage: node build.mjs <page.src.html> [out.html]"); process.exit(1); }
const srcPath = resolve(src);
const out = resolve(outArg ?? (srcPath.endsWith(".src.html") ? srcPath.replace(/\.src\.html$/, ".html") : srcPath.replace(/\.html$/, ".out.html")));
try { execFileSync("node", [join(HERE, "scripts/check.mjs"), srcPath], { stdio: "inherit" }); } catch { process.exit(1); }
let html = readFileSync(srcPath, "utf8");
const notes = [];
const left = [...new Set(html.match(/\{\{[^}]{1,80}\}\}/g) || [])];
if (left.length && !srcPath.includes("/templates/")) { console.error(`✗ template placeholders left in the page: ${left.slice(0, 6).join(", ")}`); process.exit(1); }

// CSS
const css = readFileSync(join(HERE, "src/tokens.css"), "utf8") + "\n" + readFileSync(join(HERE, "src/bench.css"), "utf8");
if (!html.includes("<!--bench:css-->")) { console.error("source is missing <!--bench:css-->"); process.exit(1); }
// runtime icons for page scripts: window.BENCH.icon("caret-up") returns the filled 12px caret SVG
const rtIcons = {};
for (const n of ["caret-up", "caret-down"]) {
  const f = join(HERE, "icons", `${n}-12-fill.svg`);
  if (!existsSync(f)) execFileSync("python3", [join(HERE, "scripts/icons.py"), `${n}:12:fill`], { stdio: "inherit" });
  rtIcons[n] = readFileSync(f, "utf8").replace("<svg ", '<svg class="b-icon" data-size="12" data-fill ');
}
html = html.replace("<!--bench:css-->", `<style>\n${css}</style><script>window.BENCH={icons:${JSON.stringify(rtIcons)},icon:(n)=>window.BENCH.icons[n]||"",status:(n,l)=>'<i class="b-status" data-s="'+n+'" role="img" aria-label="'+(l||n)+'"></i>'};</script>`);

// theme toggle, top right of every page (put data-no-theme-toggle on <main> to leave it out)
if (!/data-no-theme-toggle/.test(html)) html = html.replace(/<main /, `<div class="b-tabs b-theme" data-shape="pill" role="tablist" aria-label="Color theme"><button class="b-tab" type="button" role="tab" data-icon-only data-theme-choice="light" aria-label="Light" title="Light" aria-selected="false"><!--icon:sun:12:fill--></button><button class="b-tab" type="button" role="tab" data-icon-only data-theme-choice="dark" aria-label="Dark" title="Dark" aria-selected="false"><!--icon:moon-stars:12:fill--></button></div>\n<main `);

// status icons (Polymarket Slack status reactions): <!--status:NAME--> and <span class="b-chip" data-status="NAME">
const STATUS = { todo: "Not started", ongoing: "Underway", progress: "Partly done", paused: "On hold", check: "Done", canceled: "Canceled", "aligned-intensified": "Aligned" };
html = html.replace(/(<span class="b-chip"[^>]*data-status="([\w-]+)"[^>]*>)/g, (m, open, n) => `${open}<!--status:${n}-->`);
const usedStatus = new Set([...html.replace(/<style>[\s\S]*?<\/style>/g, "").matchAll(/<!--status:([\w-]+)-->/g)].map((m) => m[1]));
if (/BENCH\.status\(/.test(html)) Object.keys(STATUS).forEach((n) => usedStatus.add(n));
for (const n of usedStatus) if (!STATUS[n]) { console.error(`✗ unknown status "${n}". Use one of: ${Object.keys(STATUS).join(", ")}`); process.exit(1); }
html = html.replace(/<!--status:([\w-]+)-->/g, (_, n) => `<i class="b-status" data-s="${n}" role="img" aria-label="${STATUS[n]}"></i>`);
if (usedStatus.size) {
  const SD = join(HERE, "assets/status");
  const uri = (f) => { const p = existsSync(join(SD, "48", f)) ? join(SD, "48", f) : join(SD, f); return `url(data:image/${f.endsWith(".gif") ? "gif" : "png"};base64,${readFileSync(p).toString("base64")})`; };
  let light = "", dark = "", rules = "";
  for (const n of usedStatus) {
    const v = `--b-st-${n}`;
    if (n === "todo") { light += `${v}:${uri("todo-light.png")};`; dark += `${v}:${uri("todo.png")};`; }
    else if (n === "canceled") { light += `${v}:${uri("canceled.png")};`; dark += `${v}:${uri("canceled-dark.png")};`; }
    else if (n === "aligned-intensified") { light += `${v}:${uri("aligned-intensified.gif")};--b-st-aligned-still:${uri("aligned-intensified-still.png")};`; }
    else light += `${v}:${uri(n + ".png")};`;
    rules += `.b-status[data-s="${n}"]{--b-st:var(${v})}`;
  }
  if (usedStatus.has("aligned-intensified")) rules += `@media (prefers-reduced-motion:reduce){.b-status[data-s="aligned-intensified"]{--b-st:var(--b-st-aligned-still)}}`;
  const statusCss = `:root{${light}}${dark ? `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark}}}:root[data-theme="dark"]{${dark}}` : ""}${rules}`;
  html = html.replace("</style>", statusCss + "</style>");
  notes.push(`status icons: ${[...usedStatus].join(", ")}`);
}

// figure numerals: load the condensed face only on pages that use it
if (/b-figure-num/.test(html.replace(/<style>[\s\S]*?<\/style>/, ""))) html = html.replace("<style>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,500..700&display=swap"><style>');

// change indicators: every .b-delta with data-dir="up|down" gets a filled Nucleo caret, sized to its text
html = html.replace(/(<span class="b-delta"[^>]*data-dir="(up|down)"[^>]*>)/g, (m, open, dir) => `${open}<!--icon:caret-${dir}:12:fill-->`);
html = html.replace(/(<span class="b-delta"[^>]*data-dir="(up|down)"[^>]*data-size="18"[^>]*>)<!--icon:caret-(up|down):12:fill-->/g, (m, open, dir) => `${open}<!--icon:caret-${dir}:18:fill-->`);

// icons: <!--icon:NAME[:12|18][:fill]-->
const ICON_RE = /<!--icon:([\w-]+)((?::(?:12|18|fill))*)-->/g;
const iconSpec = (name, opts) => { const o = opts.split(":").filter(Boolean); return { name, size: o.includes("12") ? "12" : "18", fill: o.includes("fill") }; };
const iconFile = ({ name, size, fill }) => join(HERE, "icons", `${name}${size === "12" ? "-12" : ""}${fill ? "-fill" : ""}.svg`);
const specs = [...html.matchAll(ICON_RE)].map((m) => iconSpec(m[1], m[2]));
const missing = [...new Set(specs.filter((sp) => !existsSync(iconFile(sp))).map((sp) => `${sp.name}:${sp.size}${sp.fill ? ":fill" : ""}`))];
if (missing.length) execFileSync("python3", [join(HERE, "scripts/icons.py"), ...missing], { stdio: "inherit" });
html = html.replace(ICON_RE, (_, n, o) => { const sp = iconSpec(n, o); return readFileSync(iconFile(sp), "utf8").replace("<svg ", `<svg class="b-icon"${sp.size === "12" ? ' data-size="12"' : ""}${sp.fill ? " data-fill" : ""} `); });
if (specs.length) notes.push(`icons: ${specs.length}`);

// author field
const authorCfg = JSON.parse(readFileSync(join(HERE, "assets/author.json"), "utf8"));
const avatarPath = ["jpg", "jpeg", "png", "webp"].map((e) => join(HERE, "assets", `avatar.${e}`)).find(existsSync);
const avatar = avatarPath
  ? `<img class="b-avatar" alt="" src="data:image/${extname(avatarPath).slice(1).replace("jpg", "jpeg")};base64,${readFileSync(avatarPath).toString("base64")}">`
  : `<span class="b-avatar" aria-hidden="true">${authorCfg.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>`;
const authorField = `<div><dt class="b-label">${authorCfg.label || "Author"}</dt><dd>${avatar}${authorCfg.name}</dd></div>`;
html = html.replace(/<dl class="b-meta"(?![^>]*data-no-author)([^>]*)>/g, (m) => m + authorField);
if (!avatarPath) notes.push("no avatar in assets/, using initials");

// connectors (logos copied from Spool's resources/mcp-logos)
const CONN = join(HERE, "assets/connectors");
const slugOf = (k) => k.replace(/^claude_ai_/, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
const manifest = JSON.parse(readFileSync(join(CONN, "manifest.json"), "utf8"));
const connMeta = {};
for (const [k, v] of Object.entries(manifest)) if (!k.startsWith("_")) { const sl = slugOf(k); if (!connMeta[sl] || /[A-Z]/.test(k)) connMeta[sl] = { name: k, mono: !!v.template }; }
const NAME_FIX = { claude_in_chrome: "Chrome", polymarket_github_mcp: "GitHub", s_p_global: "S&P Global", salesforce_beta: "Salesforce", dub_partners: "Dub", intuit_quickbooks: "QuickBooks", adobe_for_creativity: "Adobe", aws_marketplace: "AWS Marketplace", superhuman_mail: "Superhuman", customer_io: "Customer.io", otter_ai: "Otter" };
html = html.replace(/<!--bench:connectors ([\w\s-]+)-->/g, (_, list) => {
  const items = list.trim().split(/\s+/).map((raw) => {
    const sl = slugOf(raw);
    const file = ["png", "svg"].map((e) => join(CONN, `${sl}.${e}`)).find(existsSync);
    if (!file) { console.error(`✗ no connector logo "${raw}". Available: ${[...new Set(Object.keys(connMeta))].sort().join(" ")}`); process.exit(1); }
    const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
    const name = NAME_FIX[sl] || connMeta[sl]?.name || sl.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const mono = connMeta[sl]?.mono || ["github", "launchdarkly", "polymarket_github_mcp"].includes(sl);
    return `<span class="b-connector" title="${name}"><img class="b-logo"${mono ? " data-mono" : ""} alt="${name}" src="data:${mime};base64,${readFileSync(file).toString("base64")}"></span>`;
  });
  notes.push(`connectors: ${items.length}`);
  return `<div><dt class="b-label">Connectors</dt><dd class="b-connectors">${items.join("")}</dd></div>`;
});

// anatomy figures
const figs = [...html.matchAll(/<!--bench:figure ([\w-]+)-->/g)].map((m) => m[1]);
let figScript = "";
if (figs.length) {
  const { k, kitScript, latheScript } = await import(join(HERE, "examples/market-press/common.mjs"));
  const find = (n) => [join(dirname(srcPath), "out", `${n}.json`), join(HERE, "examples/market-press/out", `${n}.json`)].find(existsSync);
  const frags = figs.map((n) => {
    const p = find(n);
    if (!p) { console.error(`figure "${n}" not found`); process.exit(1); }
    return { n, ...JSON.parse(readFileSync(p, "utf8")) };
  });
  for (const f of frags) html = html.replace(`<!--bench:figure ${f.n}-->`, `<div class="iso" data-theme="light">${f.plate}</div>`);
  // The iso kit keys its palette off .iso[data-theme]; mirror the page theme onto every figure wrapper.
  const bridge = `const prefers=matchMedia("(prefers-color-scheme: dark)");const sync=()=>{const t=document.documentElement.dataset.theme||(prefers.matches?"dark":"light");document.querySelectorAll(".iso").forEach((w)=>w.dataset.theme=t)};sync();prefers.addEventListener("change",sync);new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});`;
  // Figure plates follow bench plate styling: rounded frame, sentence-case sans corners, mono readout.
  const isoBridgeCss = `.iso .iso-plate{background:var(--anatomy-card);border-radius:var(--b-radius-lg);box-shadow:0 0 0 1px var(--b-line-2);overflow:hidden}.iso .iso-plate-corner{font:500 var(--b-label)/1 var(--b-sans);text-transform:none;letter-spacing:0}.iso .iso-plate-corner[data-corner="readout"]{font:11.5px/1 var(--b-mono);font-variant-numeric:tabular-nums}.iso .iso-figure{margin:0}`;
  const shared = [...new Set(frags.map((f) => f.shared))].join("\n");
  const script = kitScript() + latheScript() + shared + frags.map((f) => `{\n${f.live}\n}`).join("\n");
  html = html.replace("</style>", `${k.ISO_CSS}${frags.map((f) => f.css).join("\n")}${isoBridgeCss}</style>`);
  figScript = `<script>${bridge}</script><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
  notes.push(`figures: ${figs.join(", ")}`);
}

// mockup kit: only on pages that draw devices or diagrams
const usesMockups = /class="bm-/.test(html);
if (usesMockups) { html = html.replace("</style>", readFileSync(join(HERE, "src/mockups.css"), "utf8") + "</style>"); notes.push("mockups"); }
html += `<script>${readFileSync(join(HERE, "src/bench.js"), "utf8")}</script>` + (usesMockups ? `<script>${readFileSync(join(HERE, "src/mockups.js"), "utf8")}</script>` : "") + figScript;
writeFileSync(out, html);
console.log(`wrote ${basename(out)}  ${(html.length / 1024).toFixed(0)} KB${notes.length ? "  " + notes.join(" · ") : ""}`);
