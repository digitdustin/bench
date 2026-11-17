const D = __DATA__;
const P = D.P;
const K = { iso, pathOf, solidSvg, lineSvg, dotsSvg, slabOf, lineOnTop, translateAlong, holdStill, axisVector };
const PARTS = makeParts(K, G, P, { carriage: D.carriage, lever: D.lever, dial: D.dial });
const ROOT = document.getElementById("fig-press");
const stage = ROOT.querySelector(".mp-stage");
const svg = stage.querySelector("svg");
const $ = (sel) => svg.querySelector(sel);
const $$ = (sel) => [...svg.querySelectorAll(sel)];
const at = (p) => iso(p, P);
const readout = ROOT.querySelector("[data-readout]");
const status = ROOT.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const el = {
  carYes: $('[data-part="car-yes"]'),
  carNo: $('[data-part="car-no"]'),
  platesNo: $('[data-part="plates-no"]'),
  rod: $('[data-part="press-rod"]'),
  coins: $$("[data-coin]"),
  lever: $('[data-part="lever"]'),
  needle: $('[data-part="needle"]'),
  val: { yes: $('[data-part="val-yes"]'), no: $('[data-part="val-no"]') },
  ramp: { yes: $('[data-part="tokens-ramp-yes"]'), no: $('[data-part="tokens-ramp-no"]') },
  pad: { yes: $('[data-part="tokens-pad-yes"]'), no: $('[data-part="tokens-pad-no"]') },
  bin: { yes: $('[data-part="tokens-bin-yes"]'), no: $('[data-part="tokens-bin-no"]') },
  sweep: { yes: $('[data-part="sweep-yes"]'), no: $('[data-part="sweep-no"]') },
};
const routes = {};
for (const g of $$("[data-route]")) (routes[g.dataset.route] ??= []).push(g);
for (const list of Object.values(routes)) list.sort((a, b) => a.dataset.chunk - b.dataset.chunk);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const follow = (x, target, dt, tau, calm) => (calm ? target : Math.abs(target - x) < 1e-3 ? target : x + (target - x) * (1 - Math.exp(-dt / tau)));
function settle(s, target, dt, seconds, calm) {
  if (calm) {
    s.x = target;
    s.v = 0;
    return false;
  }
  const w = 1 / seconds;
  for (let i = 0; i < 4; i++) {
    const h = dt / 4;
    s.v += (w * w * (target - s.x) - 2 * w * s.v) * h;
    s.x += s.v * h;
  }
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-4) {
    s.x = target;
    s.v = 0;
    return false;
  }
  return true;
}

// ---- physics of the tokens: a share token slides on its face down the ramp, then across the pad to the pin ----
const GRAV = 9810; // mm/s², the figure is about life size for a bench instrument
const MU = 0.08; // polished steel on a dry ramp
const RAMP = {};
for (const side of ["yes", "no"]) {
  const r = D.ramps[side];
  const sin = -r.dir[2];
  const cos = Math.hypot(r.dir[0], r.dir[1]);
  RAMP[side] = { ...r, acc: GRAV * (sin - MU * cos), sign: side === "yes" ? -1 : 1 };
}
const FLAT_DEC = GRAV * MU;
const PUSH = 60; // mm/s: the ejector's nudge out of the die
const S_START = -(PARTS.COIN_R + 0.6);
const PRESS_T = { pulse: 0.32, down: 0.12, dwell: 0.1, up: 0.3 };
const SWEEP_T = 0.9;

const state = {
  m: M.market(),
  bidTarget: D.market.bid,
  yesX: D.rest.yes,
  noX: D.rest.no,
  press: { phase: "idle", t: 0, pair: 0 },
  rod: 0,
  pulses: [],
  tokens: [],
  pad: { yes: [], no: [] },
  bin: { yes: 0, no: 0 },
  sweep: { yes: { x: 0, v: 0, target: 0 }, no: { x: 0, v: 0, target: 0 } },
  lever: { x: 0, v: 0, target: 0 },
  needle: { x: M.mid(M.market()), v: 0 },
  coins: D.press.hopper.coins,
  clock: 0,
};

