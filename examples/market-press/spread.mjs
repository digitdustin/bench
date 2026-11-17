import { k, G, A, fixedProjection, rig, writeFigure, W, STAGE_CSS } from "./common.mjs";

const H = 300;
const PLATE = { x: -30, y: -34, w: 238, d: 66, r: 7 };
const LO = 40; // the strip reads 40¢ to 80¢
const UPC = 4.25; // world units per cent
const X = (c) => (c - LO) * UPC;
const BEAM = { x: -22, y: -3, w: 214, d: 6, r: 1, z0: 8, h: 6 };
const HEAD = { w: 4, topZ: 14, plateH: 3.5, towerTop: 27, rodZ: 23, rodR: 1.5, spacer: 0.25 };
const REST = { bid: 58, ask: 60 };
const MAX_SPREAD = 30;

const P = fixedProjection([...k.boxCorners(PLATE, -17, 0), [X(60), 0, HEAD.towerTop + 2]], W, H);
const R = A.recorder(P);
const { at, S, Ln, Dots, Faded, byDepth, UPF, record, put, slab, disc, ringBand } = rig(P, R);

const STRIP = { x: -3, y: 18, w: 176, d: 7, r: 1 };
const back = rig(P, R).basePlate(PLATE, { strip: STRIP, ticks: { from: 0, to: 170, step: UPC, every: 5, zero: X(60) }, label: { x: 146, y: -30, w: 26, d: 10, r: 1.2 } });

// supports: two cradles the beam rests in
for (const xs of [-14, 176]) {
  const base = { x: xs - 5, y: -8, w: 10, d: 16, r: 1.2 };
  slab(`support.${xs < 0 ? "left" : "right"}.base`, base, 0, BEAM.z0, { tone: "mid" }, { steps: 3, bevel: 0.5 });
  for (const y of [-8, 3]) slab(`support.${xs < 0 ? "left" : "right"}.wall`, { x: xs - 5, y, w: 10, d: 5, r: 0.8 }, BEAM.z0, 5, { tone: "mid" }, { steps: 2, extra: Dots([at([xs, y + 2.5, BEAM.z0 + 5])], { size: 0.45 }) });
}
slab("beam", BEAM, BEAM.z0, BEAM.h, { tone: "mid" }, { steps: 3, bevel: 0.5, inner: Ln(k.sideSeam(BEAM, BEAM.z0 + 1.2, P, 3), { tone: "faint" }) });
for (const [x, sign] of [[BEAM.x, -1], [BEAM.x + BEAM.w, 1]]) disc(`beam.cap.${sign < 0 ? "left" : "right"}`, G.frameAlong([x, 0, BEAM.z0 + BEAM.h / 2], [sign, 0, 0]), 0, 3, 4, { tone: "mid" }, { bevel: 0.4 });

