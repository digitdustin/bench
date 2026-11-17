import { k, G, A, fixedProjection, rig, writeFigure, W, STAGE_CSS } from "./common.mjs";

const H = 310;
const PLATE = { x: -34, y: -36, w: 134, d: 72, r: 7 };
const THETA = 0.07; // the taker fee rate on Polymarket's crypto markets
const R0 = 14; // cam base radius: fee 0
const LIFT = 8; // world units per cent of fee
const feeOf = (p) => THETA * p * (1 - p) * 100; // cents per share
const camR = (p) => R0 + feeOf(p) * LIFT;
const SWEEP = 300; // degrees of cam for 0¢ to 100¢
const CAM = { z0: 10, h: 4, hubR: 5, knobR: 4 };
const ROLLER = { r: 3, z0: 8, h: 6 };
const ROD = { z: 15.5, r: 1.1 };
const BLOCK = { x0: 48, x1: 60, d: 10, h: 20 };
const ARM_LEN = 40; // roller axle to the rod's end
const P0 = 0.5;
const rollerX = (p) => camR(p) + ROLLER.r;
const endX = (p) => rollerX(p) + ARM_LEN;
const STRIP = { x: 46, y: 12, w: 42, d: 7, r: 1 };

const P = fixedProjection([...k.boxCorners(PLATE, -17, 0), [0, 0, CAM.z0 + CAM.h + 12]], W, H);
const R = A.recorder(P);
const { at, S, Ln, Dots, Faded, UPF, record, put, slab, disc } = rig(P, R);
// fee ruler: 0 to 2¢, a tick every quarter cent, ticks grow from the strip's back edge
const back = rig(P, R).basePlate(PLATE, { strip: STRIP, ticks: { from: endX(0), to: endX(0) + 2 * LIFT, step: LIFT / 4, every: 4, zero: endX(0) }, label: { x: 70, y: 23, w: 24, d: 9.5, r: 1.2 } });

// the cam profile, as a ring of floor points for a given cam angle (0 at rest)
function camRing(rho, steps = 96) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const phi = (i / steps) * 360;
    const p = phi <= SWEEP ? phi / SWEEP : null;
    const r = p === null ? R0 : camR(p);
    const a = ((phi + rho) * Math.PI) / 180;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}