const padTop = (side) => D.pads[side].top + PARTS.TOKEN_T / 2 + state.pad[side].length * PARTS.TOKEN_T;
function spawnPair() {
  for (const side of ["yes", "no"]) state.tokens.push({ side, t: 0, stage: "ramp", s: S_START, v: PUSH, x: null, y: D.press.y, z: 0, vy: 0, landed: false });
}
// where a moving token is, and in which painter's slot it belongs
function tokenPose(tk) {
  const r = RAMP[tk.side];
  if (tk.stage === "ramp") {
    const c = G.add3(G.add3(r.start, G.mul3(r.dir, tk.s)), G.mul3(r.up, PARTS.TOKEN_T / 2));
    return { slot: "ramp", p: c, axis: r.up, clip: tk.s < PARTS.COIN_R + 1 };
  }
  if (tk.stage === "flat" || tk.stage === "rest") return { slot: "pad", p: [tk.x, tk.y, tk.z], axis: [0, 0, 1] };
  return { slot: tk.y < D.pads[tk.side].bin.y + D.pads[tk.side].bin.d + 1 ? "bin" : "pad", p: [tk.x, tk.y, tk.z], axis: [0, 0, 1] };
}
function stepToken(tk, dt, calm) {
  const r = RAMP[tk.side];
  const pad = D.pads[tk.side];
  if (tk.stage === "ramp") {
    if (calm) {
      tk.s = r.L;
      tk.v = 0;
    }
    tk.v += r.acc * dt;
    tk.s += tk.v * dt;
    if (tk.s >= r.L) {
      tk.stage = "flat";
      tk.x = r.end[0] + r.sign * (tk.s - r.L);
      tk.z = padTop(tk.side);
      tk.v = tk.v * Math.hypot(r.dir[0], r.dir[1]);
    }
    return;
  }
  if (tk.stage === "flat") {
    tk.v = Math.max(0, tk.v - FLAT_DEC * dt);
    tk.x += r.sign * tk.v * dt;
    tk.z = padTop(tk.side);
    const past = r.sign < 0 ? tk.x <= pad.stopX : tk.x >= pad.stopX;
    if (past || tk.v === 0 || calm) {
      tk.x = pad.stopX;
      tk.stage = "rest";
      tk.landed = true;
    }
    return;
  }
  if (tk.stage === "swept") {
    const edge = pad.at[1] - Math.sqrt(Math.max(0, 6 * 6 - (tk.x - pad.at[0]) ** 2));
    if (tk.y > edge - 0.6) return;
    tk.stage = "fall";
    tk.vy = -40;
  }
  if (tk.stage === "fall") {
    tk.vz = (tk.vz ?? 0) - GRAV * dt;
    tk.z += tk.vz * dt;
    tk.y += tk.vy * dt;
    const floor = pad.binFloor + PARTS.TOKEN_T / 2 + tk.pile * PARTS.TOKEN_T;
    if (tk.z <= floor || calm) {
      tk.z = floor;
      tk.y = Math.max(tk.y, pad.bin.y + 4.6);
      tk.stage = "binned";
    }
  }
}
const CLIP = {};
for (const side of ["yes", "no"]) {
  const x = side === "yes" ? D.press.die.x : D.press.die.x + D.press.die.w;
  const a = at([x, D.press.y, -100]);
  const b = at([x, D.press.y, 300]);
  const dir = side === "yes" ? -400 : 400;
  CLIP[side] = `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${b[0] + dir} ${b[1]}L${a[0] + dir} ${a[1]}Z`;
}
svg.querySelector("defs") || svg.insertAdjacentHTML("afterbegin", "<defs></defs>");
svg.querySelector("defs").insertAdjacentHTML("beforeend", ["yes", "no"].map((s) => `<clipPath id="mp-clip-${s}"><path d="${CLIP[s]}"/></clipPath>`).join(""));

function drawTokens() {
  const out = { ramp: { yes: "", no: "" }, pad: { yes: "", no: "" }, bin: { yes: "", no: "" } };
  const won = state.m.resolved ? state.m.resolved.toLowerCase() : null;
  for (const side of ["yes", "no"]) {
    const pad = D.pads[side];
    state.pad[side].forEach((tk, i) => {
      out.pad[side] += PARTS.token([tk.x, tk.y, pad.top + PARTS.TOKEN_T / 2 + i * PARTS.TOKEN_T], [0, 0, 1], { tone: "hi" });
    });
  }
  const moving = [...state.tokens].sort((a, b) => G.dot3(tokenPose(a).p, D.V) - G.dot3(tokenPose(b).p, D.V));
  for (const tk of moving) {
    const pose = tokenPose(tk);
    const art = PARTS.token(pose.p, pose.axis, { tone: "hi", lit: pose.slot === "ramp" });
    out[pose.slot][tk.side] += pose.clip ? `<g clip-path="url(#mp-clip-${tk.side})">${art}</g>` : art;
  }
  for (const slot of ["ramp", "pad", "bin"]) for (const side of ["yes", "no"]) if (el[slot][side].innerHTML !== out[slot][side]) el[slot][side].innerHTML = out[slot][side];
  for (const side of ["yes", "no"]) el.pad[side].toggleAttribute("data-win", won === side);
}

