import { k, G, A, fixedProjection, rig, writeFigure, W, STAGE_CSS } from "./common.mjs";

const H = 320;
const PLATE = { x: -40, y: -40, w: 206, d: 80, r: 7 };
const LO = 55; // the first spindle's price
const N = 12; // spindles: 55¢ to 66¢
const PITCH = 11;
const XOF = (i) => i * PITCH;
const RACK = { x: -8, y: -6, w: (N - 1) * PITCH + 16, d: 12, r: 1.5, h: 6 };
const SPINDLE = { r: 1.2, top: 32, capR: 1.8 };
const COIN = { r: 3.6, t: 0.8 };
const RAIL = { x: -8, y: -18, w: RACK.w, d: 5, r: 1 };
const TRAY = [148, 0];
const BOOK0 = { bids: { 55: 9, 56: 6, 57: 8, 58: 5 }, asks: { 61: 4, 62: 7, 63: 5, 64: 9, 65: 6, 66: 8 } };
const STRIP = { x: -8, y: 12, w: RACK.w, d: 7, r: 1 };

const P = fixedProjection([...k.boxCorners(PLATE, -17, 0), [XOF(N - 1), 0, SPINDLE.top + 2]], W, H);
const R = A.recorder(P);
const { at, S, Ln, Dots, UPF, record, put, slab, disc, turned } = rig(P, R);
const back = rig(P, R).basePlate(PLATE, { strip: STRIP, ticks: { from: 0, to: XOF(N - 1), step: PITCH, every: 5, zero: XOF(60 - LO) }, label: { x: 128, y: 22, w: 28, d: 11, r: 1.2 } });

const coinAt = (c, { lit = false, tone = "hi" } = {}) => S(G.disc(-COIN.t / 2, COIN.t / 2, COIN.r, G.frameAlong(c, [0, 0, 1]), P, { steps: 36 }), { tone, lit });
const stackSvg = (i, n, lit) => Array.from({ length: n }, (_, j) => coinAt([XOF(i), 0, RACK.h + COIN.t / 2 + j * COIN.t], { lit })).join("");