const rho0 = -P0 * SWEEP; // at rest the 50¢ point faces +x, under the roller
const camTicks = (rho) => {
  const t = k.radialTicks(0, 0, R0 - 1.6, 20, 2, CAM.z0 + CAM.h, [1.3, 2.6], P, ((rho + 90) * Math.PI) / 180, (SWEEP * Math.PI) / 180);
  return Ln(k.ring(0, 0, R0 - 1.6, CAM.z0 + CAM.h, P, 48), { tone: "lo" }) + Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
};
disc("cam.base", UPF(0, 0), 0, 2, 7, { tone: "lo" });
disc("cam.post", UPF(0, 0), 2, CAM.z0, 2.4, { tone: "mid" });
put("cam", [8, 0, CAM.z0 + 2], `<g data-part="fc-cam">${S(k.extrude(camRing(rho0), CAM.z0, CAM.h, P, { convex: false }), { tone: "hi", crease: "lo" })}${camTicks(rho0)}</g>`, [record(A.extruded(camRing(rho0), CAM.z0, CAM.h, { name: "cam" }))], { bias: 0.2 });
disc("cam.hub", UPF(0, 0), CAM.z0 + CAM.h, CAM.z0 + CAM.h + 3, CAM.hubR, { tone: "mid" });
{
  const F = UPF(0, 0);
  const z = CAM.z0 + CAM.h + 3;
  disc("cam.knob", F, z, z + 5, CAM.knobR, { tone: "mid" }, { extra: Faded(G.ribsOf(F, z, z + 5, CAM.knobR, 30, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) + `<g data-part="fc-knobmark"></g>` });
}
// follower: roller on the cam rim, a yoke over it, a rod through a guide block, a spring back to the block, and a pointer blade at the end
{
  const rx = rollerX(P0);
  const RF = UPF(rx, 0);
  put("roller", [rx, 0, ROLLER.z0 + 3], `<g data-part="fc-roller">${S(G.disc(ROLLER.z0, ROLLER.z0 + ROLLER.h, ROLLER.r, RF, P, { steps: 32 }), { tone: "hi", crease: "lo", inner: Ln(G.arcOf(RF, ROLLER.z0 + 1.2, ROLLER.r, P), { tone: "faint" }) })}</g>`, [record(A.disc(RF, ROLLER.z0, ROLLER.z0 + ROLLER.h, ROLLER.r, { name: "roller" }))], { bias: 0.3 });
  const yoke = { x: rx - 3, y: -4, w: 6.5, d: 8, r: 0.8 };
  const yz = ROLLER.z0 + ROLLER.h;
  put("yoke", [rx, 0, ROD.z], `<g data-part="fc-yoke">${S(k.slabOf(yoke, yz, 3, P, 2, 0.3), { tone: "mid" })}${S(G.disc(yz + 3, yz + 4.4, 1.2, RF, P, { steps: 16 }), { tone: "lo" })}</g>`, [record(A.slab(yoke, yz, 3, { name: "yoke" }, 2)), record(A.disc(RF, yz + 3, yz + 4.4, 1.2, { name: "roller.pin" }))], { bias: 0.4 });
  // guide block with a bore
  const block = { x: BLOCK.x0, y: -BLOCK.d / 2, w: BLOCK.x1 - BLOCK.x0, d: BLOCK.d, r: 1.2 };
  const bores = Ln(G.circleOf(G.frameAlong([BLOCK.x0 - 0.02, 0, ROD.z], [-1, 0, 0]), 0, ROD.r + 0.4, P, 20) + G.circleOf(G.frameAlong([BLOCK.x1 + 0.02, 0, ROD.z], [1, 0, 0]), 0, ROD.r + 0.4, P, 20), { tone: "faint" });
  slab("guide", block, 0, BLOCK.h, { tone: "mid" }, { steps: 3, bevel: 0.6, inner: Ln(k.sideSeam(block, 6, P, 3), { tone: "faint" }), extra: bores + Dots(k.corners(block, 2.2).map(([x, y]) => at([x, y, BLOCK.h])), { size: 0.45 }) });
  // the rod, in two pieces that slide into the block from either side
  const LF = G.frameAlong([BLOCK.x0, 0, ROD.z], [-1, 0, 0]);
  const left = G.rodOut(LF, 0, BLOCK.x0 - (rx + 3), ROD.r, P, { stroke: 14, steps: 16 });
  put("rod.left", [(rx + 3 + BLOCK.x0) / 2, 0, ROD.z], `<g data-part="fc-rodl"><clipPath id="fc-rodl"><path data-hold d="${left.clip}"/></clipPath><g clip-path="url(#fc-rodl)">${S(left.paths, { tone: "hi", crease: "none" })}</g></g>`, [record(A.slide(LF, 0, BLOCK.x0 - (rx + 3), ROD.r, { name: "rod.left" }))], { bias: 0.3 });
  const RF2 = G.frameAlong([BLOCK.x1, 0, ROD.z], [1, 0, 0]);
  const ex = endX(P0);
  const right = G.rodOut(RF2, 0, ex - BLOCK.x1, ROD.r, P, { stroke: 14, steps: 16 });
  const cap = S(G.disc(0, 2, 2.2, G.frameAlong([ex, 0, ROD.z], [1, 0, 0]), P, { steps: 24 }), { tone: "mid" });
  // the pointer: a needle dropping from the cap, then running out over the fee ruler
  const dropF = G.frameAlong([ex + 1, 0, ROD.z - 2.2], [0, 0, -1]);
  const outF = G.frameAlong([ex + 1, 0.5, 2.2], [0, 1, 0]);
  const bladeSvg = S(G.disc(0, ROD.z - 2.2 - 1.7, 0.5, dropF, P, { steps: 12 }), { tone: "hi", lit: true, crease: "none" }) + S(G.disc(0, STRIP.y + 0.6 - 0.5, 0.45, outF, P, { steps: 12 }), { tone: "hi", lit: true, crease: "none" });
  const coil = k.coil(BLOCK.x1 + 0.6, ex - 0.6, [0, ROD.z], 2, Math.max(1, (ex - BLOCK.x1 - 1.2) / 1.6), "x", P);
  put("rod.right", [(BLOCK.x1 + ex) / 2, 0, ROD.z], `<g data-part="fc-coil-back">${Ln(coil.back, { tone: "lo" })}</g><g data-part="fc-rodr"><clipPath id="fc-rodr"><path data-hold d="${right.clip}"/></clipPath><g clip-path="url(#fc-rodr)">${S(right.paths, { tone: "hi", crease: "none" })}</g>${cap}${bladeSvg}</g><g data-part="fc-coil-front">${Ln(coil.front, { tone: "mid" })}</g>`, [record(A.slide(RF2, 0, ex - BLOCK.x1, ROD.r, { name: "rod.right" })), record(A.disc(G.frameAlong([ex, 0, ROD.z], [1, 0, 0]), 0, 2, 2.2, { name: "rod.cap" })), record(A.disc(dropF, 0, ROD.z - 2.2 - 1.7, 0.5, { name: "needle.drop" })), record(A.disc(outF, 0, STRIP.y + 0.6 - 0.5, 0.45, { name: "needle.out" }))], { bias: 0.3 });
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const svg = k.figureSvg({
  width: W,
  height: H,
  label: "A cam and follower on a base plate: a plate cam on a post, cut to the fee curve, with a knurled knob on top and price ticks round its face; a roller follower rides its edge, its rod passes through a guide block against a spring, and a pointer blade at the rod's end reads a fee ruler from 0 to 2 cents.",
  body: [back, `<g class="mp-rig">${R.items.map((it) => `<g class="it" data-name="${it.name}">${it.svg}</g>`).join("")}</g>`],
});

const DATA = { P, theta: THETA, r0: R0, lift: LIFT, sweep: SWEEP, cam: CAM, roller: ROLLER, rod: ROD, block: BLOCK, armLen: ARM_LEN, p0: P0, railX: [at([PLATE.x + 16, 0, 0])[0], at([PLATE.x + PLATE.w - 16, 0, 0])[0]] };
const LIVE = `
const D = ${JSON.stringify(DATA)};
const P = D.P;
const ROOT = document.getElementById("fig-fee");
const stage = ROOT.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = ROOT.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const el = { cam: svg.querySelector('[data-part="fc-cam"]'), mark: svg.querySelector('[data-part="fc-knobmark"]'), roller: svg.querySelector('[data-part="fc-roller"]'), yoke: svg.querySelector('[data-part="fc-yoke"]'), rodl: svg.querySelector('[data-part="fc-rodl"]'), rodr: svg.querySelector('[data-part="fc-rodr"]'), back: svg.querySelector('[data-part="fc-coil-back"]'), front: svg.querySelector('[data-part="fc-coil-front"]') };
const S = (paths, style) => solidSvg(paths, style);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const feeOf = (p) => D.theta * p * (1 - p) * 100;
const camR = (p) => D.r0 + feeOf(p) * D.lift;
const rollerX = (p) => camR(p) + D.roller.r;
function camRing(rho, steps = 96) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const phi = (i / steps) * 360;
    const r = phi <= D.sweep ? camR(phi / D.sweep) : D.r0;
    const a = ((phi + rho) * Math.PI) / 180;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}
const state = { p: D.p0, target: D.p0 };
let drawn = -1;
function draw() {
  const p = Math.round(state.p * 2000) / 2000;
  if (p === drawn) return;
  drawn = p;
  const rho = -p * D.sweep;
  const top = D.cam.z0 + D.cam.h;
  const t = radialTicks(0, 0, D.r0 - 1.6, 20, 2, top, [1.3, 2.6], P, ((rho + 90) * Math.PI) / 180, (D.sweep * Math.PI) / 180);
  el.cam.innerHTML = S(extrude(camRing(rho), D.cam.z0, D.cam.h, P, { convex: false }), { tone: "hi", crease: "lo" }) + lineSvg(ring(0, 0, D.r0 - 1.6, top, P, 48), { tone: "lo" }) + lineSvg(t.minor, { tone: "lo" }) + lineSvg(t.major, { tone: "mid" });
  const kz = top + 3 + 5;
  const a = ((rho + 90) * Math.PI) / 180;
  el.mark.innerHTML = lineSvg(lineOnTop([0, 0], [Math.sin(a) * (D.cam.knobR - 0.6), -Math.cos(a) * (D.cam.knobR - 0.6)], kz, P), { tone: "hi", free: true });
  const dx = rollerX(p) - rollerX(D.p0);
  const T = translateAlong(P, [dx, 0, 0]);
  const [sx, sy] = axisVector(P, [dx, 0, 0]);
  const hold = (sx || sy) ? "translate(" + (-sx).toFixed(2) + " " + (-sy).toFixed(2) + ")" : "";
  for (const node of [el.roller, el.yoke, el.rodl, el.rodr]) node.setAttribute("transform", dx ? T : "");
  for (const node of [el.rodl, el.rodr]) node.querySelector("[data-hold]").setAttribute("transform", hold);
  const ex = rollerX(p) + D.armLen;
  const coil = coilOf(D.block.x1 + 0.6, ex - 0.6, [0, D.rod.z], 2, Math.max(1, (ex - D.block.x1 - 1.2) / 1.6), "x", P);
  el.back.innerHTML = lineSvg(coil.back, { tone: "lo" });
  el.front.innerHTML = lineSvg(coil.front, { tone: "mid" });
}
const coilOf = coil;
function say() {
  const p = state.p;
  const fee = feeOf(p);
  const text = Math.round(p * 100) + "¢ · taker fee " + fee.toFixed(2) + "¢ a share · $" + (fee).toFixed(2) + " per 100";
  if (readout.textContent !== text) readout.textContent = text;
}
function setPrice(cents) { state.target = clamp(Math.round(cents), 1, 99) / 100; run(); }
const TOUR = [[0.8, () => setPrice(90)], [3.4, () => setPrice(10)], [6.4, () => setPrice(50)], [9, () => setPrice(97)], [11.6, () => setPrice(50)], [14, null]];
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
  state.p = calm || Math.abs(state.target - state.p) < 2e-4 ? state.target : state.p + (state.target - state.p) * (1 - Math.exp(-dt / 0.35));
  draw();
  say();
  frame = visible && (touring || state.p !== state.target) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const centsAt = (event) => { const box = svg.getBoundingClientRect(); const px = ((event.clientX - box.left) / box.width) * 600; return ((px - D.railX[0]) / (D.railX[1] - D.railX[0])) * 100; };
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "touch") return; takeOver(); setPrice(centsAt(event)); });
stage.addEventListener("pointerdown", (event) => { takeOver(); setPrice(centsAt(event)); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const step = event.shiftKey ? 10 : 1;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") (event.preventDefault(), takeOver(), setPrice(state.target * 100 + step));
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") (event.preventDefault(), takeOver(), setPrice(state.target * 100 - step));
  else if (event.key === "Home") (event.preventDefault(), takeOver(), setPrice(1));
  else if (event.key === "End") (event.preventDefault(), takeOver(), setPrice(99));
});
draw();
say();
`;
const plate = k.plateHtml({
  fig: "Fig 4",
  title: "Fee cam",
  hint: "Hover: turn the cam · ← → one cent",
  readout: `50¢ · taker fee ${feeOf(0.5).toFixed(2)}¢ a share · $${feeOf(0.5).toFixed(2)} per 100`,
  keys: [
    { mark: "lit", label: "The pointer: the fee per share, read on the ruler in cents" },
    { mark: "raised", label: "The cam, cut to θ × p × (1 − p) with θ = 0.07" },
  ],
  caption:
    "A taker fee on Polymarket is θ × shares × p × (1 − p): nothing at 0¢ or 100¢, most at 50¢, and that curve is the shape of this cam. Turn the knob to a price and the roller rides out by the fee; at 50¢ with θ = 0.07 (the crypto rate) it is 1.75¢ a share, at 10¢ or 90¢ it is 0.63¢, and near the ends it falls to almost nothing. Rates vary by category (sports 0.03 to 0.05, Polymarket US 0.06 from July 2026, geopolitics free) and only takers pay: a resting order that gets filled pays no fee.",
  body: `<div class="iso-stage fc-stage" tabindex="0" role="group" aria-label="Fee cam. Move the pointer to turn the cam to a price; left and right arrows step one cent.">${svg}</div>`,
});
writeFigure({ id: "fig-fee", name: "fee", plate, css: STAGE_CSS("fc-stage"), live: LIVE, title: "Fee cam" });
console.log("wrote fee.html", `${R.items.length} items`);
A.auditOrExit(R, P, {});