function pulse(route, seconds) {
  state.pulses.push({ route, t: 0, seconds });
}
function drawPulses(dt) {
  const hot = new Set();
  state.pulses = state.pulses.filter((p) => {
    p.t += dt;
    const list = routes[p.route] ?? [];
    const head = (p.t / p.seconds) * (list.length + 1);
    list.forEach((g, i) => Math.abs(i - head + 0.5) < 1.1 && hot.add(g));
    return p.t < p.seconds * 1.2;
  });
  for (const list of Object.values(routes)) for (const g of list) g.toggleAttribute("data-hot", hot.has(g));
  return state.pulses.length > 0;
}

function showCoins() {
  el.coins.forEach((g, i) => (g.style.display = i < state.coins ? "" : "none"));
}
function showValues() {
  const m = state.m;
  for (const side of ["yes", "no"]) {
    const v = M.valueOf(m, side.toUpperCase());
    const text = (v / 100).toFixed(2);
    if (el.val[side].textContent !== text) el.val[side].textContent = text;
    el.val[side].toggleAttribute("data-win", m.resolved === side.toUpperCase());
  }
}
function rebuildAsks() {
  el.platesNo.innerHTML = PARTS.plates(state.m.asks.map((a) => a.size), 1);
}

// ---- the press cycle: pulse along both wires, stroke down, split, stroke up ----
function pressStep(dt, calm) {
  const pr = state.press;
  const m = state.m;
  const touching = Math.abs(state.yesX - state.noX) < 0.35;
  if (pr.phase === "idle") {
    if (M.crossed(m) && touching && !m.resolved && !state.closing) {
      pr.phase = "pulse";
      pr.t = 0;
      pulse("wire.yes", PRESS_T.pulse);
      pulse("wire.no", PRESS_T.pulse);
    } else return false;
  }
  pr.t += calm ? 10 : dt;
  if (pr.phase === "pulse" && pr.t >= PRESS_T.pulse) (pr.phase = "down"), (pr.t = 0);
  if (pr.phase === "down") {
    state.rod = smooth(0, PRESS_T.down, pr.t);
    if (pr.t >= PRESS_T.down) {
      pr.phase = "dwell";
      pr.t = 0;
      state.rod = 1;
      const level = M.match(m);
      if (level) {
        pr.pair = m.pairs;
        state.coins = Math.max(0, state.coins - 1);
        showCoins();
        spawnPair();
        rebuildAsks();
        showValues();
        status.textContent = `Matched at ${level.p} cents. One dollar split into a YES share and a NO share.`;
      }
    }
  } else if (pr.phase === "dwell" && pr.t >= PRESS_T.dwell) (pr.phase = "up"), (pr.t = 0);
  else if (pr.phase === "up") {
    state.rod = 1 - smooth(0, PRESS_T.up, pr.t);
    if (pr.t >= PRESS_T.up) {
      pr.phase = "idle";
      state.rod = 0;
    }
  }
  return true;
}

let rodShown = -1;
function drawRod() {
  const r = Math.round(state.rod * 200) / 200;
  if (r === rodShown) return;
  rodShown = r;
  const dz = -D.press.rodStroke * r;
  const [dx, dy] = axisVector(P, [0, 0, dz]);
  el.rod.setAttribute("transform", r ? `translate(${dx.toFixed(2)} ${dy.toFixed(2)})` : "");
  holdStill(el.rod, r ? [dx, dy] : [0, 0]);
}
const sweepShown = { yes: -1, no: -1 };
function drawSweep(side) {
  const s = state.sweep[side];
  const share = Math.round(s.x * 400) / 400;
  if (share === sweepShown[side]) return;
  sweepShown[side] = share;
  const [dx, dy] = axisVector(P, [0, -D.sweep.stroke * share, 0]);
  el.sweep[side].setAttribute("transform", share ? `translate(${dx.toFixed(2)} ${dy.toFixed(2)})` : "");
  holdStill(el.sweep[side], share ? [dx, dy] : [0, 0]);
}
let leverShown = null;
function drawLever() {
  const a = Math.round(state.lever.x * 400) / 400;
  if (a === leverShown) return;
  leverShown = a;
  el.lever.innerHTML = PARTS.lever((a * D.lever.swing * Math.PI) / 180);
}
let needleShown = null;
function drawNeedle() {
  const v = Math.round(state.needle.x * 20) / 20;
  if (v === needleShown) return;
  needleShown = v;
  el.needle.setAttribute("d", PARTS.needle(v));
}
let carShown = { yes: null, no: null };
function drawCars() {
  for (const [side, x, node] of [["yes", state.yesX, el.carYes], ["no", state.noX, el.carNo]]) {
    const v = Math.round(x * 50) / 50;
    if (v === carShown[side]) continue;
    carShown[side] = v;
    node.setAttribute("transform", translateAlong(P, [v, 0, 0]));
  }
}

