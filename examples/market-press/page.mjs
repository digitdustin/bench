// Assembles the five figure fragments into one artifact page and one standalone check page.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { k, HERE, kitScript, latheScript } from "./common.mjs";

const NAMES = ["press", "spread", "decimal", "fee", "book"];
const frags = NAMES.map((n) => JSON.parse(readFileSync(join(HERE, "out", `${n}.json`), "utf8")));
const css = frags.map((f) => f.css).join("\n");
const body = frags.map((f) => f.plate).join("\n");
const script = kitScript() + latheScript() + frags.map((f) => f.shared).join("\n") + frags.map((f) => `{\n${f.live}\n}`).join("\n");
const INTRO = `<header class="mp-intro"><h1>How a Polymarket market works</h1><p>Five bench instruments, each built around one idea: the press that turns a dollar into a YES and a NO share, the gap between bid and ask, how fine the price ticks are, what a taker pays, and the book of resting orders itself. Every reading on them comes from the same small market model.</p></header>`;

const THEME_JS = `const wrap=document.querySelector(".iso");const root=document.documentElement;const prefers=matchMedia("(prefers-color-scheme: dark)");const apply=()=>{wrap.dataset.theme=root.dataset.theme||(prefers.matches?"dark":"light")};apply();prefers.addEventListener("change",apply);new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:["data-theme"]});`;
const PAGE_CSS = `*{box-sizing:border-box}.iso{min-height:100%;background:var(--anatomy-page);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;padding-block:40px 80px;padding-inline:16px}.iso-page{width:min(780px,100%);margin:0 auto}.mp-intro{margin:0 0 8px}.mp-intro h1{font:600 22px/1.3 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-strong);margin:0 0 8px;letter-spacing:-.01em}.mp-intro p{margin:0;max-width:62ch;color:var(--anatomy-text)}`;
const artifact = `<title>Market Press</title><style>${k.ISO_CSS}${css}\n${PAGE_CSS}</style><div class="iso" data-theme="light"><main class="iso-page">${INTRO}${body}</main></div><script>${THEME_JS}</script><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
writeFileSync(join(HERE, "artifact.html"), artifact);
for (const theme of ["dark", "light"]) {
  const page = k.pageHtml({ title: "Market press", theme, body: `<style>${css}${PAGE_CSS.replace(/\.iso\{[^}]*\}/, "")}</style>` + INTRO + body, script, width: 780 });
  writeFileSync(join(HERE, theme === "light" ? "all-light.html" : "all.html"), page);
}
console.log("wrote artifact.html", `${(artifact.length / 1024).toFixed(0)} KB`, "+ all.html, all-light.html");
