import { k, G, A, fixedProjection, rig, writeFigure, W, STAGE_CSS } from "./common.mjs";

const H = 320;
const PLATE = { x: -44, y: -48, w: 148, d: 96, r: 7 };
const AX = { x: 22, z: 26 }; // the shaft runs along y through this point
const SHAFT_R = 2.2;
const WHEEL_R = 21;
const COARSE = { y0: -15, y1: -10, teeth: 100 };
const FINE = { y0: -3, y1: 2, teeth: 1000 };
const BLOCKS = [[-34, -26], [20, 28]]; // pillow blocks: y ranges
const DIAL = { y: 35.6, r: 19, t: 1.2 };
const CRANK = { y: -40, len: 13 };
const PAWL = { pivot: [-10, 52], tip: [AX.x, AX.z + WHEEL_R + 1.0], rest: (COARSE.y0 + COARSE.y1) / 2, fine: (FINE.y0 + FINE.y1) / 2 };
const PRICE0 = 58;

const P = fixedProjection([...k.boxCorners(PLATE, -17, 0), [AX.x + WHEEL_R, DIAL.y + DIAL.t, AX.z + WHEEL_R], [PAWL.pivot[0], -20, PAWL.pivot[1] + 4]], W, H);
const R = A.recorder(P);
const { at, S, Ln, Dots, Faded, UPF, record, put, slab, disc, prism, ball } = rig(P, R);
const back = rig(P, R).basePlate(PLATE, { label: { x: 70, y: 32, w: 26, d: 10, r: 1.2 } });
const SF = (y) => G.frameAlong([AX.x, y, AX.z], [0, 1, 0]);