// ---- the sweep after resolution: the losing pad is cleared into its bin ----
function sweepStep(dt, calm) {
  let busy = false;
  for (const side of ["yes", "no"]) {
    const s = state.sweep[side];
    const before = s.x;
    const moving = settle(s, s.target, dt, 0.28, calm);
    busy = busy || moving;
    if (s.target === 1 && s.x > 0.02) {
      const bar = D.sweep.sides[side].bar;
      const barBack = bar.y - D.sweep.stroke * s.x;
      for (const tk of state.tokens) {
        if (tk.side !== side || (tk.stage !== "rest" && tk.stage !== "swept")) continue;
        const want = barBack - PARTS.COIN_R - 0.1;
        if (tk.y > want) {
          tk.y = want;
          tk.stage = "swept";
        }
      }
    }
    if (s.target === 1 && s.x === 1 && !state.tokens.some((tk) => tk.side === side && tk.stage !== "binned")) s.target = 0;
    if (before !== s.x) drawSweep(side);
  }
  return busy;
}

function resolveMarket(outcome) {
  const m = state.m;
  if (m.resolved) return;
  if (state.press.phase !== "idle") {
    state.closing = outcome;
    status.textContent = `Closing the market ${outcome} once the press finishes.`;
    run();
    return;
  }
  state.closing = null;
  M.resolve(m, outcome);
  state.lever.target = outcome === "YES" ? -1 : 1;
  // settled tokens become movable again for the sweep
  for (const side of ["yes", "no"]) {
    state.pad[side].forEach((tk, i) => state.tokens.push({ ...tk, stage: "rest", t: 0, z: D.pads[side].top + PARTS.TOKEN_T / 2 + i * PARTS.TOKEN_T, pile: i }));
    state.pad[side] = [];
  }
  showValues();
  status.textContent = `Resolved ${outcome}. Every ${outcome} share pays $1.00, the other side pays nothing.`;
  run();
}
function reset() {
  state.m = M.market();
  state.bidTarget = state.m.bid;
  state.tokens = [];
  state.pad = { yes: [], no: [] };
  state.press = { phase: "idle", t: 0, pair: 0 };
  state.rod = 0;
  state.coins = D.press.hopper.coins;
  state.lever.target = 0;
  state.swept = false;
  state.closing = null;
  for (const side of ["yes", "no"]) state.sweep[side].target = 0;
  showCoins();
  rebuildAsks();
  showValues();
  drawTokens();
  status.textContent = "New market.";
  run();
}
function setBid(cents) {
  if (state.m.resolved) return;
  state.bidTarget = clamp(Math.round(cents), 0, 100);
  run();
}

function say() {
  const m = state.m;
  const pr = state.press;
  let text;
  if (m.resolved) {
    const n = m.pairs;
    text = n ? `resolved ${m.resolved} · ${n} × ${M.dollars(M.PAYOUT)} = ${M.dollars(M.payout(m))}` : `resolved ${m.resolved} · no shares minted`;
  } else if (pr.phase !== "idle") {
    text = pr.phase === "pulse" ? `bid meets ask at ${M.bestAsk(m)}¢ · circuit closed` : `matched at ${m.last ?? M.bestAsk(m)}¢ · minting pair ${pr.phase === "down" ? m.pairs + 1 : m.pairs}`;
  } else {
    text = `bid ${m.bid}¢ · ask ${M.bestAsk(m)}¢ · spread ${M.spread(m)}¢`;
    if (m.last != null) text += ` · last ${m.last}¢`;
  }
  if (readout.textContent !== text) readout.textContent = text;
}