// the rack with a bored hole at each spindle
slab("rack", RACK, 0, RACK.h, { tone: "mid" }, { steps: 3, bevel: 0.6, inner: Ln(k.sideSeam(RACK, 2, P, 3), { tone: "faint" }), extra: Dots([at([RACK.x + 3, RACK.y + 2.5, RACK.h]), at([RACK.x + RACK.w - 3, RACK.y + 2.5, RACK.h]), at([RACK.x + 3, RACK.y + RACK.d - 2.5, RACK.h]), at([RACK.x + RACK.w - 3, RACK.y + RACK.d - 2.5, RACK.h])], { size: 0.45 }) });
for (let i = 0; i < N; i++) {
  const price = LO + i;
  const n = BOOK0.bids[price] ?? BOOK0.asks[price] ?? 0;
  const F = UPF(XOF(i), 0);
  const post = S(G.disc(RACK.h, SPINDLE.top, SPINDLE.r, F, P, { steps: 16 }), { tone: "mid", crease: "none" }) + Ln(k.ring(XOF(i), 0, SPINDLE.r + 0.6, RACK.h, P, 16), { tone: "lo" });
  const cap = S(G.disc(SPINDLE.top, SPINDLE.top + 1.6, SPINDLE.capR, F, P, { steps: 16 }), { tone: "mid" });
  const shapes = [record(A.disc(F, RACK.h, SPINDLE.top, SPINDLE.r, { name: `spindle.post` })), record(A.disc(F, SPINDLE.top, SPINDLE.top + 1.6, SPINDLE.capR, { name: `spindle.cap` }))];
  if (n) shapes.push(record(A.ring(F, RACK.h, RACK.h + n * COIN.t, SPINDLE.r, COIN.r, { name: `stack.${price}` })));
  put(`spindle.${price}`, [XOF(i), 0, 18], `${post}<g data-level="${price}">${stackSvg(i, n, false)}</g>${cap}`, shapes, { bias: 0.2 });
}
// the mid pointer on a rail behind the rack
slab("rail", RAIL, 0, 3, { tone: "mid" }, { steps: 3, bevel: 0.4, extra: Dots([at([RAIL.x + 4, RAIL.y + 2.5, 3]), at([RAIL.x + RAIL.w - 4, RAIL.y + 2.5, 3])], { size: 0.4 }) });
const MID0 = (58 + 61) / 2;
{
  const mx = XOF(MID0 - LO);
  const car = { x: -3.5, y: RAIL.y - 1, w: 7, d: 7, r: 1 };
  const blade = { x: -0.3, y: RAIL.y + 6, w: 0.6, d: RACK.y - (RAIL.y + 6) - 0.8, r: 0.1 };
  const svg = `<g data-part="ob-mid" transform="${k.translateAlong(P, [mx, 0, 0])}">${S(k.slabOf(car, 3, 4.5, P, 3, 0.4), { tone: "mid" })}${Dots([at([0, RAIL.y + 2.5, 7.5])], { size: 0.45 })}${S(k.slabOf(blade, 3.5, 4, P, 1), { tone: "hi", lit: true, crease: "none" })}</g>`;
  put("mid", [mx, RAIL.y + 2, 5], svg, [record(A.slab({ ...car, x: car.x + mx }, 3, 4.5, { name: "mid.car" }, 3)), record(A.slab({ ...blade, x: blade.x + mx }, 3.5, 4, { name: "mid.blade" }, 1))], { bias: 0.3 });
}
// the taker's tray at the end of the rack
{
  const TF = UPF(TRAY[0], TRAY[1]);
  const profile = [[0, 0], [0, 9.6], [1.8, 9.6], [1.8, 8.4], [0.9, 8]];
  turned("tray", TF, [...profile, [0.9, 0]], { tone: "lo" }, { extra: Ln(G.circleOf(TF, 0.9, 5.6, P, 40), { tone: "faint" }) + `<g data-part="ob-tray"></g>` });
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const svg = k.figureSvg({
  width: W,
  height: H,
  label: "An order book as a coin rack on a base plate: twelve spindles, one per cent from 55 to 66, each holding a stack of coins that are the shares resting at that price; bids on the left, asks on the right, empty spindles between them for the spread; a mid-price pointer on a rail behind, a ruler in front, and a tray at the end where a taker's coins land.",
  body: [back, `<g class="mp-rig">${R.items.map((it) => `<g class="it" data-name="${it.name}">${it.svg}</g>`).join("")}</g>`, `<g data-part="ob-fly"></g>`],
});

const DATA = { P, lo: LO, n: N, pitch: PITCH, rack: RACK, coin: COIN, spindleTop: SPINDLE.top, tray: TRAY, book: BOOK0, mid0: MID0, railX: [at([XOF(0), 0, 10])[0], at([XOF(N - 1), 0, 10])[0]] };
const LIVE = `
const D = ${JSON.stringify(DATA)};
const P = D.P;
const ROOT = document.getElementById("fig-book");
const stage = ROOT.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = ROOT.querySelector("[data-readout]");
const status = ROOT.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const S = (paths, style) => solidSvg(paths, style);
const XOF = (i) => i * D.pitch;
const levels = {};
for (let i = 0; i < D.n; i++) levels[D.lo + i] = svg.querySelector('[data-level="' + (D.lo + i) + '"]');
const el = { mid: svg.querySelector('[data-part="ob-mid"]'), fly: svg.querySelector('[data-part="ob-fly"]'), tray: svg.querySelector('[data-part="ob-tray"]') };
const coinAt = (c, opts = {}) => S(G.disc(-D.coin.t / 2, D.coin.t / 2, D.coin.r, G.frameAlong(c, [0, 0, 1]), P, { steps: 36 }), { tone: "hi", ...opts });
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fresh = () => ({ sizes: Object.fromEntries(Array.from({ length: D.n }, (_, i) => [D.lo + i, D.book.bids[D.lo + i] ?? D.book.asks[D.lo + i] ?? 0])), side: Object.fromEntries(Array.from({ length: D.n }, (_, i) => [D.lo + i, D.book.bids[D.lo + i] ? "bid" : D.book.asks[D.lo + i] ? "ask" : null])) });
const state = { book: fresh(), flights: [], tray: 0, midX: XOF(D.mid0 - D.lo), clock: 0, hover: null };
const bestBid = () => { let b = null; for (const p in state.book.sizes) if (state.book.side[p] === "bid" && state.book.sizes[p] > 0 && (b === null || +p > b)) b = +p; return b; };
const bestAsk = () => { let a = null; for (const p in state.book.sizes) if (state.book.side[p] === "ask" && state.book.sizes[p] > 0 && (a === null || +p < a)) a = +p; return a; };
const depth = (side) => Object.keys(state.book.sizes).reduce((s, p) => s + (state.book.side[p] === side ? state.book.sizes[p] : 0), 0);
function redraw(price) {
  const i = price - D.lo;
  const n = state.book.sizes[price];
  const best = price === bestBid() || price === bestAsk();
  levels[price].innerHTML = Array.from({ length: n }, (_, j) => coinAt([XOF(i), 0, D.rack.h + D.coin.t / 2 + j * D.coin.t], { lit: best && j === n - 1 })).join("");
}
function redrawAll() { for (const p in state.book.sizes) redraw(+p); }
function say() {
  const b = bestBid(), a = bestAsk();
  let text = (b ? "bid " + b + "¢ ×" + state.book.sizes[b] : "no bids") + " · " + (a ? "ask " + a + "¢ ×" + state.book.sizes[a] : "no asks");
  if (b && a) text += " · spread " + (a - b) + "¢";
  text += " · depth " + depth("bid") + "/" + depth("ask");
  if (readout.textContent !== text) readout.textContent = text;
}
// a taker lifts one coin at a time off the best level on the far side and carries it to the tray
function take(side, count) {
  for (let c = 0; c < count; c++) {
    const price = side === "buy" ? bestAsk() : bestBid();
    if (price === null) break;
    const i = price - D.lo;
    const n = state.book.sizes[price];
    const from = [XOF(i), 0, D.rack.h + D.coin.t / 2 + (n - 1) * D.coin.t];
    state.book.sizes[price] = n - 1;
    if (state.book.sizes[price] === 0) state.book.side[price] = null;
    state.flights.push({ t: -c * 0.12, from, to: [D.tray[0], D.tray[1], 0.9 + D.coin.t / 2 + state.tray * D.coin.t], kind: "take" });
    state.tray++;
    redraw(price);
  }
  status.textContent = side === "buy" ? "Market buy: coins come off the lowest ask." : "Market sell: coins come off the highest bid.";
  say();
  run();
}
// a maker drops a coin onto a spindle: a bid below the mid, an ask above it
function make(price, count = 1) {
  if (!(price in state.book.sizes)) return;
  const b = bestBid(), a = bestAsk();
  const side = state.book.side[price] ?? (a !== null && price >= a ? "ask" : b !== null && price <= b ? "bid" : price < (b !== null && a !== null ? (a + b) / 2 : D.mid0) ? "bid" : "ask");
  for (let c = 0; c < count; c++) {
    const n = state.book.sizes[price] + c;
    const to = [XOF(price - D.lo), 0, D.rack.h + D.coin.t / 2 + n * D.coin.t];
    state.flights.push({ t: -c * 0.14, from: [to[0], to[1], D.spindleTop + 14], to, kind: "make", price, side });
  }
  status.textContent = "Resting order placed at " + price + " cents.";
  run();
}
function reset() {
  state.book = fresh();
  state.flights = [];
  state.tray = 0;
  el.tray.innerHTML = "";
  redrawAll();
  say();
  run();
}
const FLY = 0.55;
function flightPose(f) {
  const t = smooth(0, 1, f.t / FLY);
  if (f.kind === "make") {
    const s = f.t / FLY;
    const z = f.from[2] - (f.from[2] - f.to[2]) * s * s; // a free drop
    return [f.to[0], f.to[1], Math.max(f.to[2], z)];
  }
  const mid = [(f.from[0] + f.to[0]) / 2, (f.from[1] + f.to[1]) / 2, Math.max(f.from[2], f.to[2]) + 22];
  const a = G.lerp3(f.from, mid, t), b = G.lerp3(mid, f.to, t);
  return G.lerp3(a, b, t);
}
function drawFlights() {
  const out = state.flights.filter((f) => f.t >= 0).map((f) => coinAt(flightPose(f), { lit: true })).join("");
  if (el.fly.innerHTML !== out) el.fly.innerHTML = out;
}
function drawTray() {
  const n = state.tray - state.flights.filter((f) => f.kind === "take").length;
  el.tray.innerHTML = Array.from({ length: Math.max(0, n) }, (_, j) => coinAt([D.tray[0], D.tray[1], 0.9 + D.coin.t / 2 + j * D.coin.t])).join("");
}
const TOUR = [[0.8, () => take("buy", 3)], [3.2, () => take("buy", 4)], [6.2, () => make(60, 2)], [7.6, () => make(59, 3)], [9.6, () => take("sell", 5)], [12.6, () => make(61, 2)], [15.5, () => reset()], [16.5, null]];
let touring = !still.matches, tourClock = 0, tourIndex = 0, idle = 0;
function tourStep(dt) {
  tourClock += dt;
  while (tourIndex < TOUR.length && tourClock >= TOUR[tourIndex][0]) {
    const action = TOUR[tourIndex][1];
    tourIndex++;
    if (action) action(); else { tourClock = 0; tourIndex = 0; }
  }
}
function takeOver() { touring = false; clearTimeout(idle); idle = setTimeout(() => { if (still.matches) return; reset(); touring = true; tourClock = 0; tourIndex = 0; run(); }, 9000); }
let frame = 0, last = 0, visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) tourStep(dt);
  let landed = false;
  for (const f of state.flights) {
    f.t += calm ? 10 : dt;
    if (f.t >= FLY) {
      landed = true;
      if (f.kind === "make") {
        state.book.sizes[f.price]++;
        state.book.side[f.price] = f.side;
      }
    }
  }
  if (landed) {
    state.flights = state.flights.filter((f) => f.t < FLY);
    redrawAll();
    drawTray();
    say();
  }
  drawFlights();
  const b = bestBid(), a = bestAsk();
  const want = XOF(((b ?? a ?? D.mid0) + (a ?? b ?? D.mid0)) / 2 - D.lo);
  state.midX = calm || Math.abs(want - state.midX) < 1e-3 ? want : state.midX + (want - state.midX) * (1 - Math.exp(-dt / 0.3));
  el.mid.setAttribute("transform", translateAlong(P, [state.midX, 0, 0]));
  frame = visible && (touring || state.flights.length || state.midX !== want) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const priceAt = (event) => { const box = svg.getBoundingClientRect(); const px = ((event.clientX - box.left) / box.width) * 600; return Math.round(D.lo + ((px - D.railX[0]) / (D.railX[1] - D.railX[0])) * (D.n - 1)); };
stage.addEventListener("pointerdown", (event) => { takeOver(); make(Math.min(D.lo + D.n - 1, Math.max(D.lo, priceAt(event)))); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const kk = event.key;
  if (kk === "b" || kk === "B") (event.preventDefault(), takeOver(), take("buy", event.shiftKey ? 5 : 1));
  else if (kk === "s" || kk === "S") (event.preventDefault(), takeOver(), take("sell", event.shiftKey ? 5 : 1));
  else if (kk === "r" || kk === "R" || kk === "Escape") (event.preventDefault(), takeOver(), reset());
});
redrawAll();
say();
`;
const bb = 58, ba = 61;
const plate = k.plateHtml({
  fig: "Fig 5",
  title: "Order book",
  hint: "Click a spindle: rest an order · B buy · S sell",
  readout: `bid ${bb}¢ ×${BOOK0.bids[bb]} · ask ${ba}¢ ×${BOOK0.asks[ba]} · spread ${ba - bb}¢ · depth ${Object.values(BOOK0.bids).reduce((a, b) => a + b, 0)}/${Object.values(BOOK0.asks).reduce((a, b) => a + b, 0)}`,
  keys: [
    { mark: "lit", label: "The top coin on the best bid and best ask, and the mid pointer between them" },
    { mark: "raised", label: "One spindle per cent; each coin is a share resting at that price" },
  ],
  caption:
    "The order book is every resting order, sorted by price: bids stacked on the spindles below the gap, asks on the ones above it, and the empty spindles between them are the spread. A market buy lifts coins off the lowest ask spindle, first in first out, and when that spindle is bare the next one up becomes the ask, so a large order walks the price up (and widens the spread until makers refill). A maker drops a coin onto an empty spindle inside the gap and the spread closes by a cent. Depth is simply how many coins stand on each side.",
  body: `<div class="iso-stage ob-stage" tabindex="0" role="group" aria-label="Order book rack. Click a spindle to rest an order there; B sends a market buy, S a market sell, R resets the book.">${svg}<span class="mp-sr" role="status" aria-live="polite" data-status></span></div>`,
});
writeFigure({ id: "fig-book", name: "book", plate, css: STAGE_CSS("ob-stage", "pointer"), live: LIVE, title: "Order book" });
console.log("wrote book.html", `${R.items.length} items`);
A.auditOrExit(R, P, {});