// pillow blocks with bolted caps
for (const [y0, y1] of BLOCKS) {
  const n = y0 < 0 ? "back" : "front";
  slab(`block.${n}.base`, { x: AX.x - 9, y: y0, w: 18, d: y1 - y0, r: 1.2 }, 0, AX.z - 5, { tone: "mid" }, { steps: 3, bevel: 0.5, inner: Ln(k.sideSeam({ x: AX.x - 9, y: y0, w: 18, d: y1 - y0, r: 1.2 }, AX.z - 5 - 0.01, P, 3), { tone: "faint" }) });
  slab(`block.${n}.cap`, { x: AX.x - 9, y: y0, w: 18, d: y1 - y0, r: 1.2 }, AX.z - 5, 11, { tone: "mid" }, { steps: 3, bevel: 0.5, extra: Dots([at([AX.x - 6, (y0 + y1) / 2, AX.z + 6]), at([AX.x + 6, (y0 + y1) / 2, AX.z + 6])], { size: 0.5 }) });
}
// shaft in segments around the blocks and wheels
const SEGS = [[CRANK.y + 1.5, BLOCKS[0][0]], [BLOCKS[0][1], COARSE.y0 - 2.5], [COARSE.y1 + 2.5, FINE.y0 - 2.5], [FINE.y1 + 2.5, BLOCKS[1][0]], [BLOCKS[1][1], DIAL.y - 0.02]];
for (const [y0, y1] of SEGS) disc(`shaft`, SF(y0), 0, y1 - y0, SHAFT_R, { tone: "mid" }, { steps: 20 });
// the ratchet wheels: 100 teeth and 1,000 teeth, each with a hub
function wheel(name, w, ribs, alpha) {
  const F = SF(w.y0);
  const len = w.y1 - w.y0;
  disc(`${name}.hub.back`, SF(w.y0 - 2.5), 0, 2.5, 5, { tone: "lo" }, { steps: 24 });
  disc(`${name}.hub.front`, SF(w.y1), 0, 2.5, 5, { tone: "lo" }, { steps: 24 });
  const teeth = G.ribsOf(F, 0, len, WHEEL_R, ribs, P, { fade: [0.08, 0.5], seams: true }).map((r) => ({ d: r.d, alpha: r.alpha * alpha }));
  const marker = `<g data-part="dc-mark-${name}"></g>`;
  disc(name, F, 0, len, WHEEL_R, { tone: "hi", crease: "lo" }, { extra: Faded(teeth, { tone: "lo" }) + marker });
}
wheel("coarse", COARSE, COARSE.teeth, 1);
wheel("fine", FINE, FINE.teeth, 0.45);
// the dial face on a bracket, with 100 fine ticks and a longer one every 10¢
{
  const F = SF(DIAL.y);
  slab("dial.bracket", { x: AX.x - 2.5, y: DIAL.y - 0.4, w: 5, d: DIAL.t + 0.8, r: 0.3 }, 0, AX.z - DIAL.r + 0.4, { tone: "lo" }, { steps: 2 });
  const face = DIAL.t + 0.02;
  const ticks = Ln(G.spokesOf(F, face, DIAL.r - 4.2, DIAL.r - 2.4, 100, P), { tone: "lo" }) + Ln(G.spokesOf(F, face, DIAL.r - 5.6, DIAL.r - 2.4, 10, P), { tone: "mid" }) + Ln(G.circleOf(F, face, DIAL.r - 2.4, P, 72), { tone: "lo" }) + Ln(G.circleOf(F, face, 3.4, P, 24), { tone: "mid" });
  disc("dial.face", F, 0, DIAL.t, DIAL.r, { tone: "hi", crease: "lo" }, { bevel: 0.6, extra: ticks + `<path data-part="dc-needle" class="iso-line" data-tone="lit" data-free="start" style="stroke-width:1.1" d=""/>` });
  disc("dial.hub", SF(DIAL.y + DIAL.t), 0, 2, 3, { tone: "mid" }, { steps: 20 });
}
// crank on the back end of the shaft
{
  const F = SF(CRANK.y);
  disc("crank.boss", F, 0, 1.5, 4, { tone: "mid" }, { steps: 24 });
  const AF = G.frameOf([AX.x, CRANK.y - 0.9, AX.z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  put("crank.arm", [AX.x, CRANK.y - 1, AX.z + 6], `<g data-part="dc-crank"></g>`, [record(A.prism(AF, [[-1.2, -0.9], [1.2, -0.9], [1.2, 0.9], [-1.2, 0.9]], 0, CRANK.len, { name: "crank.arm" })), record(A.disc(G.frameAlong([AX.x, CRANK.y - 1.8, AX.z + CRANK.len], [0, -1, 0]), 0, 7, 1.6, { name: "crank.handle" }))], { bias: 0.2 });
}
// pawl on a sliding carriage: slide it along the shaft to pick the wheel it rides on
{
  const rail = { x: PAWL.pivot[0] - 5, y: -22, w: 10, d: 32, r: 1 };
  slab("pawl.rail", rail, 0, 3, { tone: "mid" }, { steps: 3, bevel: 0.4, extra: Dots([at([PAWL.pivot[0], -19, 3]), at([PAWL.pivot[0], 7, 3])], { size: 0.45 }) });
  const SL = { x: PAWL.pivot[0] - 5.5, y: PAWL.rest - 4, w: 11, d: 8, r: 1 };
  const parts = [];
  const shapes = [];
  parts.push(S(k.slabOf(SL, 3, 5, P, 3, 0.5), { tone: "mid" }));
  shapes.push(A.slab(SL, 3, 5, { name: "pawl.slider" }, 3));
  const KF = G.frameAlong([SL.x, PAWL.rest, 5.5], [-1, 0, 0]);
  parts.push(S(G.disc(0, 4, 2.4, KF, P, { steps: 24 }), { tone: "mid" }) + Faded(G.ribsOf(KF, 0, 4, 2.4, 20, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
  shapes.push(A.disc(KF, 0, 4, 2.4, { name: "pawl.knob" }));
  const PF = UPF(PAWL.pivot[0], PAWL.rest);
  parts.push(S(G.disc(8, PAWL.pivot[1] - 3, 2, PF, P, { steps: 20 }), { tone: "mid", inner: Ln(G.arcOf(PF, 24, 2, P) + G.arcOf(PF, 40, 2, P), { tone: "faint" }) }));
  shapes.push(A.disc(PF, 8, PAWL.pivot[1] - 3, 2, { name: "pawl.post" }));
  const CL = { x: PAWL.pivot[0] - 2.5, y: PAWL.rest - 2.5, w: 5, d: 5, r: 0.8 };
  parts.push(S(k.slabOf(CL, PAWL.pivot[1] - 3, 6, P, 2, 0.4), { tone: "mid" }));
  shapes.push(A.slab(CL, PAWL.pivot[1] - 3, 6, { name: "pawl.clevis" }, 2));
  put("pawl", [PAWL.pivot[0], PAWL.rest, 30], `<g data-part="dc-slider">${parts.join("")}</g>`, shapes.map(record), { bias: 0.3 });
  const dir = G.unit3([PAWL.tip[0] - PAWL.pivot[0], 0, PAWL.tip[1] - PAWL.pivot[1]]);
  const armF = G.frameOf([PAWL.pivot[0], PAWL.rest, PAWL.pivot[1]], dir, G.cross3([0, 1, 0], dir), [0, 1, 0]);
  put("pawl.arm", [PAWL.tip[0] - 4, PAWL.rest, PAWL.tip[1] + 1], `<g data-part="dc-pawl"></g>`, [record(A.prism(armF, [[-0.8, -1], [0.8, -1], [0.8, 1], [-0.8, 1]], 2.5, Math.hypot(PAWL.tip[0] - PAWL.pivot[0], PAWL.tip[1] - PAWL.pivot[1]), { name: "pawl.arm" }))], { bias: 0.5 });
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const svg = k.figureSvg({
  width: W,
  height: H,
  label: "A ratchet counter on a base plate: a shaft in two pillow blocks carries a 100-tooth wheel and a 1,000-tooth wheel; a pawl on a sliding carriage rides one of them; a crank on the back end turns the shaft one tooth per click and a needle on a dial at the front reads the price from 0 to 100 cents.",
  body: [back, `<g class="mp-rig">${R.items.map((it) => `<g class="it" data-name="${it.name}">${it.svg}</g>`).join("")}</g>`],
});

const DATA = { P, ax: AX, wheelR: WHEEL_R, coarse: COARSE, fine: FINE, dial: DIAL, crank: CRANK, pawl: PAWL, price0: PRICE0, railX: [at([PLATE.x + 20, 0, 0])[0], at([PLATE.x + PLATE.w - 20, 0, 0])[0]] };
const LIVE = `
const D = ${JSON.stringify(DATA)};
const P = D.P;
const ROOT = document.getElementById("fig-decimal");
const stage = ROOT.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = ROOT.querySelector("[data-readout]");
const status = ROOT.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const el = { needle: svg.querySelector('[data-part="dc-needle"]'), crank: svg.querySelector('[data-part="dc-crank"]'), pawl: svg.querySelector('[data-part="dc-pawl"]'), slider: svg.querySelector('[data-part="dc-slider"]'), markC: svg.querySelector('[data-part="dc-mark-coarse"]'), markF: svg.querySelector('[data-part="dc-mark-fine"]') };
const S = (paths, style) => solidSvg(paths, style);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const SF = (y) => G.frameAlong([D.ax.x, y, D.ax.z], [0, 1, 0]);
const state = { price: D.price0, target: D.price0, fine: false, slide: { x: 0, v: 0 }, angle: D.price0 * 3.6, pawlLift: 0, clickAt: -9, clock: 0 };
const tickOf = () => (state.fine ? 0.1 : 1);
function settle(s, target, dt, seconds, calm) {
  if (calm) { s.x = target; s.v = 0; return false; }
  const w = 1 / seconds;
  for (let i = 0; i < 4; i++) { const h = dt / 4; s.v += (w * w * (target - s.x) - 2 * w * s.v) * h; s.x += s.v * h; }
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-4) { s.x = target; s.v = 0; return false; }
  return true;
}
// a point on a circle around the shaft, in the x–z plane: angle 0 is straight up, clockwise seen from the front
const around = (y, r, deg) => { const a = (deg * Math.PI) / 180; return [D.ax.x + r * Math.sin(a), y, D.ax.z + r * Math.cos(a)]; };
let drawn = "";
function draw() {
  const key = state.angle.toFixed(2) + ":" + state.pawlLift.toFixed(2) + ":" + state.slide.x.toFixed(3);
  if (key === drawn) return;
  drawn = key;
  const a = state.angle;
  const fy = D.dial.y + D.dial.t + 0.22;
  el.needle.setAttribute("d", pathOf([iso(around(fy, 2.6, a + 180), P), iso(around(fy, D.dial.r - 2.4, a), P)]));
  const cy = D.crank.y - 0.9;
  const dir = G.unit3(G.sub3(around(cy, 1, a + 180), [D.ax.x, cy, D.ax.z]));
  const F = G.frameOf([D.ax.x, cy, D.ax.z], dir, G.cross3([0, 1, 0], dir), [0, 1, 0]);
  const tip = around(D.crank.y - 1.8, D.crank.len, a + 180);
  el.crank.innerHTML = S(G.prismOf(F, [[-1.2, -0.9], [1.2, -0.9], [1.2, 0.9], [-1.2, 0.9]], 0, D.crank.len, P), { tone: "mid" }) + S(G.disc(0, 7, 1.6, G.frameAlong(tip, [0, -1, 0]), P, { steps: 16 }), { tone: "hi" });
  el.markC.innerHTML = dotsSvg([iso(around(D.coarse.y1 + 0.02, D.wheelR - 2.2, a), P)], { size: 0.6, tone: "hi" });
  el.markF.innerHTML = dotsSvg([iso(around(D.fine.y1 + 0.02, D.wheelR - 2.2, a), P)], { size: 0.6, tone: "hi" });
  const y = D.pawl.rest + (D.pawl.fine - D.pawl.rest) * state.slide.x;
  el.slider.setAttribute("transform", translateAlong(P, [0, y - D.pawl.rest, 0]));
  el.pawl.setAttribute("transform", translateAlong(P, [0, y - D.pawl.rest, 0]));
  const pivot = [D.pawl.pivot[0], D.pawl.rest, D.pawl.pivot[1]];
  const tipP = [D.pawl.tip[0], D.pawl.rest, D.pawl.tip[1] + state.pawlLift];
  const dirP = G.unit3(G.sub3(tipP, pivot));
  const len = G.len3(G.sub3(tipP, pivot));
  const PF = G.frameOf(pivot, dirP, G.cross3([0, 1, 0], dirP), [0, 1, 0]);
  el.pawl.innerHTML = S(G.prismOf(PF, [[-0.8, -1], [0.8, -1], [0.8, 1], [-0.8, 1]], 2.5, len, P), { tone: "hi", lit: true }) + S(G.disc(-1.6, 1.6, 1.3, G.frameAlong(pivot, [0, 1, 0]), P, { steps: 16 }), { tone: "lo" });
}
function say() {
  const t = tickOf();
  const p = state.price;
  const share = ((t / p) * 100);
  const text = (state.fine ? "tick 0.1¢" : "tick 1¢") + " · " + (state.fine ? p.toFixed(1) : p.toFixed(0)) + "¢ · a tick is " + (share >= 10 ? share.toFixed(0) : share.toFixed(1)) + "% of price";
  if (readout.textContent !== text) readout.textContent = text;
}
function setTarget(cents) {
  const t = tickOf();
  state.target = clamp(Math.round(cents / t) * t, t, 100 - t);
  run();
}
function setFine(on) {
  if (state.fine === on) return;
  state.fine = on;
  state.price = Math.round(state.price / tickOf()) * tickOf();
  state.target = Math.round(state.target / tickOf()) * tickOf();
  status.textContent = on ? "Fine wheel: a tenth of a cent per click." : "Coarse wheel: one cent per click.";
  say();
  run();
}
const TOUR = [[0.8, () => setTarget(52)], [3.0, () => setTarget(3)], [7.5, () => setFine(true)], [8.6, () => setTarget(2.4)], [11.5, () => setTarget(1.2)], [14.5, () => { setFine(false); setTarget(58); }], [19, null]];
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
const CLICK = 0.07;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  state.clock += dt;
  if (touring) tourStep(dt);
  const t = tickOf();
  let stepping = false;
  if (Math.abs(state.target - state.price) > t / 2) {
    stepping = true;
    if (calm) state.price = state.target;
    else if (state.clock - state.clickAt >= CLICK) {
      state.clickAt = state.clock;
      state.price = Math.round((state.price + Math.sign(state.target - state.price) * t) / t) * t;
    }
  }
  // each click lifts the pawl over a tooth and drops it
  const age = state.clock - state.clickAt;
  state.pawlLift = calm ? 0 : age < 0.035 ? 0.9 * (age / 0.035) : age < 0.08 ? 0.9 * (1 - (age - 0.035) / 0.045) : 0;
  const wantAngle = state.price * 3.6;
  state.angle = calm ? wantAngle : state.angle + (wantAngle - state.angle) * (1 - Math.exp(-dt / 0.045));
  if (Math.abs(wantAngle - state.angle) < 0.02) state.angle = wantAngle;
  const sliding = settle(state.slide, state.fine ? 1 : 0, dt, 0.22, calm);
  draw();
  say();
  const alive = touring || stepping || sliding || state.angle !== wantAngle || age < 0.1;
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const priceAt = (event) => {
  const box = svg.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * 600;
  return ((px - D.railX[0]) / (D.railX[1] - D.railX[0])) * 100;
};
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "touch") return; takeOver(); setTarget(priceAt(event)); });
stage.addEventListener("pointerdown", (event) => { takeOver(); if (event.target.closest('[data-part="dc-slider"]')) setFine(!state.fine); else setTarget(priceAt(event)); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const t = tickOf();
  const kk = event.key;
  if (kk === "ArrowRight" || kk === "ArrowUp") (event.preventDefault(), takeOver(), setTarget(state.target + t * (event.shiftKey ? 10 : 1)));
  else if (kk === "ArrowLeft" || kk === "ArrowDown") (event.preventDefault(), takeOver(), setTarget(state.target - t * (event.shiftKey ? 10 : 1)));
  else if (kk === "t" || kk === "T" || kk === " ") (event.preventDefault(), takeOver(), setFine(!state.fine));
});
draw();
say();
`;
const plate = k.plateHtml({
  fig: "Fig 3",
  title: "Tick counter",
  hint: "Hover: turn · ← → tick · T: fine wheel",
  readout: `tick 1¢ · ${PRICE0}¢ · a tick is ${((1 / PRICE0) * 100).toFixed(1)}% of price`,
  keys: [
    { mark: "lit", label: "The pawl: it drops into one tooth per click, on whichever wheel the slider puts it" },
    { mark: "raised", label: "Coarse wheel, 100 teeth · fine wheel, 1,000 teeth" },
  ],
  caption:
    "The tick size is the smallest step a price can take, and this counter has it cut into its wheels: one tooth per cent on the coarse wheel, one per tenth of a cent on the fine one. Polymarket markets run at one of four tick sizes (0.1, 0.01, 0.001 or 0.0001 of a dollar), and a market's tick can be cut mid-life, typically from 1¢ to 0.1¢ as a cent becomes a large fraction of the price. Walk the price down to 3¢ on the coarse wheel and each click is a third of the price; slide the pawl to the fine wheel and the same move takes ten clicks, so bids and asks can sit a tenth of a cent apart.",
  body: `<div class="iso-stage dc-stage" tabindex="0" role="group" aria-label="Tick counter. Move the pointer to turn the crank toward a price; left and right arrows step one tick; T switches between the coarse and fine wheel.">${svg}<span class="mp-sr" role="status" aria-live="polite" data-status></span></div>`,
});
writeFigure({ id: "fig-decimal", name: "decimal", plate, css: STAGE_CSS("dc-stage") + "[data-part=dc-slider]{cursor:pointer}", live: LIVE, title: "Tick counter" });
console.log("wrote decimal.html", `${R.items.length} items`);
A.auditOrExit(R, P, {});