// a head: two cheeks astride the beam, a top plate, a tower that carries the rod or its bore, a clamp screw and a pointer blade
function head(side) {
  const xh = X(REST[side]);
  const parts = [];
  const shapes = [];
  const backParts = [];
  const backShapes = [];
  const local = (plan) => ({ ...plan, x: plan.x + xh });
  const cheek = (y) => ({ x: -HEAD.w / 2, y, w: HEAD.w, d: 4, r: 0.5 });
  for (const y of [-7, 3]) {
    (y < 0 ? backParts : parts).push(S(k.slabOf(cheek(y), 5, HEAD.topZ - 5, P, 2, 0.3), { tone: "hi", crease: "lo" }));
    (y < 0 ? backShapes : shapes).push(A.slab(local(cheek(y)), 5, HEAD.topZ - 5, { name: `head.${side}.cheek` }, 2));
  }
  const top = { x: -HEAD.w / 2, y: -7, w: HEAD.w, d: 14, r: 0.5 };
  parts.push(S(k.slabOf(top, HEAD.topZ, HEAD.plateH, P, 2, 0.4), { tone: "hi", crease: "lo" }));
  shapes.push(A.slab(local(top), HEAD.topZ, HEAD.plateH, { name: `head.${side}.plate` }, 2));
  const tower = { x: -HEAD.w / 2, y: -2.5, w: HEAD.w, d: 5, r: 0.5 };
  const towerZ = HEAD.topZ + HEAD.plateH;
  const bore = side === "ask" ? Ln(G.circleOf(G.frameAlong([-HEAD.w / 2 - 0.02, 0, HEAD.rodZ], [-1, 0, 0]), 0, HEAD.rodR + 0.35, P, 20) + G.circleOf(G.frameAlong([-HEAD.w / 2 - 0.02, 0, HEAD.rodZ], [-1, 0, 0]), 0, 2.05, P, 24), { tone: "faint" }) : "";
  parts.push(S(k.slabOf(tower, towerZ, HEAD.towerTop - towerZ, P, 2, 0.4), { tone: "hi", crease: "lo" }) + bore + Dots([at([0, 0, HEAD.towerTop])], { size: 0.45 }));
  shapes.push(A.slab(local(tower), towerZ, HEAD.towerTop - towerZ, { name: `head.${side}.tower` }, 2));
  // clamp screw into the front cheek
  const SF = G.frameAlong([0, 7, 9.5], [0, 1, 0]);
  parts.push(S(G.disc(0, 1.2, 1.1, SF, P, { steps: 16 }), { tone: "mid" }) + S(G.disc(1.2, 4.4, 1.8, SF, P, { steps: 20 }), { tone: "mid" }) + Faded(G.ribsOf(SF, 1.2, 4.4, 1.8, 16, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
  shapes.push(A.disc(G.frameAlong([xh, 7, 9.5], [0, 1, 0]), 0, 4.4, 1.8, { name: `head.${side}.screw` }));
  // pointer needle from the front cheek to the ruler's edge
  const NF = G.frameAlong([0, 7, 6], [0, 1, 0]);
  parts.push(S(G.disc(0, 12.4, 0.45, NF, P, { steps: 12 }), { tone: "hi", crease: "none" }));
  shapes.push(A.disc(G.frameAlong([xh, 7, 6], [0, 1, 0]), 0, 12.4, 0.45, { name: `head.${side}.needle` }));
  if (side === "bid") {
    // the spacer: one tick thick, the closest the heads can ever come
    const SPF = G.frameAlong([HEAD.w / 2, 0, HEAD.rodZ], [1, 0, 0]);
    parts.push(S(G.disc(0, HEAD.spacer, 2.2, SPF, P, { steps: 24 }), { tone: "lo" }));
    shapes.push(A.disc(G.frameAlong([xh + HEAD.w / 2, 0, HEAD.rodZ], [1, 0, 0]), 0, HEAD.spacer, 2.2, { name: "spacer" }));
  }
  return { xh, parts, shapes, backParts, backShapes };
}
const bid = head("bid");
const ask = head("ask");
for (const h of [bid, ask]) {
  const side = h === bid ? "bid" : "ask";
  put(`head.${side}.back`, [h.xh, -5, 9], `<g data-part="sp-${side}-back" transform="${k.translateAlong(P, [h.xh, 0, 0])}">${h.backParts.join("")}</g>`, h.backShapes.map(record), { bias: -0.2 });
}
{
  // the rod: fixed to the bid tower, sliding into the ask tower's bore; drawn with the ask head so its gland stays put
  const glandX = ask.xh - HEAD.w / 2;
  const F = G.frameAlong([glandX, 0, HEAD.rodZ], [-1, 0, 0]);
  const to = glandX - (bid.xh + HEAD.w / 2 + HEAD.spacer);
  const rod = G.rodOut(F, 0, to, HEAD.rodR, P, { stroke: MAX_SPREAD * UPC, steps: 16 });
  const rodSvg = `<g data-part="sp-rod"><clipPath id="sp-rod"><path data-hold d="${rod.clip}"/></clipPath><g clip-path="url(#sp-rod)">${S(rod.paths, { tone: "hi", lit: true, crease: "none" })}</g></g>`;
  const coil = k.coil(bid.xh + HEAD.w / 2 + HEAD.spacer, glandX, [0, HEAD.rodZ], 1.9, Math.max(1, to / 1.4), "x", P);
  const svg = `${rodSvg}<g data-part="sp-coil-front">${Ln(coil.front, { tone: "mid" })}</g><g data-part="sp-ask" transform="${k.translateAlong(P, [ask.xh, 0, 0])}">${ask.parts.join("")}</g>`; // the rod sits in world space; only the ask group is translated
  put("head.bid", [bid.xh, 0, 14], `<g data-part="sp-bid" transform="${k.translateAlong(P, [bid.xh, 0, 0])}">${bid.parts.join("")}</g><g data-part="sp-coil-back">${Ln(coil.back, { tone: "lo" })}</g>`, bid.shapes.map(record), { bias: 0.2 });
  put("head.ask", [ask.xh, 0, 14], svg, [...ask.shapes.map(record), record(A.slide(F, 0, to, HEAD.rodR, { name: "rod" }))], { bias: 0.3 });
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const svg = k.figureSvg({
  width: W,
  height: H,
  label: "A beam gauge on a base plate: a bar in two cradles with a sliding head for the best bid and one for the best ask, pointer blades reading a ruler from 40 to 80 cents, a rod from the bid head sliding into the ask head with a spring around it, and a one-tick spacer that stops the heads touching.",
  body: [back, `<g class="mp-rig">${R.items.map((it) => `<g class="it" data-name="${it.name}">${it.svg}</g>`).join("")}</g>`],
});

const DATA = { P, X: { lo: LO, upc: UPC }, rest: REST, head: HEAD, max: MAX_SPREAD, railX: [at([X(LO), 0, 10])[0], at([X(80), 0, 10])[0]] };
const LIVE = `
const D = ${JSON.stringify(DATA)};
const P = D.P;
const ROOT = document.getElementById("fig-spread");
const stage = ROOT.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = ROOT.querySelector("[data-readout]");
const status = ROOT.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const el = { bid: svg.querySelector('[data-part="sp-bid"]'), ask: svg.querySelector('[data-part="sp-ask"]'), bidBack: svg.querySelector('[data-part="sp-bid-back"]'), askBack: svg.querySelector('[data-part="sp-ask-back"]'), rod: svg.querySelector('[data-part="sp-rod"]'), back: svg.querySelector('[data-part="sp-coil-back"]'), front: svg.querySelector('[data-part="sp-coil-front"]') };
const X = (c) => (c - D.X.lo) * D.X.upc;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const follow = (x, t, dt, tau, calm) => (calm || Math.abs(t - x) < 1e-3 ? t : x + (t - x) * (1 - Math.exp(-dt / tau)));
const state = { bid: D.rest.bid, ask: D.rest.ask, bx: X(D.rest.bid), ax: X(D.rest.ask), clock: 0 };
let shown = "";
function draw() {
  const key = state.bx.toFixed(2) + "/" + state.ax.toFixed(2);
  if (key === shown) return;
  shown = key;
  const dbx = state.bx - X(D.rest.bid);
  const dax = state.ax - X(D.rest.ask);
  el.bid.setAttribute("transform", translateAlong(P, [state.bx, 0, 0]));
  el.bidBack.setAttribute("transform", translateAlong(P, [state.bx, 0, 0]));
  el.ask.setAttribute("transform", translateAlong(P, [state.ax, 0, 0]));
  el.askBack.setAttribute("transform", translateAlong(P, [state.ax, 0, 0]));
  const [rx, ry] = axisVector(P, [dbx, 0, 0]);
  el.rod.setAttribute("transform", (rx || ry) ? "translate(" + rx.toFixed(2) + " " + ry.toFixed(2) + ")" : "");
  const [gx, gy] = axisVector(P, [dax, 0, 0]);
  el.rod.querySelector("[data-hold]").setAttribute("transform", (gx - rx || gy - ry) ? "translate(" + (gx - rx).toFixed(2) + " " + (gy - ry).toFixed(2) + ")" : "");
  const from = state.bx + D.head.w / 2 + D.head.spacer;
  const to = state.ax - D.head.w / 2;
  const coil = coilOf(from, to, [0, D.head.rodZ], 1.9, Math.max(1, (to - from) / 1.4), "x", P);
  el.back.innerHTML = lineSvg(coil.back, { tone: "lo" });
  el.front.innerHTML = lineSvg(coil.front, { tone: "mid" });
}
const coilOf = coil;
function say() {
  const spread = state.ask - state.bid;
  const text = "bid " + state.bid + "¢ · ask " + state.ask + "¢ · spread " + spread + "¢ · mid " + ((state.bid + state.ask) / 2).toFixed(1);
  if (readout.textContent !== text) readout.textContent = text;
}
function setQuote(bid, ask) {
  bid = clamp(Math.round(bid), D.X.lo, 79);
  ask = clamp(Math.round(ask), bid + 1, 80);
  ask = Math.min(ask, bid + D.max);
  state.bid = bid;
  state.ask = ask;
  say();
  run();
}
const TOUR = [[0.6, () => setQuote(55, 65)], [3.4, () => setQuote(57, 62)], [5.6, () => setQuote(58, 60)], [7.8, () => setQuote(59, 60)], [10.5, () => setQuote(59, 70)], [13, () => setQuote(58, 60)], [15.5, null]];
let touring = !still.matches, tourClock = 0, tourIndex = 0, idle = 0;
function tourStep(dt) {
  tourClock += dt;
  while (tourIndex < TOUR.length && tourClock >= TOUR[tourIndex][0]) {
    const action = TOUR[tourIndex][1];
    tourIndex++;
    if (action) action(); else { tourClock = 0; tourIndex = 0; }
  }
}
function takeOver() { touring = false; clearTimeout(idle); idle = setTimeout(() => { if (still.matches) return; touring = true; tourClock = 0; tourIndex = 0; run(); }, 8000); }
let frame = 0, last = 0, visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) tourStep(dt);
  const tb = X(state.bid), ta = X(state.ask);
  state.bx = follow(state.bx, tb, dt, 0.3, calm);
  state.ax = follow(state.ax, ta, dt, 0.3, calm);
  draw();
  const alive = touring || state.bx !== tb || state.ax !== ta;
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const centsAt = (event) => {
  const box = svg.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * 600;
  return D.X.lo + ((px - D.railX[0]) / (D.railX[1] - D.railX[0])) * (80 - D.X.lo);
};
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "touch") return; takeOver(); setQuote(state.bid, Math.max(state.bid + 1, centsAt(event))); });
stage.addEventListener("pointerdown", (event) => { takeOver(); setQuote(state.bid, Math.max(state.bid + 1, centsAt(event))); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const step = event.shiftKey ? 5 : 1;
  const k = event.key;
  if (k === "ArrowRight") (event.preventDefault(), takeOver(), setQuote(state.bid + step, Math.max(state.ask, state.bid + step + 1)));
  else if (k === "ArrowLeft") (event.preventDefault(), takeOver(), setQuote(state.bid - step, state.ask));
  else if (k === "ArrowUp" || k === "]") (event.preventDefault(), takeOver(), setQuote(state.bid, state.ask + step));
  else if (k === "ArrowDown" || k === "[") (event.preventDefault(), takeOver(), setQuote(state.bid, state.ask - step));
});
say();
draw();
`;
const plate = k.plateHtml({
  fig: "Fig 2",
  title: "Spread gauge",
  hint: "Hover: ask · ← → bid · ↑ ↓ ask",
  readout: `bid ${REST.bid}¢ · ask ${REST.ask}¢ · spread ${REST.ask - REST.bid}¢ · mid ${((REST.bid + REST.ask) / 2).toFixed(1)}`,
  keys: [
    { mark: "lit", label: "The rod: how far the ask head stands off the bid head, in cents" },
    { mark: "raised", label: "Bid head and ask head, each reading the ruler through its blade" },
  ],
  caption:
    "The spread is the gap between the best bid and the best ask, read on the ruler in cents. It is what a taker pays to trade now: buy at the ask, sell at the bid, and you are out the spread. Makers compete to close the gap, like the spring, but the spacer on the bid head is one tick thick, so the spread can never be less than a tick (1¢ here). A wide spread means a thin market; the mid, halfway between the heads, is the price people quote.",
  body: `<div class="iso-stage sp-stage" tabindex="0" role="group" aria-label="Spread gauge. Move the pointer to set the ask; left and right arrows move the bid, up and down move the ask.">${svg}<span class="mp-sr" role="status" aria-live="polite" data-status></span></div>`,
});
writeFigure({ id: "fig-spread", name: "spread", plate, css: STAGE_CSS("sp-stage"), live: LIVE, title: "Spread gauge" });
console.log("wrote spread.html", `${R.items.length} items`);
A.auditOrExit(R, P, {});