// ---- the idle tour ----
const TOUR = [
  [0.8, () => setBid(58)],
  [3.2, () => setBid(59)],
  [5.6, () => setBid(61)],
  [10.0, () => setBid(60)],
  [12.6, () => resolveMarket("YES")],
  [19.5, () => reset()],
  [21.0, null],
];
let touring = !still.matches;
let tourClock = 0;
let tourIndex = 0;
let idle = 0;
function tourStep(dt) {
  tourClock += dt;
  while (tourIndex < TOUR.length && tourClock >= TOUR[tourIndex][0]) {
    const action = TOUR[tourIndex][1];
    tourIndex++;
    if (action) action();
    else {
      tourClock = 0;
      tourIndex = 0;
    }
  }
}
function takeOver() {
  touring = false;
  clearTimeout(idle);
  idle = setTimeout(() => {
    if (still.matches) return;
    touring = true;
    tourClock = state.m.resolved ? 19.4 : 0;
    tourIndex = TOUR.findIndex(([t]) => t > tourClock);
    run();
  }, 9000);
}

let frame = 0;
let last = 0;
let visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  state.clock += dt;
  if (touring) tourStep(dt);
  const m = state.m;
  m.bid = state.bidTarget;
  // the jaws: the YES face follows your bid but can never pass the NO face; the NO face sits at the best ask
  const noTarget = D.cx * M.bestAsk(m);
  const yesTarget = Math.min(D.cx * m.bid, noTarget);
  const yesBefore = state.yesX;
  const noBefore = state.noX;
  state.yesX = follow(state.yesX, yesTarget, dt, 0.26, calm);
  state.noX = follow(state.noX, noTarget, dt, 0.22, calm);
  drawCars();
  const pressing = pressStep(dt, calm);
  if (state.closing && state.press.phase === "idle") resolveMarket(state.closing);
  drawRod();
  const pulsing = drawPulses(dt);
  for (const tk of state.tokens) stepToken(tk, calm ? 10 : dt, calm);
  for (const tk of state.tokens) {
    if (tk.landed && tk.stage === "rest" && !m.resolved) {
      tk.landed = false;
      state.pad[tk.side].push(tk);
    }
  }
  state.tokens = state.tokens.filter((tk) => !(tk.stage === "rest" && !m.resolved && state.pad[tk.side].includes(tk)));
  for (const tk of state.tokens) if (tk.stage === "binned" && tk.pile === undefined) tk.pile = 0;
  if (m.resolved && Math.abs(state.lever.x) > 0.9 && !state.swept) {
    state.swept = true;
    state.sweep[m.resolved === "YES" ? "no" : "yes"].target = 1;
  }
  const sweeping = sweepStep(dt, calm);
  const levering = settle(state.lever, state.lever.target, dt, 0.22, calm);
  drawLever();
  const needling = settle(state.needle, m.last ?? M.mid(m), dt, 0.45, calm);
  drawNeedle();
  drawTokens();
  say();
  const tokensMoving = state.tokens.some((tk) => tk.stage !== "rest" && tk.stage !== "binned");
  const alive = touring || pressing || pulsing || tokensMoving || sweeping || levering || needling || state.yesX !== yesTarget || state.noX !== noTarget || yesBefore !== state.yesX || noBefore !== state.noX;
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

// ---- pointer and keys ----
const RAIL_X0 = at([0, 0, D.carriage.deckTop])[0];
const RAIL_X1 = at([200, 0, D.carriage.deckTop])[0];
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  const box = svg.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * 600;
  const cents = ((px - RAIL_X0) / (RAIL_X1 - RAIL_X0)) * 100;
  takeOver();
  setBid(clamp(cents, 0, 100));
});
stage.addEventListener("pointerdown", (event) => {
  const box = svg.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * 600;
  const cents = ((px - RAIL_X0) / (RAIL_X1 - RAIL_X0)) * 100;
  if (event.target.closest('[data-name="lever.arm"]')) {
    takeOver();
    if (state.m.resolved) reset();
    else resolveMarket("YES");
    return;
  }
  takeOver();
  setBid(clamp(cents, 0, 100));
  stage.focus({ preventScroll: true });
});
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  const step = event.shiftKey ? 5 : 1;
  if (key === "ArrowRight" || key === "ArrowUp") (event.preventDefault(), takeOver(), setBid(state.bidTarget + step));
  else if (key === "ArrowLeft" || key === "ArrowDown") (event.preventDefault(), takeOver(), setBid(state.bidTarget - step));
  else if (key === "Home") (event.preventDefault(), takeOver(), setBid(0));
  else if (key === "End") (event.preventDefault(), takeOver(), setBid(100));
  else if (key === "y" || key === "Y") (event.preventDefault(), takeOver(), resolveMarket("YES"));
  else if (key === "n" || key === "N") (event.preventDefault(), takeOver(), resolveMarket("NO"));
  else if (key === "r" || key === "R" || key === "Escape") (event.preventDefault(), takeOver(), reset());
});

showCoins();
showValues();
drawLever();
drawNeedle();
drawCars();
say();
if (still.matches) touring = false;
