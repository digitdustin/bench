// Bench mockup wires: any element with data-wire="id other-id" gets a wire to each target, drawn in an SVG
// laid over its nearest .bm-flow or .bm-diagram. Horizontal when the target sits to the side, vertical when
// it sits above or below. A wire starts on the source element's edge and lands on the target's edge.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  for (const box of document.querySelectorAll(".bm-flow,.bm-diagram")) {
    const svg = mk("svg", { class: "bm-wires", "aria-hidden": "true" });
    box.prepend(svg);
    const draw = () => {
      svg.replaceChildren();
      const b = box.getBoundingClientRect(), sx = box.scrollLeft - b.left, sy = box.scrollTop - b.top;
      svg.setAttribute("width", box.clientWidth); svg.setAttribute("height", box.clientHeight);
      for (const src of box.querySelectorAll("[data-wire]")) {
        for (const id of src.dataset.wire.split(/\s+/)) {
          const tgt = document.getElementById(id); if (!tgt) continue;
          const s = src.getBoundingClientRect(), t = tgt.getBoundingClientRect();
          const S = { l: s.left + sx, r: s.right + sx, t: s.top + sy, b: s.bottom + sy }, T = { l: t.left + sx, r: t.right + sx, t: t.top + sy, b: t.bottom + sy };
          let x1, y1, x2, y2, horiz = true;
          if (T.l >= S.r - 2) { x1 = S.r; x2 = T.l; }
          else if (T.r <= S.l + 2) { x1 = S.l; x2 = T.r; }
          else horiz = false;
          // a flow that has wrapped onto stacked rows: a vertical wire would cut through the rest of the screen
          // and the step caption, so the step labels carry the order instead
          if (!horiz && src.closest(".bm-step") && tgt.matches(".bm-phone,.bm-browser")) continue;
          if (horiz) {
            y1 = (S.t + S.b) / 2;
            y2 = Math.min(Math.max(y1, T.t + 28), T.b - 28);
            if (T.b - T.t < 60) y2 = (T.t + T.b) / 2;
          } else {
            x1 = (S.l + S.r) / 2; x2 = Math.min(Math.max(x1, T.l + 20), T.r - 20);
            if (T.t >= S.b - 2) { y1 = S.b; y2 = T.t; } else { y1 = S.t; y2 = T.b; }
          }
          const dx = (x2 - x1) * 0.5, dy = (y2 - y1) * 0.5;
          const d = horiz ? `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2 - Math.sign(x2 - x1) * 5} ${y2}`
                          : `M${x1} ${y1}C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2 - Math.sign(y2 - y1) * 5}`;
          svg.append(mk("path", { class: "bm-wire", d }));
          svg.append(mk("circle", { class: "bm-wire-start", cx: x1, cy: y1, r: 2.5 }));
          const a = horiz ? (x2 > x1 ? 0 : 180) : (y2 > y1 ? 90 : -90);
          svg.append(mk("path", { class: "bm-wire-head", d: "M0 -3.5L6 0L0 3.5Z", transform: `translate(${x2 - (horiz ? Math.sign(x2 - x1) * 6 : 0)} ${y2 - (horiz ? 0 : Math.sign(y2 - y1) * 6)}) rotate(${a})` }));
        }
      }
    };
    new ResizeObserver(draw).observe(box);
    document.fonts?.ready.then(draw);
    draw();
  }
})();
