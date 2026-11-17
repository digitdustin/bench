// Bench behaviors v0.5, inlined by build.mjs into every page.
// Theme toggle: applies a saved choice before anything is measured, then follows the OS until the viewer picks.
(() => {
  const root = document.documentElement, toggle = document.querySelector(".b-theme");
  const mq = matchMedia("(prefers-color-scheme: dark)");
  let saved = null;
  try { saved = localStorage.getItem("bench-theme"); } catch {}
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  if (!toggle) return;
  const sync = () => {
    const current = root.dataset.theme || (mq.matches ? "dark" : "light");
    for (const b of toggle.querySelectorAll("[data-theme-choice]")) b.setAttribute("aria-selected", String(b.dataset.themeChoice === current));
    toggle.dispatchEvent(new Event("b-tabs:sync"));
  };
  toggle.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-choice]");
    if (!b) return;
    root.dataset.theme = b.dataset.themeChoice;
    try { localStorage.setItem("bench-theme", b.dataset.themeChoice); } catch {}
  });
  mq.addEventListener("change", () => { if (!root.dataset.theme) sync(); });
  sync();
})();

// Segmented control: one raised thumb that slides to the selected option. Arrow keys move the selection.
(() => {
  for (const group of document.querySelectorAll(".b-tabs")) {
    const thumb = document.createElement("span");
    thumb.className = "b-tabs-thumb";
    thumb.setAttribute("aria-hidden", "true");
    group.prepend(thumb);
    group.dataset.js = "";
    const tabs = () => [...group.querySelectorAll(".b-tab")];
    const place = (animate) => {
      const sel = group.querySelector('.b-tab[aria-selected="true"]') || tabs()[0];
      if (!sel) return;
      if (!animate) thumb.style.transition = "none";
      thumb.style.width = sel.offsetWidth + "px";
      thumb.style.transform = `translateX(${sel.offsetLeft}px)`;
      if (!animate) { thumb.getBoundingClientRect(); thumb.style.transition = ""; }
    };
    const select = (tab) => {
      for (const t of tabs()) { t.setAttribute("aria-selected", String(t === tab)); t.tabIndex = t === tab ? 0 : -1; }
      place(true);
    };
    group.addEventListener("b-tabs:sync", () => place(true));
    group.addEventListener("click", (e) => { const t = e.target.closest(".b-tab"); if (t && group.contains(t)) select(t); });
    group.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const list = tabs(), i = list.indexOf(document.activeElement);
      if (i < 0) return;
      const next = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
      next.focus(); next.click(); e.preventDefault();
    });
    for (const t of tabs()) t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
    place(false);
    new ResizeObserver(() => place(false)).observe(group);
    document.fonts?.ready.then(() => place(false));
  }
})();

// Details row: mark which edges are cut off so the fade only shows where there is more to scroll to.
(() => {
  for (const row of document.querySelectorAll(".b-meta")) {
    const mark = () => {
      const more = row.scrollWidth - row.clientWidth;
      if (more <= 1) { delete row.dataset.overflow; return; }
      const atStart = row.scrollLeft <= 1, atEnd = row.scrollLeft >= more - 1;
      row.dataset.overflow = atStart ? "start" : atEnd ? "end" : "both";
    };
    row.addEventListener("scroll", mark, { passive: true });
    new ResizeObserver(mark).observe(row);
    mark();
  }
})();

// Vertical tabs: one raised thumb slides to the chosen question; the matching panel shows. Arrow keys move.
(() => {
  for (const box of document.querySelectorAll(".b-vtabs")) {
    const list = box.querySelector(".b-vtabs-list");
    const tabs = [...list.querySelectorAll(".b-vtab")];
    const thumb = document.createElement("span");
    thumb.className = "b-vtabs-thumb"; thumb.setAttribute("aria-hidden", "true");
    list.prepend(thumb); list.dataset.js = "";
    const place = (animate) => {
      const sel = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
      if (!animate) thumb.style.transition = "none";
      thumb.style.height = sel.offsetHeight + "px";
      thumb.style.transform = `translateY(${sel.offsetTop}px)`;
      if (!animate) { thumb.getBoundingClientRect(); thumb.style.transition = ""; }
    };
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      }
      if (focus) tab.focus();
      place(true);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    select(tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0]);
    place(false);
    new ResizeObserver(() => place(false)).observe(list);
  }
})();
