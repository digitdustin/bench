import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../anatomy/kit/iso-kit.mjs";
import * as G from "../../../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../../anatomy/kit/tube.mjs";
import * as A from "../../../anatomy/kit/audit.mjs";
import { kitScript } from "../../../anatomy/scripts/inline-kit.mjs";
import { makeParts } from "./parts.mjs";
import { writeFigure } from "./common.mjs";
import * as M from "./market.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KITDIR = join(HERE, "../../../anatomy/kit");
const THEME = process.argv.includes("--light") ? "light" : "dark";
const ARTIFACT = process.argv.includes("--artifact");

const W = 600;
const H = 390;
const AZIMUTH = 38;
const ELEVATION = 31;

// ---- world layout (about 1 unit = 1 mm of a bench instrument; +y toward the viewer, z up) ----
const PLATE = { x: -48, y: -84, w: 304, d: 128, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;
const CX = (cents) => cents * 2; // the rail: 2 units per cent, 0¢ at x = 0, 100¢ at x = 200
const RAIL = { x0: -8, x1: 208, ys: [-9, 4], d: 5, h: 3 };
const STOP = { d: 28, w: 6, h: 9 };
const CAR = { w: 30, d: 26, z0: 3, deckTop: 8, jaw: 2.5, jawTop: 18 };
const PRESS = { x: 100, y: -50 };
const DIE = { x: 88, y: -62, w: 24, d: 24, r: 2, h: 24 };
const HOPPER = { rIn: 4.6, rOut: 5.4, z0: 25.5, z1: 60, flangeR: 7, slot: [27, 36], pitch: 0.9, coins: 7 };
const ROD = { r: 2, gland: 76, out: 10, stroke: 10, headR: 3.2, headH: 2.2 };
const RAMP = { exitZ: 20, endZ: 6.8, halfIn: 4.2, wall: 1, wallH: 3, floorT: 1 };
const PAD = { r: 6, h: 6.4, pinR: 0.8, pinH: 3.6 };
const SIDES = {
  yes: { sign: -1, pad: [22, -50], pin: [16, -50], bin: { x: 14, y: -71, w: 16, d: 13 }, rampEndX: 28.4, dieFaceX: DIE.x },
  no: { sign: 1, pad: [178, -50], pin: [184, -50], bin: { x: 170, y: -71, w: 16, d: 13 }, rampEndX: 171.6, dieFaceX: DIE.x + DIE.w },
};
const BIN_H = 5;
const SWEEP = { stroke: 12, barW: 11, barD: 1.2, barZ0: 6.4, barZ1: 9.2, rodR: 0.8, canR: 2.2 };
const DIAL = { x: 232, y: -36, r: 15, z: 30, h: 10, from: 210, span: 300 };
DIAL.top = DIAL.z + DIAL.h;
const POST = { x: 236, y: -70, top: 52, clampZ: 40 };
const LEVER = { x: 132, y: -76, z: 8.5, hubR: 1.8, len: 13, knobR: 2, swing: 35 };

const MARKET = M.market();
const REST = { yes: CX(MARKET.bid), no: CX(M.bestAsk(MARKET)) };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PRESS.x - 7, PRESS.y, ROD.gland + 26], [PRESS.x + 7, PRESS.y, ROD.gland + 26], [DIAL.x + DIAL.r, DIAL.y + DIAL.r, DIAL.top], [DIAL.x - DIAL.r, DIAL.y - DIAL.r, DIAL.top], [POST.x, POST.y, POST.top + 2]],
  W,
  H,
  { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const Faded = (list, style) => k.fadedSvg(list, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
const UPF = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);

const PARTS = makeParts(k, G, P, { carriage: CAR, lever: LEVER, dial: DIAL });

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
  return R.put({ name, at: ref, bias, svg, shapes, piece: "rig", ...rest });
}
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, ref } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name }, steps));
  put(name, ref ?? [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function slab(name, plan, z0, h, style = {}, { steps = 4, bevel = 0, extra = "", inner = "", bias = 0, ref } = {}) {
  const shape = record(A.slab(plan, z0, h, { name }, steps));
  put(name, ref ?? [plan.x + plan.w / 2, plan.y + plan.d / 2, z0 + h / 2], S(k.slabOf(plan, z0, h, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, steps, bevel = 0, owner, ref } = {}) {
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), ...(steps ? { steps } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner }));
  put(name, ref ?? G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
function prism(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, ref } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  put(name, ref ?? centre, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}
// A closed rounded rectangle lying in a vertical face, from a plane origin and two in-plane axes.
function faceRect(o, ex, ey, w, h, r, cls = "mp-slot") {
  const pts = k.roundedPlan({ x: 0, y: 0, w, d: h, r }, 4).map(([u, v]) => at(G.add3(G.add3(o, G.mul3(ex, u)), G.mul3(ey, v))));
  return `<path class="${cls}" d="${k.pathOf(pts, true)}"/>`;
}

const CABLES = [];
function cable(name, points, r = 0.6, { tone = "mid", bend = 3, maxLength = 9, bias = 0.05 } = {}) {
  const route = G.fillet(points, Math.max(bend, r * 2.6), 10, { P, tube: r });
  R.route(name, route, r, { limp: true, piece: "rig" });
  CABLES.push(name);
  tubePieces(route, r, P, { maxLength, spacing: 1 }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, route: name, chunk: index, attrs: ` data-route="${name}" data-chunk="${index}"` }),
  );
  [route[0], route[route.length - 1]].forEach((end, index) => {
    const size = Math.max(0.5, r * KS * 0.9);
    put(`${name}.end${index}`, end, Dots([at(end)], { size, tone: "hi" }), [A.ball(end, size / KS, { name: `${name}.end${index}`, owner: name })], { bias: bias + 0.15 });
  });
  return route;
}

// ---------------- static back layer: the base plate ----------------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4.5, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const plateScrews = k.corners(PLATE, 10);
back.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(plateScrews.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
// the price ruler: 0¢ to 100¢ along the rail, a tick every 5¢, a longer one every 10¢
const STRIP = { x: -3, y: 20, w: 206, d: 7, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const ticks = k.topTicks(0, 200, 10, 2, STRIP.y + 0.8, 0.6, [2, 3.6], P);
back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
back.push(Ln(k.lineOnTop([100, STRIP.y + 0.8], [100, STRIP.y + 5.2], 0.62, P), { tone: "hi" }));
back.push(Dots([at([STRIP.x + 1.6, STRIP.y + 3.5, 0.6]), at([STRIP.x + STRIP.w - 1.6, STRIP.y + 3.5, 0.6])], { size: 0.45 }));
record(A.slab(STRIP, 0, 0.6, { name: "stand.strip", ground: true }, 3));
// label plate
const LABEL = { x: 206, y: 27, w: 30, d: 12, r: 1.2 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
back.push(Ln([19, 13, 16].map((w, i) => k.lineOnTop([LABEL.x + 4, LABEL.y + 3.2 + i * 2.8], [LABEL.x + 4 + w, LABEL.y + 3.2 + i * 2.8], 0.8, P)).join(""), { tone: "lo", free: true }));
back.push(Dots([at([LABEL.x + LABEL.w - 2.6, LABEL.y + 2.4, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d - 2.4, 0.8])], { size: 0.45 }));
record(A.slab(LABEL, 0, 0.8, { name: "stand.label", ground: true }, 3));

// ---------------- rails, end stops and their terminals ----------------
for (const y of RAIL.ys) {
  const plan = { x: RAIL.x0, y, w: RAIL.x1 - RAIL.x0, d: RAIL.d, r: 1 };
  slab(`rail.${y < 0 ? "back" : "front"}`, plan, 0, RAIL.h, { tone: "mid" }, { steps: 3, bevel: 0.4, extra: Dots([RAIL.x0 + 5, 100, RAIL.x1 - 5].map((x) => at([x, y + RAIL.d / 2, RAIL.h])), { size: 0.4 }) });
}
for (const [name, x0, sign] of [["stop.left", -14, -1], ["stop.right", 208, 1]]) {
  const plan = { x: x0, y: -STOP.d / 2, w: STOP.w, d: STOP.d, r: 1.2 };
  slab(name, plan, 0, STOP.h, { tone: "mid" }, {
    steps: 3,
    bevel: 0.5,
    inner: Ln(k.sideSeam(plan, 3, P, 3), { tone: "faint" }),
    extra: Dots([at([x0 + 3, -10, STOP.h]), at([x0 + 3, 10, STOP.h])], { size: 0.45 }),
  });
  const faceX = sign < 0 ? x0 : x0 + STOP.w;
  disc(`${name}.terminal`, G.frameAlong([faceX, -10, 1.8], [sign, 0, 0]), 0, 2, 0.9, { tone: "lo" });
}

// ---------------- the two carriages: YES bid from the left, NO bid (= YES ask) from the right ----------------
function carriage(side) {
  const sign = side === "yes" ? -1 : 1;
  const faceX = REST[side];
  const lit = side === "yes";
  const deck = sign < 0 ? { x: -CAR.w, y: -CAR.d / 2, w: CAR.w, d: CAR.d, r: 2.5 } : { x: 0, y: -CAR.d / 2, w: CAR.w, d: CAR.d, r: 2.5 };
  const moved = (plan) => ({ ...plan, x: plan.x + faceX });
  const parts = [];
  const shapes = [];
  parts.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(deck, 3), CAR.z0, 0.1, P)}" style="filter:blur(3px)"/>`);
  parts.push(S(k.slabOf(deck, CAR.z0, CAR.deckTop - CAR.z0, P, 5, 0.6), { tone: "mid" }));
  shapes.push(A.slab(moved(deck), CAR.z0, CAR.deckTop - CAR.z0, { name: `carriage.${side}.deck` }, 5));
  // bushings at the four corners, taller than the deck, each with a screw
  const corners = k.corners(deck, 2.2);
  for (const [x, y] of byDepth(corners)) {
    const plan = { x: x - 2.5, y: y - 2, w: 5, d: 4, r: 0.8 };
    parts.push(S(k.slabOf(plan, CAR.deckTop, 3, P, 3, 0.4), { tone: "mid" }));
    parts.push(Dots([at([x, y, CAR.deckTop + 3])], { size: 0.45 }));
    shapes.push(A.slab(moved(plan), CAR.deckTop, 3, { name: `carriage.${side}.bushing` }, 3));
  }
  // rivets along the front edge, a groove down the middle
  parts.push(Dots([4, 10, 16, 22, 28].map((o) => at([sign < 0 ? -o : o, deck.y + deck.d - 2.4, CAR.deckTop])), { size: 0.4, tone: "lo" }));
  parts.push(Ln(k.lineOnTop([deck.x + 4.5, 0], [deck.x + deck.w - 4.5, 0], CAR.deckTop, P), { tone: "faint" }));
  // the resting orders behind the jaw
  const sizes = side === "yes" ? MARKET.yes : MARKET.asks.map((a) => a.size);
  parts.push(`<g data-part="plates-${side}">${PARTS.plates(sizes, sign)}</g>`);
  shapes.push(...PARTS.plateShapes(sizes, sign, faceX, A));
  // the jaw: the best price on this side
  const jaw = { x: sign < 0 ? -CAR.jaw : 0, y: -8, w: CAR.jaw, d: 16, r: 0.5 };
  parts.push(S(k.slabOf(jaw, CAR.deckTop, CAR.jawTop - CAR.deckTop, P, 2, 0.4), { tone: "hi", lit, crease: "lo" }));
  shapes.push(A.slab(moved(jaw), CAR.deckTop, CAR.jawTop - CAR.deckTop, { name: `carriage.${side}.jaw` }, 2));
  // thumb screw on the outer end
  const neckX = sign < 0 ? deck.x - 2.6 : deck.x + deck.w;
  const neck = { x: neckX, y: -1.6, w: 2.6, d: 3.2, r: 0.6 };
  parts.push(S(k.slabOf(neck, CAR.z0 + 1, 3.2, P, 2), { tone: "mid", crease: "none" }));
  shapes.push(A.slab(moved(neck), CAR.z0 + 1, 3.2, { name: `carriage.${side}.neck` }, 2));
  const KF = G.frameAlong([sign < 0 ? neckX : neckX + 2.6, 0, CAR.z0 + 2.6], [sign, 0, 0]);
  parts.push(S(G.disc(0, 3.6, 2.6, KF, P, { steps: 24 }), { tone: "mid" }) + Faded(G.ribsOf(KF, 0, 3.6, 2.6, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
  shapes.push(A.disc(G.frameAlong([(sign < 0 ? neckX : neckX + 2.6) + faceX, 0, CAR.z0 + 2.6], [sign, 0, 0]), 0, 3.6, 2.6, { name: `carriage.${side}.knob` }));
  const svg = `<g data-part="car-${side}" transform="${k.translateAlong(P, [faceX, 0, 0])}">${parts.join("")}</g>`;
  put(`carriage.${side}`, [faceX + (deck.x + deck.w / 2), 0, 8], svg, shapes.map(record), { bias: 0.2 });
}
carriage("yes");
carriage("no");

// ---------------- the press: posts, crossbar, solenoid, rod, hopper and die ----------------
const POST_Y = PRESS.y - 10;
for (const x of [PRESS.x - 16, PRESS.x + 16]) {
  const F = UPF(x, POST_Y);
  disc("press.collar", F, 0, 3, 4.2, { tone: "lo" });
  disc("press.post", F, 3, ROD.gland, 3, { tone: "mid" }, { inner: Ln([24, 50].map((z) => G.arcOf(F, z, 3, P)).join(""), { tone: "faint" }) });
}
const CROSS = { x: PRESS.x - 20, y: POST_Y - 4, w: 40, d: PRESS.y + 8 - (POST_Y - 4), r: 1.5 };
const CB = ROD.gland;
slab("press.crossbar", CROSS, CB, 6, { tone: "mid" }, { steps: 3, bevel: 0.5, inner: Ln(k.sideSeam(CROSS, CB + 2, P, 3), { tone: "faint" }), extra: Dots([at([PRESS.x - 16, POST_Y, CB + 6]), at([PRESS.x + 16, POST_Y, CB + 6]), at([PRESS.x - 16, PRESS.y + 5, CB + 6]), at([PRESS.x + 16, PRESS.y + 5, CB + 6])], { size: 0.5 }) });
{
  const F = UPF(PRESS.x, PRESS.y);
  disc("press.solenoid", F, CB + 6, CB + 22, 6.5, { tone: "mid" }, { inner: Ln(G.arcOf(F, CB + 10, 6.5, P) + G.arcOf(F, CB + 18, 6.5, P), { tone: "faint" }) });
  disc("press.cap", F, CB + 22, CB + 24, 5, { tone: "mid" }, { bevel: 0.4 });
  disc("press.nipple", F, CB + 24, CB + 26, 1.6, { tone: "lo" });
}
{
  // the plunger: one rod that slides out of the crossbar's underside into the hopper
  const F = G.frameAlong([PRESS.x, PRESS.y, ROD.gland], [0, 0, -1]);
  const rod = G.rodOut(F, 0, ROD.out, ROD.r, P, { stroke: ROD.stroke, steps: 20 });
  const head = S(G.disc(ROD.out, ROD.out + ROD.headH, ROD.headR, F, P, { steps: 28 }), { tone: "hi", lit: true });
  const svg = `<g data-part="press-rod"><clipPath id="mp-rod"><path data-hold d="${rod.clip}"/></clipPath><g clip-path="url(#mp-rod)">${S(rod.paths, { tone: "hi", lit: true, crease: "none" })}</g>${head}</g>` + Ln(G.circleOf(F, 0, ROD.r + 0.4, P, 24), { tone: "faint" });
  put("press.rod", [PRESS.x, PRESS.y, ROD.gland - ROD.out / 2], svg, [record(A.slide(F, 0, ROD.out, ROD.r, { name: "press.rod" })), record(A.disc(F, ROD.out, ROD.out + ROD.headH, ROD.headR, { name: "press.head" }))], { bias: 0.3 });
}
// die block
const dieInner = Ln(k.sideSeam(DIE, 18, P, 3), { tone: "faint" });
slab("press.die", DIE, 0, DIE.h, { tone: "hi", crease: "lo" }, {
  steps: 3,
  bevel: 0.8,
  inner: dieInner,
  extra:
    Ln(k.planOutline(k.insetPlan(DIE, 3.2), DIE.h, P, 3), { tone: "faint" }) +
    Dots(k.corners(DIE, 3.2).map(([x, y]) => at([x, y, DIE.h])), { size: 0.5, tone: "lo" }) +
    faceRect([DIE.x - 0.02, -54, 23.4], [0, 1, 0], [0, 0, -1], 8, 3.2, 0.8) +
    faceRect([DIE.x + DIE.w + 0.02, -46, 23.4], [0, -1, 0], [0, 0, -1], 8, 3.2, 0.8),
});
// terminals on the die's front face, where the rail circuit lands
for (const x of [96, 104]) disc("press.terminal", G.frameAlong([x, DIE.y + DIE.d, 1.8], [0, 1, 0]), 0, 2, 0.9, { tone: "lo" });
// hopper: a flange, then a tube with a sight slot that shows the coins waiting inside
{
  const F = UPF(PRESS.x, PRESS.y);
  disc("hopper.flange", F, DIE.h, HOPPER.z0, HOPPER.flangeR, { tone: "mid" }, { extra: Dots(G.dotsOf(F, HOPPER.z0, 6.3, 6, P, { all: true }), { size: 0.4, tone: "lo" }) });
  const theta = G.angleToward(F, V);
  const half = 0.17;
  const [s0, s1] = HOPPER.slot;
  const rO = HOPPER.rOut + 0.02;
  const corner = (s, a) => at(G.pointOf(F, s, rO, a));
  const arc = (s, a0, a1) => Array.from({ length: 7 }, (_, j) => at(G.pointOf(F, s, rO, a0 + ((a1 - a0) * j) / 6)));
  const slotPath = k.pathOf([...arc(s0, theta - half, theta + half), ...arc(s1, theta + half, theta - half)], true);
  const edges = Array.from({ length: HOPPER.coins }, (_, i) => {
    const z = s0 + 0.9 + i * HOPPER.pitch;
    return `<g data-coin="${i}">${Ln(k.pathOf(arc(z, theta - half, theta + half)), { tone: "lo" })}</g>`;
  }).join("");
  const slot = `<path class="mp-slot" d="${slotPath}"/>${edges}<path class="iso-line" data-tone="lo" d="${slotPath}"/>`;
  const shape = record(A.ring(F, HOPPER.z0, HOPPER.z1, HOPPER.rIn, HOPPER.rOut, { name: "hopper.tube" }));
  const tube = S(G.ringBand(HOPPER.z0, HOPPER.z1, HOPPER.rIn, HOPPER.rOut, F, P, { steps: 48 }), { tone: "hi", crease: "lo", inner: Ln(G.arcOf(F, 40, HOPPER.rOut, P) + G.arcOf(F, 52, HOPPER.rOut, P), { tone: "faint" }) });
  put("hopper.tube", [PRESS.x, PRESS.y, (HOPPER.z0 + HOPPER.z1) / 2], tube + slot, [shape], { bias: 0.2 });
  const lipShape = record(A.ring(F, HOPPER.z1, HOPPER.z1 + 1.2, HOPPER.rIn, HOPPER.rOut + 0.6, { name: "hopper.lip" }));
  put("hopper.lip", [PRESS.x, PRESS.y, HOPPER.z1 + 0.6], S(G.ringBand(HOPPER.z1, HOPPER.z1 + 1.2, HOPPER.rIn, HOPPER.rOut + 0.6, F, P, { steps: 48 }), { tone: "mid" }), [lipShape], { bias: 0.25 });
}

// ---------------- ramps from the die to the pads ----------------
const RAMPS = {};
for (const side of ["yes", "no"]) {
  const s = SIDES[side];
  const start = [s.dieFaceX, PRESS.y, RAMP.exitZ];
  const end = [s.rampEndX, PRESS.y, RAMP.endZ];
  const dir = G.unit3(G.sub3(end, start));
  const sideV = [0, 1, 0];
  let up = G.unit3(G.cross3(sideV, dir));
  if (up[2] < 0) up = G.mul3(up, -1);
  const F = G.frameOf(start, dir, sideV, up);
  const L = G.len3(G.sub3(end, start));
  const inner = RAMP.halfIn;
  const outer = inner + RAMP.wall;
  prism(`ramp.${side}.floor`, F, rect(-outer, outer, -RAMP.floorT, 0), 0, L, { tone: "mid" });
  prism(`ramp.${side}.far`, F, rect(-outer, -inner, 0, RAMP.wallH), 0, L, { tone: "mid" });
  prism(`ramp.${side}.near`, F, rect(inner, outer, 0, RAMP.wallH), 0, L, { tone: "mid" }, { extra: Dots([0.2, 0.5, 0.8].map((t) => at(G.add3(G.add3(start, G.mul3(dir, L * t)), G.mul3(up, RAMP.wallH)).map((v, i) => v + (i === 1 ? outer - RAMP.wall / 2 : 0)))), { size: 0.4, tone: "lo" }) });
  // a leg under the middle of the ramp
  const midP = G.add3(start, G.mul3(dir, L / 2));
  const under = G.add3(midP, G.mul3(up, -RAMP.floorT));
  disc(`ramp.${side}.leg`, UPF(midP[0], PRESS.y), 1.2, under[2] - 0.05, 1.6, { tone: "lo" });
  disc(`ramp.${side}.foot`, UPF(midP[0], PRESS.y), 0, 1.2, 2.6, { tone: "lo" });
  RAMPS[side] = { start, end, dir, up, L };
}

// ---------------- pads, backstop pins, sweepers, counters and bins ----------------
const SWEEPS = {};
for (const side of ["yes", "no"]) {
  const s = SIDES[side];
  const [px, py] = s.pad;
  const PF = UPF(px, py);
  disc(`pad.${side}`, PF, 0, PAD.h, PAD.r, { tone: "mid" }, { bevel: 0.5, extra: Ln(G.circleOf(PF, PAD.h, PAD.r - 1.6, P, 40), { tone: "faint" }) });
  disc(`pad.${side}.pin`, UPF(s.pin[0], s.pin[1]), PAD.h, PAD.h + PAD.pinH, PAD.pinR, { tone: "lo" });
  // the bin behind the pad, where a losing side's tokens are swept
  const b = s.bin;
  box(`bin.${side}.floor`, [b.x, b.y, 0], [b.x + b.w, b.y + b.d, 0.8], { tone: "lo" });
  box(`bin.${side}.back`, [b.x, b.y, 0.8], [b.x + b.w, b.y + 0.8, BIN_H], { tone: "mid" });
  box(`bin.${side}.left`, [b.x, b.y + 0.8, 0.8], [b.x + 0.8, b.y + b.d, BIN_H], { tone: "mid" });
  box(`bin.${side}.right`, [b.x + b.w - 0.8, b.y + 0.8, 0.8], [b.x + b.w, b.y + b.d, BIN_H], { tone: "mid" });
  box(`bin.${side}.front`, [b.x + 0.8, b.y + b.d - 0.8, 0.8], [b.x + b.w - 0.8, b.y + b.d, BIN_H], { tone: "mid" }, { extra: Dots([at([b.x + 3, b.y + b.d, 3]), at([b.x + b.w - 3, b.y + b.d, 3])], { size: 0.4, tone: "lo" }) });
  // the sweeper: a bar on the pad's front edge, pushed back by a rod from a small actuator
  const bracket = { x: px - 5, y: -43.2, w: 10, d: 7, r: 0.6 };
  const winM = planeMatrix([bracket.x + 1, bracket.y + bracket.d + 0.02, 5], [1, 0, 0], [0, 0, -1]);
  const window = `<g transform="${winM}"><rect class="mp-window" x="0" y="0" width="8" height="3.2" rx="0.3"/><text class="mp-digits" data-part="val-${side}" x="0.4" y="2.5" font-size="2.3" textLength="7.2" lengthAdjust="spacingAndGlyphs">${(M.valueOf(MARKET, side.toUpperCase()) / 100).toFixed(2)}</text></g>`;
  slab(`sweep.${side}.bracket`, bracket, 0, 6, { tone: "mid" }, { steps: 2, bevel: 0.4, extra: window + Dots([at([bracket.x + 1.6, bracket.y + 1.6, 6]), at([bracket.x + bracket.w - 1.6, bracket.y + 1.6, 6])], { size: 0.45 }) });
  const CF = G.frameAlong([px, bracket.y + bracket.d - 0.4, 6 + SWEEP.canR], [0, -1, 0]);
  disc(`sweep.${side}.can`, CF, 0, 6.2, SWEEP.canR, { tone: "mid" }, { inner: Ln(G.arcOf(CF, 1.2, SWEEP.canR, P), { tone: "faint" }) });
  const glandY = bracket.y + bracket.d - 0.4 - 6.2;
  const RF = G.frameAlong([px, glandY, 6 + SWEEP.canR], [0, -1, 0]);
  const barY1 = glandY - 1.8;
  const bar = { x: px - SWEEP.barW / 2, y: barY1 - SWEEP.barD, w: SWEEP.barW, d: SWEEP.barD, r: 0.3 };
  const rod = G.rodOut(RF, 0, 1.8, SWEEP.rodR, P, { stroke: SWEEP.stroke, steps: 16 });
  const id = `mp-sweep-${side}`;
  const svg = `<g data-part="sweep-${side}"><clipPath id="${id}"><path data-hold d="${rod.clip}"/></clipPath><g clip-path="url(#${id})">${S(rod.paths, { tone: "mid", crease: "none" })}</g>${S(k.slabOf(bar, SWEEP.barZ0, SWEEP.barZ1 - SWEEP.barZ0, P, 2, 0.3), { tone: "mid" })}</g>`;
  put(`sweep.${side}.bar`, [px, barY1 - SWEEP.barD / 2, 8], svg + Ln(G.circleOf(RF, 0, SWEEP.rodR + 0.3, P, 20), { tone: "faint" }), [record(A.slide(RF, 0, 1.8, SWEEP.rodR, { name: `sweep.${side}.rod` })), record(A.slab(bar, SWEEP.barZ0, SWEEP.barZ1 - SWEEP.barZ0, { name: `sweep.${side}.bar` }, 2))], { bias: 0.3 });
  SWEEPS[side] = { bar, glandY, z: 6 + SWEEP.canR };
}

// ---------------- the price dial on its post ----------------
{
  const PF = UPF(POST.x, POST.y);
  disc("dial.collar", PF, 0, 4, 5, { tone: "mid" });
  disc("dial.post.low", PF, 4, POST.clampZ, 3.2, { tone: "mid" }, { inner: Ln([14, 28].map((z) => G.arcOf(PF, z, 3.2, P)).join(""), { tone: "faint" }) });
  const clamp = { x: POST.x - 7, y: POST.y - 7, w: 14, d: 14, r: 2.5 };
  slab("dial.clamp", clamp, POST.clampZ, 12, { tone: "mid" }, { steps: 4, bevel: 0.6 });
  disc("dial.post.high", PF, POST.clampZ + 12, POST.top, 3.2, { tone: "mid" });
  disc("dial.post.cap", PF, POST.top, POST.top + 2, 3.8, { tone: "mid" });
  const thumb = G.frameAlong([POST.x - 7, POST.y, POST.clampZ + 6], [-1, 0, 0]);
  disc("dial.thumb.neck", thumb, 0, 2, 1.4, { tone: "mid" });
  disc("dial.thumb", thumb, 2, 7, 2.6, { tone: "mid" }, { extra: Faded(G.ribsOf(thumb, 2, 7, 2.6, 18, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
  const arm = { x: DIAL.x + 1, y: POST.y + 7, w: 6, d: DIAL.y - DIAL.r - (POST.y + 7), r: 2 };
  slab("dial.arm", arm, 44, 4, { tone: "mid" }, { steps: 3, bevel: 0.5, extra: Dots([at([DIAL.x + 4, POST.y + 11, 48]), at([DIAL.x + 4, DIAL.y - DIAL.r - 4, 48])], { size: 0.45 }) });
  const lug = { x: DIAL.x + 1, y: DIAL.y - DIAL.r - 3, w: 6, d: 6, r: 1.2 };
  slab("dial.lug", lug, DIAL.top, 44 - DIAL.top, { tone: "mid" }, { steps: 3, bias: 0.3 });
  const DF = UPF(DIAL.x, DIAL.y);
  const face = [
    Faded(G.ribsOf(DF, DIAL.top - 3.4, DIAL.top, DIAL.r, 80, P, { fade: [0.1, 0.5], seams: "first" }), { tone: "lo" }),
    Ln(k.ring(DIAL.x, DIAL.y, DIAL.r - 2.2, DIAL.top, P, 64), { tone: "lo" }),
    (() => {
      const t = k.radialTicks(DIAL.x, DIAL.y, DIAL.r - 3, 20, 2, DIAL.top, [1.3, 2.8], P, (DIAL.from * Math.PI) / 180, (DIAL.span * Math.PI) / 180);
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
    Ln(k.ring(DIAL.x, DIAL.y, 1.6, DIAL.top, P, 16), { tone: "mid" }),
    k.faceTextSvg(k.topMatrix([DIAL.x, DIAL.y + 7.5], DIAL.top, P, "x"), "YES ¢", { size: 2.4, tone: "lo", anchor: "middle" }),
  ].join("");
  const needle = `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" style="stroke-width:1.1" d="${PARTS.needle(M.mid(MARKET))}"/>`;
  disc("dial.puck", DF, DIAL.z, DIAL.top, DIAL.r, { tone: "hi", crease: "lo" }, { bevel: 0.8, extra: face + needle, bias: 0.1 });
  slab("dial.crown.base", { x: DIAL.x + DIAL.r - 0.3, y: DIAL.y - 2.4, w: 4.4, d: 4.8, r: 1.2 }, DIAL.z + 2, 5, { tone: "mid" }, { steps: 3 });
  slab("dial.crown", { x: DIAL.x + DIAL.r + 4.1, y: DIAL.y - 3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL.z + 1.2, 6.6, { tone: "mid" }, { steps: 3 });
}

// ---------------- the deposit: a tray of $1 coins waiting to be loaded ----------------
{
  const TRAY = [-22, -62];
  const TF = UPF(TRAY[0], TRAY[1]);
  const trayProfile = [[0, 0], [0, 8.6], [1.8, 8.6], [1.8, 7.6], [0.9, 7.2]];
  const trayShape = record(A.lathe(TF, [...trayProfile, [0.9, 0]], { name: "tray" }));
  put("tray", [TRAY[0], TRAY[1], 1], S(G.lathe(trayProfile.concat([[0.9, 0]]), TF, P, { steps: 48 }), { tone: "lo" }) + Ln(G.circleOf(TF, 0.9, 5.2, P, 40), { tone: "faint" }), [trayShape], { bias: 0.1 });
  const COINS = 6;
  for (let i = 0; i < COINS; i++) {
    const z = 0.9 + i * PARTS.COIN_T;
    const CF = UPF(TRAY[0], TRAY[1]);
    const shape = record(A.disc(CF, z, z + PARTS.COIN_T, PARTS.COIN_R, { name: "tray.coin" }));
    const ring = i === COINS - 1 ? Ln(G.circleOf(CF, z + PARTS.COIN_T, PARTS.COIN_R - 0.7, P, 32), { tone: "lo" }) : "";
    put(`tray.coin.${i}`, [TRAY[0], TRAY[1], z + PARTS.COIN_T / 2], S(G.disc(z, z + PARTS.COIN_T, PARTS.COIN_R, CF, P, { steps: 40 }), { tone: "hi" }) + ring, [shape], { bias: 0.2 + i * 0.01 });
  }
}

// ---------------- the resolution lever ----------------
{
  const ped = { x: LEVER.x - 6, y: LEVER.y - 4, w: 12, d: 8, r: 1.5 };
  slab("lever.pedestal", ped, 0, 6, { tone: "mid" }, { steps: 3, bevel: 0.5, extra: Dots([at([LEVER.x - 4.2, LEVER.y - 2, 6]), at([LEVER.x + 4.2, LEVER.y - 2, 6])], { size: 0.45 }) });
  for (const [name, y] of [["lever.bearing.back", LEVER.y - 4], ["lever.bearing.front", LEVER.y + 2.6]]) slab(name, { x: LEVER.x - 1, y, w: 2, d: 1.4, r: 0.3 }, 6, 3.5, { tone: "lo" }, { steps: 2 });
  const PIN = G.frameAlong([LEVER.x, LEVER.y - 4.6, LEVER.z], [0, 1, 0]);
  disc("lever.pin.back", PIN, 0, 0.6, 1, { tone: "lo" });
  disc("lever.pin.mid1", PIN, 2, 3.7, 1, { tone: "lo" });
  disc("lever.pin.mid2", PIN, 5.5, 7.2, 1, { tone: "lo" });
  disc("lever.pin.front", PIN, 8.6, 9.2, 1, { tone: "lo" });
  const hubF = G.frameAlong([LEVER.x, LEVER.y - 0.9, LEVER.z], [0, 1, 0]);
  const hubShape = record(A.ring(hubF, 0, 1.8, 1, LEVER.hubR, { name: "lever.hub" }));
  put("lever.hub", [LEVER.x, LEVER.y, LEVER.z], S(G.ringBand(0, 1.8, 1, LEVER.hubR, hubF, P, { steps: 24 }), { tone: "mid" }), [hubShape], { bias: 0.2 });
  const dir0 = [0, 0, 1];
  const AF = G.frameAlong([LEVER.x, LEVER.y, LEVER.z], dir0);
  const armShape = record(A.prism(AF, rect(-0.8, 0.8, -0.8, 0.8), LEVER.hubR, LEVER.len, { name: "lever.arm" }));
  const knobShape = record(A.ball(G.add3([LEVER.x, LEVER.y, LEVER.z], G.mul3(dir0, LEVER.len + LEVER.knobR - 0.3)), LEVER.knobR, { name: "lever.knob" }));
  put("lever.arm", [LEVER.x, LEVER.y, LEVER.z + 8], `<g data-part="lever">${PARTS.lever(0)}</g>`, [armShape, knobShape], { bias: 0.4 });
  // a small sector plate behind the arm with the two end marks
  const sector = { x: LEVER.x - 9, y: LEVER.y - 4.8, w: 18, d: 0.8, r: 0.3 };
  slab("lever.sector", sector, 6, 10, { tone: "lo" }, { steps: 2, extra: Dots([at([LEVER.x - 7, LEVER.y - 4, 14]), at([LEVER.x + 7, LEVER.y - 4, 14])], { size: 0.55, tone: "hi" }) });
}

// ---------------- the rail circuit: both end stops wired to the press ----------------
cable("wire.yes", [[-16, -10, 1.8], [-21, -10, 1.8], [-21, -24, 1.8], [96, -24, 1.8], [96, DIE.y + DIE.d + 2, 1.8]], 0.6, { tone: "mid" });
cable("wire.no", [[216, -10, 1.8], [221, -10, 1.8], [221, -24, 1.8], [104, -24, 1.8], [104, DIE.y + DIE.d + 2, 1.8]], 0.6, { tone: "mid" });

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

const indexOf = (name) => R.items.findIndex((item) => item.name === name);
const slots = new Map();
const addSlot = (index, html) => slots.set(index, (slots.get(index) ?? "") + html);
addSlot(Math.max(indexOf("ramp.yes.floor"), indexOf("ramp.yes.far")), `<g data-part="tokens-ramp-yes"></g>`);
addSlot(Math.max(indexOf("ramp.no.floor"), indexOf("ramp.no.far"), indexOf("press.die")), `<g data-part="tokens-ramp-no"></g>`);
for (const side of ["yes", "no"]) {
  addSlot(indexOf(`pad.${side}`), `<g data-part="tokens-pad-${side}"></g>`);
  addSlot(Math.max(indexOf(`bin.${side}.floor`), indexOf(`bin.${side}.back`), indexOf(`bin.${side}.left`), indexOf(`bin.${side}.right`)), `<g data-part="tokens-bin-${side}"></g>`);
}
const groups = R.items.map((item, index) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>${slots.get(index) ?? ""}`);

const LABEL_TEXT =
  "A bench instrument that works a prediction market: a rail marked 0 to 100 cents with a YES carriage pushing from the left and a NO carriage pushing from the right, each carrying a ladder of resting orders; a coin press behind the rail wired to both end stops; two ramps from the press down to a pad on each side where share tokens collect; a counter under each pad showing what one share is worth; a lever at the back that resolves the market; and a dial at the right reading the last price.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: [...back, `<g class="mp-rig">${groups.join("")}</g>`] });

const DATA = {
  P,
  V,
  cx: 2,
  rest: REST,
  carriage: CAR,
  press: { ...PRESS, rodStroke: ROD.stroke, hopper: HOPPER, die: DIE },
  ramps: RAMPS,
  pads: Object.fromEntries(["yes", "no"].map((s) => [s, { at: SIDES[s].pad, pin: SIDES[s].pin, top: PAD.h, bin: SIDES[s].bin, binFloor: 0.8, binH: BIN_H, stopX: SIDES[s].pin[0] + SIDES[s].sign * -(PAD.pinR + 3.6 + 0.2) }])),
  sweep: { stroke: SWEEP.stroke, sides: SWEEPS },
  dial: DIAL,
  lever: LEVER,
  ruler: { x0: at([0, STRIP.y + 3, 0])[0], x1: at([200, STRIP.y + 3, 0])[0] },
  market: MARKET,
  routes: Object.fromEntries(CABLES.map((name) => [name, R.items.filter((it) => it.route === name).length])),
};

const CSS = readFileSync(join(HERE, "press.css"), "utf8");
const latheSource = readFileSync(join(KITDIR, "lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "");
const latheScript = `const G = (() => {${latheSource}\nreturn { viewOf, scaleOf, frameAlong, frameOf, pointOf, disc, sphereOf, prismOf, circleOf, arcOf, dot3, add3, sub3, mul3, unit3, cross3, len3, lerp3, lightOf, toneOf, radialOf, angleToward };})();\n`;
const partsScript = readFileSync(join(HERE, "parts.mjs"), "utf8").replace(/^export /gm, "");
const marketScript = `const M = (() => {${readFileSync(join(HERE, "market.mjs"), "utf8").replace(/^export /gm, "")}\nreturn { TICK, PAYOUT, DEPTH, market, bestAsk, noBid, spread, crossed, mid, match, resolve, valueOf, payout, dollars };})();\n`;
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const plate = k.plateHtml({
  fig: "Fig 1",
  title: "Market press",
  hint: "Hover to bid · ← → · Y / N resolve · R reset",
  readout: `bid ${MARKET.bid}¢ · ask ${M.bestAsk(MARKET)}¢ · spread ${M.spread(MARKET)}¢`,
  keys: [
    { mark: "lit", label: "Your YES bid: the jaw you push along the price rail" },
    { mark: "raised", label: "Resting orders: one plate per cent, as tall as the size waiting there" },
    { mark: "edge", label: "The circuit that fires the press when a bid meets an ask" },
  ],
  caption:
    "How a Polymarket market works, as a bench press. Every share settles to $1 or $0, so a price in cents is a probability: the rail runs 0¢ to 100¢ and the dial reads the last trade. Buyers of YES push from the left and buyers of NO push from the right, and the NO jaw sits at 100¢ minus the NO bid, so a 59¢ YES ask is a 41¢ NO bid. The moment the jaws touch, the circuit through both end stops closes and the press stamps one $1 coin into a YES share and a NO share, which slide down to their pads; the level you lifted is gone, the next plate in the ladder becomes the ask, and the price moves. Throw the lever to resolve: the winning pad's shares redeem at $1.00 each and the other pad is swept into the bin.",
  body: `<div class="iso-stage mp-stage" tabindex="0" role="group" aria-label="Market press. Move the pointer across the figure to set your YES bid; left and right arrows step it by a cent; Y resolves the market YES, N resolves it NO, R starts a new market.">${svg}<span class="mp-sr" role="status" aria-live="polite" data-status></span></div>`,
});
writeFigure({ id: "fig-press", name: "press", plate, css: CSS, shared: partsScript + marketScript, live: LIVE, title: "Market press" });
console.log("wrote press.html", `${R.items.length} items`, `scale ${KS.toFixed(3)}`);
A.auditOrExit(R, P, {});
