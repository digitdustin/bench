// Twelve more Desk themes for the prototype in proto.js. Each one adds a scene (the ground), optional effects drawn
// above the panes (fx), reactions to a finished turn (onDone) and its own reveal edge. Loaded after proto.js, which
// shares THEMES, SCENES, panes, events and the cell-grid helpers through the page's global scope.
(() => {
const TAU = Math.PI * 2
const ageOf = (p, t) => t - p.since
const cx = (p) => p.rect.x + p.rect.w / 2, cy = (p) => p.rect.y + p.rect.h / 2
const cellAt = (x, y) => [Math.floor((x - ox) / cw) - sceneState.i0, Math.floor((y - oy) / LINE) - sceneState.j0]
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const canvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
const cache = {}
const once = (key, fn) => cache[key] || (cache[key] = fn())
// a lit line without shadowBlur: wide faint strokes under a bright core (shadowBlur blurs the whole bounding box)
function glowPath(c, path, color, core, width, a = 1) {
  for (const [w, al] of [[width * 7, .06], [width * 3.6, .14], [width * 1.8, .32]]) { c.globalAlpha = a * al; c.strokeStyle = color; c.lineWidth = w; path(); c.stroke() }
  c.globalAlpha = a; c.strokeStyle = color; c.lineWidth = width; path(); c.stroke()
  if (core) { c.globalAlpha = a * .8; c.strokeStyle = core; c.lineWidth = width * .4; path(); c.stroke() }
}
const rr = (c, x, y, w, h, r) => () => roundRect(c, x, y, w, h, r)
function barRight(p) { return p.rect.x + p.rect.w - 26 }
// the free rows of a pane under its text, counted from the bottom of the text block
function freeRow(p, fromBottom) { return p.ty + (p.rows - fromBottom) * LINE }

const add = (th) => { th.shelf = 'new'; THEMES.push(th); byId[th.id] = th; if (th.scene && th.sceneDef) SCENES[th.scene] = th.sceneDef }

// ======================================================================================== Departures
// A split-flap board. Pane titles are flaps, so a finished turn or a question flips the title into a status.
const FLAP = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:'
const boards = new Map()
function flapTarget(p, t) {
  const title = p.def.title.toUpperCase()
  if (p.state === 'waiting') return [{ s: 'NEEDS YOU', col: '#ffc23d' }, { s: '  ' + title, col: '#efeee6' }]
  if (p.state === 'done' && ageOf(p, t) < 6 && p.k === 0) return [{ s: 'DONE 48S', col: '#5fd38a' }, { s: '  ' + title, col: '#efeee6' }]
  if (p.state === 'done') return [{ s: 'ARRIVED', col: '#5fd38a' }, { s: '  ' + title, col: '#efeee6' }]
  if (p.state === 'working') return [{ s: 'ON TIME', col: '#9cc3ff' }, { s: '  ' + title, col: '#efeee6' }]
  return [{ s: 'IDLE   ', col: '#8f8e88' }, { s: '  ' + title, col: '#efeee6' }]
}
function flapSync(t, fromBlank) {
  for (const p of panes) {
    const n = Math.floor((p.rect.w - 46) / 7.4)
    const want = []; for (const seg of flapTarget(p, t)) for (const ch of seg.s) want.push({ ch, col: seg.col })
    while (want.length < n) want.push({ ch: ' ', col: '#efeee6' })
    want.length = n
    let b = boards.get(p.k)
    if (!b || fromBlank) b = want.map(() => ({ ch: ' ', col: '#efeee6', to: ' ', start: 0, steps: 0 })), boards.set(p.k, b)
    want.forEach((w, q) => { const cell = b[q]; if (cell.to !== w.ch || cell.col !== w.col) { cell.from = cell.ch; cell.to = w.ch; cell.col = w.col; cell.start = t + q * .022 + hash(q + p.k * 31) * .08; cell.steps = 3 + Math.floor(hash(q * 7 + p.k) * 6) } })
  }
}
function flapLive(t) { for (const b of boards.values()) for (const cell of b) if (cell.ch !== cell.to || t < cell.start + cell.steps * .055) return true; return false }
function drawFlaps(c, t, still) {
  c.font = `600 9.5px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'
  for (const p of panes) {
    const b = boards.get(p.k); if (!b) continue
    const y = p.rect.y + 4, h = 14, x0 = p.rect.x + 18
    b.forEach((cell, q) => {
      const x = x0 + q * 7.4
      let ch = cell.ch, f = 0
      if (still) ch = cell.to
      else if (t >= cell.start) {
        const k = (t - cell.start) / .055
        if (k >= cell.steps) ch = cell.ch = cell.to
        else { ch = FLAP[Math.floor(hash(q * 13 + Math.floor(k) * 7 + p.k) * FLAP.length)]; f = k % 1 }
      }
      c.globalAlpha = 1; c.fillStyle = '#1b1c20'; roundRect(c, x, y, 6.6, h, 1.2); c.fill()
      if (ch !== ' ') { c.fillStyle = cell.col; c.save(); c.translate(x + 3.3, y + h / 2 + .5); c.scale(1, f ? Math.max(.12, Math.abs(Math.cos(f * Math.PI))) : 1); c.fillText(ch, 0, 0); c.restore() }
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y + h / 2 - .25, 6.6, .6)
      if (f) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x, y, 6.6, h / 2 * (1 - f)) }
    })
  }
}
add({ id: 'departures', name: 'Departures', scene: 'flaps', fps: 0, ground: '#0e0f11', light: false,
  v: { chrome: 'rgba(12,13,15,.94)', 'chrome-blur': '0px', 'chrome-text': '#efeee6', 'chrome-dim': '#8f8e88', 'chrome-sel': 'rgba(239,238,230,.08)', pane: '#121315', 'pane-clear': 'rgba(18,19,21,.55)', 'pane-edge': 'inset 0 0 0 .5px rgba(255,255,255,.06)', 'bar-text': 'transparent', 'bar-focus': 'transparent', 'tray-bg': 'rgba(20,21,24,.95)', 'tray-text': '#efeee6', 'tray-accent': '#ffc23d', wait: '#ffc23d', 'wait-ring': 'rgba(255,194,61,.55)' },
  c: { text: '#ecebe4', dim: '#8f8e88', subtle: '#34343a', claude: '#ffb02e', success: '#5fd38a', error: '#ff6a5c', warning: '#ffc23d', perm: '#9cc3ff', border: '#55555c', userbg: '#202126', addbg: '#1d3a2a', delbg: '#4a2121', addword: '#2f7a4c', delword: '#9a3a33', eye: '#0e0f11' },
  sceneDef: {
    draw(c) {
      const [tile] = once('flapboard', () => { const [cv, g] = canvas(); g.fillStyle = '#0e0f11'; g.fillRect(0, 0, W, H)
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = cellX(i), y = cellY(j); g.fillStyle = '#16171a'; roundRect(g, x + .4, y + .8, cw - .8, LINE - 1.6, 1); g.fill(); g.fillStyle = '#0b0b0d'; g.fillRect(x + .4, y + LINE / 2 - .3, cw - .8, .6) }
        return [cv] })
      c.globalAlpha = 1; c.drawImage(tile, 0, 0, W, H)
    },
  },
  onApply() { flapSync((performance.now() - t0) / 1000, true) },
  onDone(p, t) { flapSync(t) }, onWork(p) { flapSync((performance.now() - t0) / 1000) },
  live: (t) => { if (panes.some((p) => p.state === 'done' && p.k === 0 && Math.abs(ageOf(p, t) - 6) < .05)) flapSync(t); return flapLive(t) || panes.some((p) => p.state === 'done' && p.k === 0) },
  fx(c, t, now, thumb) { if (thumb && !boards.size) flapSync(t, true); drawFlaps(c, t, thumb) },
  edge(c, x, y, rad, p) {
    c.font = `600 9px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'
    const n = Math.max(10, Math.floor(rad * TAU / 9))
    for (let q = 0; q < n; q++) { const a = q / n * TAU, X = x + Math.cos(a) * rad, Y = y + Math.sin(a) * rad
      c.globalAlpha = 1 - p; c.fillStyle = '#1b1c20'; c.fillRect(X - 3.3, Y - 7, 6.6, 14); c.fillStyle = q % 7 ? '#efeee6' : '#ffc23d'; c.fillText(FLAP[1 + Math.floor(hash(q + Math.floor(p * 18)) * 36)], X, Y + .5) }
  },
})

// ======================================================================================== Thermal
// A heat camera. Work warms a pane, a question keeps it glowing, and a finished pane cools down over a minute.
const THERM = (() => { const stops = [[0, '#06040e'], [.16, '#1a0b39'], [.33, '#4a0f63'], [.48, '#8b1c5c'], [.6, '#c8333a'], [.72, '#ef6a1a'], [.84, '#ffb52a'], [.94, '#ffe98a'], [1, '#fffbe8']]
  const lut = new Uint8ClampedArray(256 * 3)
  for (let k = 0; k < 256; k++) { const v = k / 255; let q = 0; while (q < stops.length - 2 && v > stops[q + 1][0]) q++; const [a, ca] = stops[q], [b, cb] = stops[q + 1], f = (v - a) / (b - a)
    const A = parseInt(ca.slice(1), 16), B = parseInt(cb.slice(1), 16); for (let ch = 0; ch < 3; ch++) { const sh = 16 - ch * 8; lut[k * 3 + ch] = ((A >> sh) & 255) * (1 - f) + ((B >> sh) & 255) * f } }
  return lut })()
const heatOf = (p, t) => {
  if (p.state === 'working') return clamp(.78 + ageOf(p, t) * .008, 0, .96)
  if (p.state === 'waiting') return .66 + .07 * Math.sin(t * 2.2)
  if (p.state === 'done') { const a = ageOf(p, t) + (p.k === 2 ? 40 : 0); return .25 + .62 * Math.exp(-a / 14) }
  return .16
}
const tempOf = (h) => (19 + h * 24).toFixed(1) + '°'
add({ id: 'thermal', name: 'Thermal', scene: 'thermal', fps: 10, ground: '#06040e', light: false,
  v: { chrome: 'rgba(10,6,16,.72)', 'chrome-text': '#f3ece8', 'chrome-dim': '#a493a6', 'chrome-sel': 'rgba(243,236,232,.09)', pane: 'rgba(10,6,16,.82)', 'pane-clear': 'rgba(10,6,16,.34)', 'pane-edge': 'inset 0 0 0 .5px rgba(255,200,150,.14)', 'bar-text': '#a493a6', 'bar-focus': '#fff4ea', 'tray-bg': 'rgba(18,10,26,.9)', 'tray-text': '#f3ece8', 'tray-accent': '#ffb52a', wait: '#ff9c3a' },
  c: { text: '#f3ece8', dim: '#a493a6', subtle: '#3e2f45', claude: '#ff9c3a', success: '#79e0c0', error: '#ff6b7d', warning: '#ffd36a', perm: '#c4a9ff', border: '#6c5672', userbg: '#24182c', addbg: '#173b33', delbg: '#4a1a2a', addword: '#2b7a62', delword: '#9a3150', eye: '#0b0612' },
  sceneDef: {
    draw(c, t) {
      const step = 8, gw = Math.ceil(W / step) + 1, gh = Math.ceil(H / step) + 1
      const [cv, g] = once('therm', () => canvas(gw, gh)), img = g.createImageData(gw, gh)
      const src = panes.map((p) => ({ x: cx(p), y: cy(p), sx: p.rect.w * .42, sy: p.rect.h * .46, h: heatOf(p, t), flare: events.filter((e) => e.pane === p.k).reduce((m, e) => Math.max(m, clamp(1 - (t - e.t) / 3)), 0) }))
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const px = x * step, py = y * step
        let v = .1 + .07 * noise2(px * .01 + t * .05, py * .012 - t * .03)
        for (const s of src) { const dx = (px - s.x) / s.sx, dy = (py - s.y) / s.sy; v += (s.h + s.flare * .25) * Math.exp(-(dx * dx + dy * dy) * .9) }
        if (px < SIDE) v *= .55
        const k = Math.round(clamp(v) * 255) * 3, o = (y * gw + x) * 4
        img.data[o] = THERM[k]; img.data[o + 1] = THERM[k + 1]; img.data[o + 2] = THERM[k + 2]; img.data[o + 3] = 255
      }
      g.putImageData(img, 0, 0)
      c.globalAlpha = 1; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(cv, 0, 0, gw * step, gh * step)
    },
  },
  fx(c, t) {
    // a reading in each pane's title bar, and the camera's scale at the desk's corner
    c.font = `600 9px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'middle'
    for (const p of panes) { const h = heatOf(p, t), k = Math.round(clamp(.35 + h * .65) * 255) * 3; c.globalAlpha = .95; c.fillStyle = `rgb(${THERM[k]},${THERM[k + 1]},${THERM[k + 2]})`; c.fillText(tempOf(h), barRight(p) - 4, p.rect.y + 11.5) }
    const x = W - 22, y0 = H - 150, y1 = H - 40, gr = c.createLinearGradient(0, y1, 0, y0)
    for (let q = 0; q <= 8; q++) { const k = Math.round(q / 8 * 255) * 3; gr.addColorStop(q / 8, `rgb(${THERM[k]},${THERM[k + 1]},${THERM[k + 2]})`) }
    c.globalAlpha = .9; c.fillStyle = gr; c.fillRect(x, y0, 5, y1 - y0); c.fillStyle = '#f3ece8'; c.font = `500 8px ${MONO}`; c.fillText('43°', x - 4, y0 + 3); c.fillText('19°', x - 4, y1 - 3)
    if (hover >= 0) { const p = panes[hover], X = cx(p), Y = cy(p); c.strokeStyle = '#fff4ea'; c.lineWidth = .8; c.globalAlpha = .8; c.beginPath(); c.moveTo(X - 9, Y); c.lineTo(X - 3, Y); c.moveTo(X + 3, Y); c.lineTo(X + 9, Y); c.moveTo(X, Y - 9); c.lineTo(X, Y - 3); c.moveTo(X, Y + 3); c.lineTo(X, Y + 9); c.stroke() }
  },
  live: () => true,
  edge(c, x, y, rad, p) {
    for (const [d, col, w, a] of [[10, '#8b1c5c', 10, .35], [5, '#ef6a1a', 6, .55], [0, '#ffe98a', 2.4, .9], [-2, '#fffbe8', 1, 1]]) { c.globalAlpha = (1 - p) * a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(x, y, Math.max(0, rad - d), 0, TAU); c.stroke() }
  },
})

// ======================================================================================== Greenhouse
// Vines grow up each pane while Claude works on it. A finished turn opens a flower at the tip, and a pane that waits
// on you starts to wilt. Over a long session the desk fills with the work that was done.
const garden = new Map()
function vineFor(p, v = 0) {
  const key = p.k * 10 + v
  if (garden.has(key)) return garden.get(key)
  seed = 101 + p.k * 17 + v * 53
  const [i0, j0] = cellAt(p.tx, p.ty), ci = Math.round((p.tx - ox) / cw) - sceneState.i0
  let i = ci + p.cols - 3 - Math.floor(rand() * 4) - v * Math.floor(p.cols * .2), j = Math.round((p.ty - oy) / LINE) - sceneState.j0 + p.rows - 1, dir = 0
  const pts = [], minI = ci + Math.floor(p.cols * (.5 - v * .15)), maxI = ci + p.cols - 2, top = Math.round((p.ty - oy) / LINE) - sceneState.j0 + 1
  for (let q = 0; q < p.rows * 2.2 && j >= top; q++) {
    pts.push({ i, j, dir, leaf: q > 1 && rand() < .45 ? (rand() < .5 ? -1 : 1) : 0, ph: rand() * TAU })
    const r = rand()
    dir = r < .5 ? 0 : r < .75 ? -1 : 1
    if (i + dir < minI || i + dir > maxI) dir = 0
    i += dir; if (dir === 0 || rand() < .7) j -= 1
  }
  garden.set(key, pts); return pts
}
const growthOf = (p, t) => p.state === 'working' ? clamp(.4 + ageOf(p, t) / 70, 0, 1) : p.state === 'waiting' ? .62 : p.state === 'done' ? .9 : .22
add({ id: 'greenhouse', name: 'Greenhouse', scene: 'garden', fps: 8, ground: '#0b130d', light: false,
  v: { chrome: 'rgba(12,22,15,.68)', 'chrome-text': '#e6efe1', 'chrome-dim': '#8fa38c', 'chrome-sel': 'rgba(230,239,225,.09)', pane: 'rgba(11,19,13,.84)', 'pane-clear': 'rgba(11,19,13,.36)', 'pane-edge': 'inset 0 0 0 .5px rgba(180,230,170,.12)', 'bar-text': '#8fa38c', 'bar-focus': '#eef6ea', 'tray-bg': 'rgba(16,28,19,.92)', 'tray-text': '#e6efe1', 'tray-accent': '#ff8fb1', wait: '#e9c45c' },
  c: { text: '#e6efe1', dim: '#8fa38c', subtle: '#2c3a2c', claude: '#e9a35b', success: '#8fd27a', error: '#ef7d6d', warning: '#e9c45c', perm: '#a9c8f0', border: '#4f6650', userbg: '#18241a', addbg: '#1d3a22', delbg: '#3f2220', addword: '#3c7a3e', delword: '#8c3d34', eye: '#0b130d' },
  sceneDef: {
    draw(c, t) {
      const [bg] = once('soil', () => { const [cv, g] = canvas(); const gr = g.createRadialGradient(W * .6, H * .1, 40, W * .5, H * .5, W * .85); gr.addColorStop(0, '#13241a'); gr.addColorStop(1, '#09100b'); g.fillStyle = gr; g.fillRect(0, 0, W, H)
        g.fillStyle = 'rgba(200,240,190,.05)'; for (let j = 0; j < rows; j += 2) for (let i = 0; i < cols; i += 2) { g.beginPath(); g.arc(cellX(i) + cw / 2, cellY(j) + LINE / 2, .65, 0, TAU); g.fill() } return [cv] })
      c.globalAlpha = 1; c.drawImage(bg, 0, 0, W, H)
      c.font = `10px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'
      for (const p of panes) {
        for (let vi = 0; vi < 2; vi++) {
        const pts = vineFor(p, vi), g = growthOf(p, t) * (vi ? .7 : 1), n = Math.floor(pts.length * g), wilt = p.state === 'waiting'
        for (let q = 0; q < n; q++) {
          const v = pts[q], next = pts[q + 1], x = cellX(v.i) + cw / 2, y = cellY(v.j) + LINE / 2
          if (!(mode === 'clear' && occAt(v.i, v.j))) { c.globalAlpha = .95; c.fillStyle = wilt ? '#a6ad5c' : '#6fb06a'; c.fillText(next && next.i > v.i ? '/' : next && next.i < v.i ? '\\' : '|', x, y) }
          if (v.leaf) {
            const sway = Math.sin(t * 1.3 + v.ph) * .12, droop = wilt ? .9 : 0, a = (v.leaf < 0 ? Math.PI * .85 : Math.PI * .15) + sway + droop * v.leaf * -.6
            const grow = clamp((n - q) / 3), L = 7.4 * grow
            c.save(); c.translate(x + v.leaf * 2.5, y); c.rotate(a); c.globalAlpha = .9; c.fillStyle = wilt ? '#c9b65a' : q % 3 ? '#7fc06a' : '#5fa458'; c.beginPath(); c.ellipse(L * .9, 0, L, L * .42, 0, 0, TAU); c.fill(); c.restore()
          }
        }
        // a flower opens at the tip when a turn finishes; done panes keep theirs
        const bloom = vi ? 0 : p.state === 'done' ? (p.k === 0 ? ease(ageOf(p, t) / 1.2) : 1) : 0
        if (bloom > 0 && n > 0) { const v = pts[n - 1], x = cellX(v.i) + cw / 2, y = cellY(v.j) - 2
          for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + t * .1; c.globalAlpha = .95; c.fillStyle = '#ff8fb1'; c.beginPath(); c.ellipse(x + Math.cos(a) * 3.6 * bloom, y + Math.sin(a) * 3.6 * bloom, 3.2 * bloom, 2.1 * bloom, a, 0, TAU); c.fill() }
          c.fillStyle = '#ffe28a'; c.beginPath(); c.arc(x, y, 1.8 * bloom, 0, TAU); c.fill() }
        if (vi) continue
        else if (p.state === 'working' && n > 0) { const v = pts[n - 1]; c.globalAlpha = .5 + .4 * Math.sin(t * 3); c.fillStyle = '#b7f0a0'; c.beginPath(); c.arc(cellX(v.i) + cw / 2, cellY(v.j) + 2, 1.6, 0, TAU); c.fill() }
        }
      }
      c.globalAlpha = 1
    },
  },
  edge(c, x, y, rad, p) {
    const n = Math.max(10, Math.floor(rad * TAU / 13))
    for (let q = 0; q < n; q++) { const a = q / n * TAU, X = x + Math.cos(a) * rad, Y = y + Math.sin(a) * rad
      c.save(); c.translate(X, Y); c.rotate(a + Math.PI / 2 + Math.sin(q) * .5); c.globalAlpha = (1 - p) * .9; c.fillStyle = q % 9 ? (q % 2 ? '#7fc06a' : '#4f9152') : '#ff8fb1'; c.beginPath(); c.ellipse(0, 0, 5, 2.2, 0, 0, TAU); c.fill(); c.restore() }
  },
})

// ======================================================================================== Stitch
// Denim and gold thread, for an app called Spool. A working pane gets sewn around its edge as Claude works; the needle
// stops and blinks when Claude needs you; a finished pane's seam closes with a knot.
function perimeterPoint(p, f) {
  const x = p.rect.x + 4, y = p.rect.y + 4, w = p.rect.w - 8, h = p.rect.h - 8, per = 2 * (w + h)
  let d = ((f % 1) + 1) % 1 * per
  if (d < w) return [x + d, y, 0]; d -= w
  if (d < h) return [x + w, y + d, 1]; d -= h
  if (d < w) return [x + w - d, y + h, 2]; d -= w
  return [x, y + h - d, 3]
}
function seam(c, p, from, to, color, a) {
  const per = 2 * (p.rect.w + p.rect.h - 16), n = Math.floor(per / 8)
  for (let q = Math.floor(from * n); q < Math.floor(to * n); q++) {
    const [x1, y1] = perimeterPoint(p, q / n), [x2, y2] = perimeterPoint(p, (q + .62) / n)
    c.globalAlpha = a * .5; c.strokeStyle = '#0a1222'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x1 + .5, y1 + .8); c.lineTo(x2 + .5, y2 + .8); c.stroke()
    c.globalAlpha = a; c.strokeStyle = color; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke()
  }
}
function needle(c, x, y, ang, a) {
  c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = a
  c.strokeStyle = '#dfe6f2'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-1, 0); c.lineTo(13, 0); c.stroke()
  c.strokeStyle = '#1a2742'; c.lineWidth = .7; c.beginPath(); c.ellipse(10.5, 0, 1.6, .5, 0, 0, TAU); c.stroke(); c.restore()
}
const sewnOf = (p, t) => p.state === 'working' ? (.12 + ageOf(p, t) * .018) % 1 : p.state === 'waiting' ? .63 : 1
add({ id: 'stitch', name: 'Stitch', scene: 'denim', fps: 0, ground: '#1c2b47', light: false,
  v: { chrome: 'rgba(20,31,54,.74)', 'chrome-text': '#eef1f6', 'chrome-dim': '#9aa6bd', 'chrome-sel': 'rgba(238,241,246,.09)', pane: 'rgba(24,37,63,.9)', 'pane-clear': 'rgba(24,37,63,.44)', 'pane-edge': '0 1px 2px rgba(5,10,20,.45)', 'bar-text': '#9aa6bd', 'bar-focus': '#f6f8fc', 'tray-bg': 'rgba(24,36,62,.94)', 'tray-text': '#eef1f6', 'tray-accent': '#e7b04b', wait: '#f2c46b' },
  c: { text: '#eef1f6', dim: '#9aa6bd', subtle: '#34425e', claude: '#e7b04b', success: '#86d1a6', error: '#f2877f', warning: '#f2c46b', perm: '#a9c1f5', border: '#5a6c90', userbg: '#26385c', addbg: '#1f4a43', delbg: '#4b2a3c', addword: '#2f7a66', delword: '#94456a', eye: '#1a2742' },
  sceneDef: {
    draw(c) {
      const [cloth] = once('denim', () => { const [cv, g] = canvas(); g.fillStyle = '#1c2b47'; g.fillRect(0, 0, W, H); seed = 33
        g.lineWidth = 1; for (let d = -H; d < W; d += 2.6) { g.strokeStyle = `rgba(${150 + rand() * 60},${170 + rand() * 50},${220},${.06 + rand() * .08})`; g.beginPath(); g.moveTo(d, 0); g.lineTo(d + H * .55, H); g.stroke() }
        for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(225,232,245,${rand() * .06})`; g.fillRect(rand() * W, rand() * H, 1 + rand() * 9, .7) }
        const v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H); return [cv] })
      c.globalAlpha = 1; c.drawImage(cloth, 0, 0, W, H)
    },
  },
  live: () => true,
  fx(c, t, now, thumb) {
    for (const p of panes) {
      const done = p.state === 'done', idle = p.state === 'idle'
      const flash = p.k === 0 && done ? ease(ageOf(p, t) / .7) : 1
      if (p.state === 'working' || p.state === 'waiting') {
        const f = sewnOf(p, t)
        seam(c, p, 0, f, p.state === 'waiting' ? '#f2c46b' : '#e7b04b', .95)
        seam(c, p, f, 1, '#3a4b6e', .5)
        const [x, y, side] = perimeterPoint(p, f), ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2][side]
        const bob = p.state === 'working' ? Math.sin(t * 14) * 1.3 : 0, blink = p.state === 'waiting' ? .45 + .55 * (Math.sin(t * 4) > 0 ? 1 : .2) : 1
        needle(c, x + Math.cos(ang) * 2, y + Math.sin(ang) * 2 + bob, ang, thumb ? 1 : blink)
      } else {
        seam(c, p, 0, done ? flash : 1, done ? '#e7b04b' : '#8a7a5a', idle ? .6 : .95)
        if (done && flash >= 1) { const [x, y] = perimeterPoint(p, 0); c.globalAlpha = 1; c.fillStyle = '#e7b04b'; c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); c.strokeStyle = '#e7b04b'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 6, y + 8, x - 2, y + 13); c.stroke() }
      }
    }
  },
  edge(c, x, y, rad, p) {
    const n = Math.max(8, Math.floor(rad * TAU / 8))
    for (let q = 0; q < n; q++) { const a1 = q / n * TAU, a2 = (q + .6) / n * TAU; c.globalAlpha = (1 - p) * .95; c.strokeStyle = '#e7b04b'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, rad, a1, a2); c.stroke() }
    needle(c, x + Math.cos(p * 9) * rad, y + Math.sin(p * 9) * rad, p * 9 + Math.PI / 2, 1 - p)
  },
})

// ======================================================================================== Riso
// A two-ink risograph print, fluorescent pink and blue, slightly out of register. A finished pane gets stamped.
function halftone(g, cxp, cyp, r, color, angle, dx, dy, k = 1) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = color
  const step = 5.2, ca = Math.cos(angle), sa = Math.sin(angle), R = r * 1.1
  for (let u = -R; u < R; u += step) for (let v = -R; v < R; v += step) {
    const x = cxp + u * ca - v * sa + dx, y = cyp + u * sa + v * ca + dy, d = Math.hypot(x - cxp - dx, y - cyp - dy) / r
    if (d > 1) continue
    const s = (1 - d * d) * 2.6 * k; if (s < .25) continue
    g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill()
  }
  g.restore()
}
function stamp(c, x, y, text, color, rot, s = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
  c.font = `800 13px -apple-system, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
  const w = c.measureText(text).width + 16
  c.globalAlpha = .9; c.strokeStyle = color; c.lineWidth = 2; roundRect(c, -w / 2, -11, w, 22, 3); c.stroke(); c.fillStyle = color; c.fillText(text, 0, 1)
  // worn rubber: knock small holes out of the ink
  c.globalCompositeOperation = 'destination-out'; seed = 77; for (let k = 0; k < 40; k++) { c.globalAlpha = .5 + rand() * .5; c.beginPath(); c.arc(-w / 2 + rand() * w, -11 + rand() * 22, rand() * 1.1, 0, TAU); c.fill() }
  c.restore()
}
add({ id: 'riso', name: 'Riso', scene: 'riso', fps: 0, ground: '#f4efe4', light: true,
  v: { chrome: 'rgba(244,239,228,.88)', 'chrome-blur': '8px', 'chrome-text': '#1d2f7a', 'chrome-dim': '#6f7fb5', 'chrome-sel': 'rgba(29,47,122,.08)', pane: '#fffdf8', 'pane-clear': 'rgba(255,253,248,.84)', 'pane-edge': '2px 2px 0 rgba(255,72,176,.5), -1px -1px 0 rgba(0,120,191,.4)', 'bar-text': '#6f7fb5', 'bar-focus': '#1d2f7a', 'bar-rule': 'inset 0 -1px 0 rgba(29,47,122,.1)', 'tray-bg': 'rgba(250,247,240,.95)', 'tray-text': '#1d2f7a', 'tray-accent': '#ff48b0', 'tray-edge': 'rgba(29,47,122,.18)', wait: '#0078bf', 'wait-ring': 'rgba(0,120,191,.6)' },
  c: { text: '#1d2f7a', dim: '#6f7fb5', subtle: '#c9cfe6', claude: '#e0369a', success: '#00838a', error: '#c81e4a', warning: '#b86e00', perm: '#0078bf', border: '#9fb0d8', userbg: '#ffe3f1', addbg: '#d9eefb', delbg: '#ffdbe9', addword: '#9fd2f2', delword: '#ffb0d2', eye: '#f4efe4' },
  sceneDef: {
    draw(c) {
      const key = 'riso:' + panes.map((p) => p.state).join()
      const [cv] = once(key, () => { const [cv, g] = canvas(); g.fillStyle = '#f4efe4'; g.fillRect(0, 0, W, H); seed = 8
        for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(90,70,40,${rand() * .07})`; g.fillRect(rand() * W, rand() * H, 1, 1) }
        halftone(g, 300, 120, 220, '#ff48b0', .26, 0, 0); halftone(g, 930, 560, 260, '#0078bf', 1.3, 0, 0); halftone(g, 640, 360, 150, '#ff48b0', .26, 0, 0, .7); halftone(g, 660, 350, 150, '#0078bf', 1.3, 2.5, -2, .5)
        for (const p of panes) { if (p.state === 'working') halftone(g, p.rect.x + p.rect.w, p.rect.y + p.rect.h, 170, '#ff48b0', .26, 0, 0, 1.2); if (p.state === 'waiting') halftone(g, cx(p), cy(p), 190, '#0078bf', 1.3, 0, 0, 1) }
        return [cv] })
      c.globalAlpha = 1; c.drawImage(cv, 0, 0, W, H)
    },
  },
  live: (t) => panes.some((p) => p.state === 'done' && p.k === 0 && ageOf(p, t) < .4),
  fx(c, t) { for (const p of panes) if (p.state === 'done') { const a = p.k === 0 ? ageOf(p, t) : 9, s = a < .18 ? 1.5 - a / .18 * .5 : 1; if (a >= 0) stamp(c, p.rect.x + p.rect.w - 70, p.rect.y + p.rect.h - 56, p.k === 0 ? 'DONE · 48S' : 'DONE', '#ff48b0', -.12, s) } },
  edge(c, x, y, rad, p) {
    for (const [col, dx, dy] of [['#ff48b0', 0, 0], ['#0078bf', 2.5, -2]]) { c.globalAlpha = (1 - p) * .85; c.fillStyle = col; c.globalCompositeOperation = 'multiply'
      const n = Math.max(12, Math.floor(rad * TAU / 6)); for (let q = 0; q < n; q++) { const a = q / n * TAU; for (let k = 0; k < 3; k++) { const r2 = rad - k * 6; c.beginPath(); c.arc(x + dx + Math.cos(a) * r2, y + dy + Math.sin(a) * r2, 2.2 - k * .6, 0, TAU); c.fill() } } }
    c.globalCompositeOperation = 'source-over'
  },
})

// ======================================================================================== Sumi
// Ink on washi. Ink spreads under a pane while Claude works; a question gets an ensō around the pane's dot; a finished
// pane is sealed with a vermilion hanko.
function brush(c, x, y, r, a0, sweep, w, color, alpha) {
  const n = Math.max(12, Math.floor(Math.abs(sweep) * r / 2))
  for (let q = 0; q < n; q++) { const f = q / n, a = a0 + sweep * f, press = Math.sin(Math.PI * Math.min(1, f * 1.15)) * (1 - f * .45)
    c.globalAlpha = alpha * (.65 + .35 * press); c.fillStyle = color; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(.3, w * press), 0, TAU); c.fill()
    if (q % 3 === 0) { c.globalAlpha = alpha * .25; c.beginPath(); c.arc(x + Math.cos(a) * (r + w * .7), y + Math.sin(a) * (r + w * .7), .5, 0, TAU); c.fill() } }
}
function hanko(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
  c.globalAlpha = .92; c.fillStyle = '#c4432b'; roundRect(c, -12, -12, 24, 24, 3); c.fill()
  c.fillStyle = '#f7f2e8'; c.font = '700 15px "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('済', 0, 1)
  c.globalCompositeOperation = 'destination-out'; seed = 55; for (let k = 0; k < 30; k++) { c.globalAlpha = rand(); c.beginPath(); c.arc(-12 + rand() * 24, -12 + rand() * 24, rand() * 1.3, 0, TAU); c.fill() }
  c.restore()
}
add({ id: 'sumi', name: 'Sumi', scene: 'sumi', fps: 6, ground: '#efe8db', light: true,
  v: { chrome: 'rgba(239,232,219,.92)', 'chrome-blur': '6px', 'chrome-text': '#1f1b17', 'chrome-dim': '#7d7468', 'chrome-sel': 'rgba(31,27,23,.07)', pane: '#f7f2e8', 'pane-clear': 'rgba(247,242,232,.66)', 'pane-edge': '0 0 0 .5px rgba(31,27,23,.16), 0 1px 2px rgba(31,27,23,.08)', 'bar-text': '#7d7468', 'bar-focus': '#1f1b17', 'bar-rule': 'inset 0 -1px 0 rgba(31,27,23,.07)', 'tray-bg': 'rgba(244,238,227,.96)', 'tray-text': '#1f1b17', 'tray-accent': '#c4432b', 'tray-edge': 'rgba(31,27,23,.16)', wait: '#b8801a' },
  c: { text: '#1f1b17', dim: '#7d7468', subtle: '#d3cabb', claude: '#c4432b', success: '#3f6f4a', error: '#b0302a', warning: '#9a6a12', perm: '#3b5b8c', border: '#b9ae9c', userbg: '#e6ddcd', addbg: '#dbe6d3', delbg: '#f1d9d2', addword: '#b9d3a9', delword: '#e8b3a6', eye: '#efe8db' },
  tex() { return once('washi', () => { const [cv, g] = canvas(240, 240); seed = 61; for (let k = 0; k < 120; k++) { const x = rand() * 240, y = rand() * 240, a = rand() * TAU, l = 10 + rand() * 40; g.strokeStyle = `rgba(150,130,100,${.05 + rand() * .06})`; g.lineWidth = .5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + Math.cos(a) * l * .3 + 6, y + Math.sin(a) * l * .3, x + Math.cos(a + .5) * l * .6, y + Math.sin(a + .5) * l * .6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke() } return cv.toDataURL() }) },
  sceneDef: {
    draw(c, t) {
      const [base] = once('washi-ground', () => { const [cv, g] = canvas(); g.fillStyle = '#efe8db'; g.fillRect(0, 0, W, H); seed = 4
        g.filter = 'blur(26px)'; for (const [x, y, r, a] of [[300, 520, 190, .3], [900, 140, 230, .24], [640, 610, 130, .2], [120, 140, 150, .14], [560, 250, 90, .12]]) { g.fillStyle = `rgba(30,26,22,${a})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }
        g.filter = 'none'; for (let k = 0; k < 400; k++) { const x = rand() * W, y = rand() * H, a = rand() * TAU, l = 8 + rand() * 30; g.strokeStyle = `rgba(140,120,90,${.05 + rand() * .07})`; g.lineWidth = .5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .7) * l / 2, y + Math.sin(a + .7) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke() }
        return [cv] })
      c.globalAlpha = 1; c.drawImage(base, 0, 0, W, H)
      // ink spreading under a working pane, a little further with every second of work
      for (const p of panes) if (p.state === 'working') {
        const r = Math.min(p.rect.w * .6, 60 + ageOf(p, t) * 4)
        for (let k = 0; k < 7; k++) { const a = k * 2.1 + t * .05, d = r * .25, gr = c.createRadialGradient(cx(p) + Math.cos(a) * d, cy(p) + Math.sin(a) * d, 0, cx(p) + Math.cos(a) * d, cy(p) + Math.sin(a) * d, r * (.7 + hash(k) * .4))
          gr.addColorStop(0, 'rgba(25,22,20,.24)'); gr.addColorStop(.7, 'rgba(25,22,20,.09)'); gr.addColorStop(1, 'rgba(25,22,20,0)'); c.fillStyle = gr; c.fillRect(p.rect.x - r, p.rect.y - r, p.rect.w + 2 * r, p.rect.h + 2 * r) }
      }
    },
  },
  live: (t) => panes.some((p) => p.state === 'done' && p.k === 0 && ageOf(p, t) < .4),
  fx(c, t) {
    for (const p of panes) {
      if (p.state === 'waiting') { brush(c, p.rect.x + 11.5, p.rect.y + 11, 7.5, -1.2, TAU * .9, 1.3, '#1f1b17', .85); brush(c, p.rect.x + p.rect.w - 46, p.rect.y + p.rect.h - 46, 26, -1.4, TAU * .92, 3.2, '#1f1b17', .8) }
      if (p.state === 'done') { const a = p.k === 0 ? ageOf(p, t) : 9; if (a >= 0) hanko(c, p.rect.x + p.rect.w - 28, p.rect.y + p.rect.h - 28, a < .16 ? 1.4 - a / .16 * .4 : 1, -.08 + p.k * .05) }
    }
  },
  edge(c, x, y, rad, p) { brush(c, x, y, rad, -1.9 + p * .6, TAU * .93, 6 * (1 - p * .5), '#1f1b17', 1 - p) },
})

// ======================================================================================== Constellation
// Every finished turn becomes a star, and each chat's stars join into its own constellation, named after the chat.
// The sky remembers the session: Finish a turn adds a star that stays.
const skies = new Map()
function skyFor(p) {
  if (skies.has(p.k)) return skies.get(p.k)
  seed = 400 + p.k * 29
  const n = [4, 3, 6, 5][p.k] ?? 4, pts = []
  let x = p.rect.x + p.rect.w * (.55 + rand() * .15), y = p.rect.y + p.rect.h * (.35 + rand() * .2)
  for (let q = 0; q < n; q++) { pts.push({ x, y, m: .55 + rand() * .6, born: -99 }); const a = rand() * TAU; x = clamp(x + Math.cos(a) * (28 + rand() * 30), p.rect.x + p.rect.w * .45, p.rect.x + p.rect.w - 16); y = clamp(y + Math.sin(a) * (20 + rand() * 24), p.rect.y + 30, p.rect.y + p.rect.h - 22) }
  skies.set(p.k, pts); return pts
}
function nextStar(p) { const pts = skyFor(p), last = pts[pts.length - 1]; seed = 900 + pts.length * 13 + p.k; const a = rand() * TAU; return { x: clamp(last.x + Math.cos(a) * 34, p.rect.x + p.rect.w * .42, p.rect.x + p.rect.w - 16), y: clamp(last.y + Math.sin(a) * 26, p.rect.y + 30, p.rect.y + p.rect.h - 22), m: .9, born: -99 } }
function starShape(c, x, y, r, a, col) { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = a * .5; c.strokeStyle = col; c.lineWidth = .6; c.beginPath(); c.moveTo(x - r * 3.2, y); c.lineTo(x + r * 3.2, y); c.moveTo(x, y - r * 3.2); c.lineTo(x, y + r * 3.2); c.stroke() }
add({ id: 'constellation', name: 'Constellation', scene: 'sky', fps: 12, ground: '#070a18', light: false,
  v: { chrome: 'rgba(8,11,26,.7)', 'chrome-text': '#e9ecf8', 'chrome-dim': '#8d94b3', 'chrome-sel': 'rgba(233,236,248,.08)', pane: 'rgba(9,12,28,.84)', 'pane-clear': 'rgba(9,12,28,.34)', 'pane-edge': 'inset 0 0 0 .5px rgba(190,205,255,.12)', 'bar-text': '#8d94b3', 'bar-focus': '#f2f4fc', 'tray-bg': 'rgba(14,18,40,.9)', 'tray-text': '#e9ecf8', 'tray-accent': '#f2b68c', wait: '#f5cf7a' },
  c: { text: '#e9ecf8', dim: '#8d94b3', subtle: '#262c48', claude: '#f2b68c', success: '#8fd8c0', error: '#ff8b94', warning: '#f5cf7a', perm: '#b4c2ff', border: '#4a5277', userbg: '#161c35', addbg: '#173a3a', delbg: '#3f1f33', addword: '#2b7471', delword: '#8d3a5c', eye: '#0a0e20' },
  sceneDef: {
    init(s) { seed = 12; s.bg = []; for (let k = 0; k < 520; k++) s.bg.push({ x: rand() * W, y: rand() * H, r: rand() < .9 ? .5 + rand() * .5 : 1 + rand() * .6, ph: rand() * TAU, sp: .6 + rand() * 2 }) },
    draw(c, t, s) {
      const [sky] = once('sky', () => { const [cv, g] = canvas(); const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0b1230'); gr.addColorStop(1, '#05070f'); g.fillStyle = gr; g.fillRect(0, 0, W, H)
        g.save(); g.translate(W * .5, H * .5); g.rotate(-.5); g.filter = 'blur(30px)'; g.fillStyle = 'rgba(120,140,220,.12)'; g.beginPath(); g.ellipse(0, 0, W * .7, 70, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(200,170,220,.06)'; g.beginPath(); g.ellipse(80, 10, W * .4, 36, 0, 0, TAU); g.fill(); g.restore(); return [cv] })
      c.globalAlpha = 1; c.drawImage(sky, 0, 0, W, H)
      for (const st of s.bg) { const [i, j] = cellAt(st.x, st.y); if (mode === 'clear' && occAt(i, j)) continue; c.globalAlpha = .35 + .4 * (.5 + .5 * Math.sin(t * st.sp + st.ph)); c.fillStyle = '#dfe6ff'; c.beginPath(); c.arc(st.x, st.y, st.r, 0, TAU); c.fill() }
      c.font = `600 7.5px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle'
      for (const p of panes) {
        const pts = skyFor(p)
        c.globalAlpha = .6; c.strokeStyle = '#a9bbff'; c.lineWidth = .9; c.beginPath()
        pts.forEach((q, n) => { const f = clamp((t - q.born) / .9); if (n === 0) c.moveTo(q.x, q.y); else { const pr = pts[n - 1]; c.lineTo(pr.x + (q.x - pr.x) * f, pr.y + (q.y - pr.y) * f); c.moveTo(q.x, q.y) } }); c.stroke()
        pts.forEach((q, n) => { const age = t - q.born, flare = age < 1.6 ? 1 - age / 1.6 : 0, last = n === pts.length - 1
          const col = last && p.state === 'waiting' ? '#f5cf7a' : '#eef2ff', a = last && p.state === 'waiting' ? .55 + .45 * Math.sin(t * 4) : .95
          starShape(c, q.x, q.y, 1.8 * q.m + flare * 2.4, a, col); if (flare) { c.globalAlpha = flare * .3; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(q.x, q.y, 10 * flare + 3, 0, TAU); c.fill() } })
        if (p.state === 'working') { const nx = nextStar(p), pulse = .5 + .5 * Math.sin(t * 2.6); const gr = c.createRadialGradient(nx.x, nx.y, 0, nx.x, nx.y, 12); gr.addColorStop(0, `rgba(242,182,140,${.35 * pulse})`); gr.addColorStop(1, 'rgba(242,182,140,0)'); c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(nx.x - 12, nx.y - 12, 24, 24) }
        c.globalAlpha = .55; c.fillStyle = '#b8c3ef'; c.fillText(p.def.title.toUpperCase().split('').join(' '), pts[0].x + 7, pts[0].y + 10)
      }
    },
  },
  onDone(p, t) { const pts = skyFor(p), nx = nextStar(p); nx.born = t; pts.push(nx) },
  edge(c, x, y, rad, p) {
    const n = Math.max(10, Math.floor(rad * TAU / 10))
    for (let q = 0; q < n; q++) { const a = q / n * TAU + hash(q) * .2, r2 = rad + (hash(q * 3) - .5) * 10; starShape(c, x + Math.cos(a) * r2, y + Math.sin(a) * r2, q % 6 ? .8 : 1.5, (1 - p) * (.5 + .5 * hash(q + Math.floor(p * 12))), '#eef2ff') }
  },
})

// ======================================================================================== Rain
// A city at night through a wet window. Drops run down the glass around the text; a pane left alone fogs over; a
// finished turn wipes its pane clear.
const drops = []
function dropNew(any) { return { x: SIDE + rand() * (W - SIDE), y: any ? rand() * H : -10 - rand() * 60, r: 1.6 + rand() * 2.8, v: 0, hold: rand() * 2, trail: [] } }
const fogOf = (p, t) => p.state === 'working' ? 0 : p.state === 'done' ? (p.k === 0 ? clamp((ageOf(p, t) - .8) / 30) * .5 : .42) : p.state === 'waiting' ? .16 : .5
function bead(c, x, y, r, a) {
  c.globalAlpha = a * .55; c.fillStyle = 'rgba(8,12,20,1)'; c.beginPath(); c.arc(x + .3, y + .6, r, 0, TAU); c.fill()
  const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.35, 'rgba(190,210,235,.35)'); g.addColorStop(1, 'rgba(150,170,200,.12)')
  c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
}
add({ id: 'rain', name: 'Rain', scene: 'rain', fps: 0, ground: '#0c1119', light: false,
  v: { chrome: 'rgba(12,17,25,.6)', 'chrome-blur': '24px', 'chrome-text': '#e8eef4', 'chrome-dim': '#8f9bab', 'chrome-sel': 'rgba(232,238,244,.1)', pane: 'rgba(12,17,25,.72)', 'pane-clear': 'rgba(12,17,25,.46)', 'pane-filter': 'blur(3px)', 'pane-edge': 'inset 0 0 0 .5px rgba(200,220,255,.14)', 'bar-text': '#8f9bab', 'bar-focus': '#f2f6fa', 'tray-bg': 'rgba(16,22,32,.86)', 'tray-text': '#e8eef4', 'tray-accent': '#ffb15c', wait: '#ffb15c', 'wait-ring': 'rgba(255,177,92,.6)', 'wait-glow': 'rgba(255,177,92,.3)' },
  c: { text: '#e8eef4', dim: '#8f9bab', subtle: '#2a3442', claude: '#ffb15c', success: '#7fd6b5', error: '#ff7f7a', warning: '#ffd27a', perm: '#a8c4ff', border: '#566475', userbg: '#1a2230', addbg: '#183a35', delbg: '#43222a', addword: '#2c7564', delword: '#8e3b4b', eye: '#0c1119' },
  sceneDef: {
    draw(c, t) {
      const [city] = once('city', () => { const [cv, g] = canvas(); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#111a2a'); gr.addColorStop(1, '#0a0e16'); g.fillStyle = gr; g.fillRect(0, 0, W, H); seed = 71
        g.filter = 'blur(14px)'; for (let k = 0; k < 90; k++) { const y = H * (.35 + rand() * .65), x = rand() * W, r = 6 + rand() * 22, pick = rand(); g.fillStyle = pick < .45 ? `rgba(255,177,92,${.25 + rand() * .3})` : pick < .62 ? `rgba(255,90,79,${.3 + rand() * .3})` : pick < .8 ? `rgba(79,209,197,${.2 + rand() * .25})` : `rgba(230,236,255,${.2 + rand() * .25})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }
        g.filter = 'none'; return [cv] })
      c.globalAlpha = 1; c.drawImage(city, 0, 0, W, H)
      for (const p of panes) { const f = fogOf(p, t); if (f > .01) { c.globalAlpha = f; c.fillStyle = '#9aa7b8'; c.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h) } }
      // a waiting pane's window has a warm light behind it
      for (const p of panes) if (p.state === 'waiting') paneHalo(c, p, '#ffb15c', .14, 1)
    },
  },
  live: () => true,
  fx(c, t, now, thumb) {
    if (!drops.length) { seed = 5; for (let k = 0; k < 70; k++) drops.push(dropNew(true)) }
    const dt = thumb ? 0 : Math.min(.05, (now - (drops.last || now)) / 1000); drops.last = now
    for (const d of drops) {
      if (d.hold > 0) d.hold -= dt; else { d.v = Math.min(160, d.v + dt * (30 + d.r * 40)); d.y += d.v * dt; d.x += Math.sin(d.y * .05) * .15; if (rand() < dt * .6) { d.hold = rand() * 1.4; d.v = 0 } }
      if (!thumb && d.v > 20 && rand() < .5) d.trail.push([d.x, d.y, d.r * .35]); if (d.trail.length > 14) d.trail.shift()
      if (d.y > H + 10) Object.assign(d, dropNew(false), { trail: [] })
      const [i, j] = cellAt(d.x, d.y); if (mode === 'clear' && occAt(i, j)) continue
      for (const [x, y, r] of d.trail) bead(c, x, y, r, .5)
      bead(c, d.x, d.y, d.r, .85)
    }
    // the wiper: a finished pane is swept clear in an arc from its bottom corner
    for (const p of panes) if (p.state === 'done' && p.k === 0) { const a = ageOf(p, t); if (a > 0 && a < .9) { const f = ease(a / .7), ang = -Math.PI + f * Math.PI, L = Math.hypot(p.rect.w, p.rect.h) * .9
      c.save(); c.beginPath(); c.rect(p.rect.x, p.rect.y, p.rect.w, p.rect.h); c.clip(); c.translate(cx(p), p.rect.y + p.rect.h); c.rotate(ang); c.globalAlpha = (1 - a / .9) * .9; c.fillStyle = '#e8eef4'; c.fillRect(0, -1.5, L, 3); c.globalAlpha *= .3; c.fillRect(0, -7, L, 12); c.restore() } }
  },
  edge(c, x, y, rad, p) { seed = 3; const n = Math.max(10, Math.floor(rad * TAU / 12)); for (let q = 0; q < n; q++) { const a = q / n * TAU + rand() * .2, r2 = rad + (rand() - .5) * 12; bead(c, x + Math.cos(a) * r2, y + Math.sin(a) * r2, 1 + rand() * 2.2, 1 - p) } },
})

// ======================================================================================== Neon
// Each pane is outlined in a neon tube on a dark wall. Work lights it pink, a question makes it buzz amber, and a
// finished turn strikes it green. A pane with nothing going on is an unlit tube.
function tube(p, inset = 2.5) { return (c) => () => roundRect(c, p.rect.x + inset, p.rect.y + inset, p.rect.w - inset * 2, p.rect.h - inset * 2, 6) }
function flicker(t, k, rate) { const n = Math.floor(t * rate); return hash(n * 7.1 + k) < .12 ? .25 : 1 }
add({ id: 'neon', name: 'Neon', scene: 'wall', fps: 0, ground: '#120e14', light: false,
  v: { chrome: 'rgba(16,12,18,.9)', 'chrome-text': '#f5e8f1', 'chrome-dim': '#a28ea0', 'chrome-sel': 'rgba(245,232,241,.08)', pane: 'rgba(16,12,18,.9)', 'pane-clear': 'rgba(16,12,18,.74)', 'bar-text': '#a28ea0', 'bar-focus': '#fff3fa', 'tray-bg': 'rgba(22,16,24,.94)', 'tray-text': '#f5e8f1', 'tray-accent': '#ff3fa4', wait: '#ffb13b' },
  c: { text: '#f5e8f1', dim: '#a28ea0', subtle: '#3b2c3a', claude: '#ff6fb5', success: '#5dffa5', error: '#ff5c6c', warning: '#ffc24d', perm: '#9ab8ff', border: '#6b5368', userbg: '#241a24', addbg: '#183829', delbg: '#47192b', addword: '#2b7a4f', delword: '#9a2e57', eye: '#120e14' },
  sceneDef: {
    draw(c) {
      const [wall] = once('brick', () => { const [cv, g] = canvas(); g.fillStyle = '#120e14'; g.fillRect(0, 0, W, H); seed = 14
        for (let y = 0, r = 0; y < H; y += 15, r++) for (let x = (r % 2) * -22; x < W; x += 44) { g.fillStyle = `rgba(${60 + rand() * 30},${36 + rand() * 14},${50 + rand() * 20},${.22 + rand() * .14})`; g.fillRect(x + 1, y + 1, 42, 13) }
        const v = g.createRadialGradient(W * .6, H * .5, 50, W * .6, H * .5, W * .7); v.addColorStop(0, 'rgba(120,40,110,.12)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = v; g.fillRect(0, 0, W, H); return [cv] })
      c.globalAlpha = 1; c.drawImage(wall, 0, 0, W, H)
      // light spilling on the wall from each lit tube
      for (const p of panes) { const col = p.state === 'working' ? '#ff3fa4' : p.state === 'waiting' ? '#ffb13b' : p.state === 'done' ? '#4dff9a' : null; if (col) paneHalo(c, p, col, .16, 1.15) }
    },
  },
  live: () => true,
  fx(c, t) {
    for (const p of panes) {
      const path = tube(p)(c)
      if (p.state === 'idle') { c.globalAlpha = .7; c.strokeStyle = '#3d2f3d'; c.lineWidth = 2.2; path(); c.stroke(); c.globalAlpha = .25; c.strokeStyle = '#9a8296'; c.lineWidth = .6; path(); c.stroke(); continue }
      let col = '#ff3fa4', core = '#ffd0ea', a = .9 + .1 * Math.sin(t * 9 + p.k)
      if (p.state === 'waiting') { col = '#ffb13b'; core = '#fff0cc'; a *= flicker(t, p.k, 14) }
      if (p.state === 'done') { col = '#4dff9a'; core = '#d9ffe9'; const age = p.k === 0 ? ageOf(p, t) : 9; if (age < .7) a *= [1, 0, .8, 0, 0, 1, .3, 1][Math.floor(age / .7 * 8)] ?? 1 }
      glowPath(c, path, col, core, 1.8, a)
    }
  },
  edge(c, x, y, rad, p) { const a = p < .2 ? [1, 0, .7, 0, 1][Math.floor(p / .2 * 5)] : 1 - p; glowPath(c, () => { c.beginPath(); c.arc(x, y, rad, 0, TAU) }, '#ff3fa4', '#ffd0ea', 1.8, a) },
})

// ======================================================================================== Greenbar
// Continuous-form printer paper, its green bands lined up with the terminal's rows. A working pane feeds a line now
// and then; a waiting one lights its ATTN lamp; a finished one prints END OF JOB.
const feedOf = (p, t) => p.state === 'working' ? Math.floor(ageOf(p, t) / 1.6) : 0
add({ id: 'greenbar', name: 'Greenbar', scene: 'greenbar', fps: 4, ground: '#e9e8df', light: true,
  v: { chrome: 'rgba(233,232,223,.94)', 'chrome-blur': '6px', 'chrome-text': '#2a2f3a', 'chrome-dim': '#6d7380', 'chrome-sel': 'rgba(42,47,58,.07)', pane: 'rgba(248,247,240,.6)', 'pane-clear': 'rgba(248,247,240,.18)', 'pane-edge': '0 0 0 .5px rgba(42,47,58,.18), 0 1px 2px rgba(42,47,58,.08)', 'bar-text': '#6d7380', 'bar-focus': '#2a2f3a', 'bar-rule': 'inset 0 -1px 0 rgba(42,47,58,.12)', 'tray-bg': 'rgba(246,245,238,.96)', 'tray-text': '#2a2f3a', 'tray-accent': '#2e7a43', 'tray-edge': 'rgba(42,47,58,.18)', wait: '#d9822b' },
  c: { text: '#2a2f3a', dim: '#6d7380', subtle: '#c8cfc2', claude: '#b4532a', success: '#2e7a43', error: '#b3261e', warning: '#8a6400', perm: '#2c5aa0', border: '#a9b3a3', userbg: '#e9efe3', addbg: '#cfe6c8', delbg: '#f2d6cf', addword: '#a9d39b', delword: '#e8ab9f', eye: '#f8f7f0' },
  sceneDef: {
    draw(c, t) {
      c.globalAlpha = 1; c.fillStyle = '#e9e8df'; c.fillRect(0, 0, W, H)
      for (const p of panes) {
        c.save(); c.beginPath(); c.rect(p.rect.x, p.rect.y, p.rect.w, p.rect.h); c.clip()
        c.fillStyle = '#f8f7f0'; c.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h)
        const off = feedOf(p, t)
        for (let r = -6; r < p.rows + 6; r++) { if (Math.floor((r + off + 600) / 3) % 2) continue; c.fillStyle = '#d7e8d2'; c.fillRect(p.rect.x, p.ty + r * LINE, p.rect.w, LINE) }
        // sprocket margins and the perforation along them
        for (const x of [p.rect.x + 3, p.rect.x + p.rect.w - 3]) { for (let y = p.rect.y + 30 - ((off * LINE) % 18); y < p.rect.y + p.rect.h; y += 18) { c.fillStyle = '#e9e8df'; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill() } }
        c.strokeStyle = 'rgba(42,47,58,.16)'; c.setLineDash([2, 2]); c.lineWidth = .6; c.beginPath(); c.moveTo(p.rect.x + 7.5, p.rect.y); c.lineTo(p.rect.x + 7.5, p.rect.y + p.rect.h); c.moveTo(p.rect.x + p.rect.w - 7.5, p.rect.y); c.lineTo(p.rect.x + p.rect.w - 7.5, p.rect.y + p.rect.h); c.stroke(); c.setLineDash([])
        c.restore()
      }
    },
  },
  live: () => true,
  fx(c, t) {
    c.font = `700 8px ${MONO}`; c.textBaseline = 'middle'
    for (const p of panes) {
      const x = barRight(p) - 6, y = p.rect.y + 11
      const on = p.state === 'waiting' ? Math.sin(t * 5) > 0 : p.state === 'working'
      const col = p.state === 'waiting' ? '#d9822b' : '#2e7a43'
      c.globalAlpha = 1; c.fillStyle = on ? col : '#b9bdb2'; c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill()
      c.textAlign = 'right'; c.fillStyle = '#6d7380'; c.globalAlpha = .9; c.fillText(p.state === 'waiting' ? 'ATTN' : p.state === 'working' ? 'ON LINE' : 'READY', x - 6, y + .5)
      if (p.state === 'done') { const a = p.k === 0 ? ageOf(p, t) : 9, s = `*** END OF JOB · ${p.k === 0 ? 48 : 31} S ***`, n = Math.floor(clamp(a / .9) * s.length)
        c.textAlign = 'left'; c.font = `700 9.5px ${MONO}`; c.fillStyle = '#2e7a43'; c.globalAlpha = .9; c.fillText(s.slice(0, n), p.tx, freeRow(p, 5.5)); c.font = `700 8px ${MONO}` }
    }
  },
  edge(c, x, y, rad, p) { c.globalAlpha = 1 - p; c.strokeStyle = '#2a2f3a'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, rad, 0, TAU); c.stroke(); c.setLineDash([]); c.strokeStyle = '#2e7a43'; c.lineWidth = 6; c.globalAlpha = (1 - p) * .35; c.beginPath(); c.arc(x, y, Math.max(0, rad - 8), 0, TAU); c.stroke() },
})

// ======================================================================================== Circuit
// A circuit board. Each pane is wired to its own row in the chat list. Work sends pulses down that trace, a question
// blinks the pane's LED amber, and a finished turn fires one bright pulse home.
const traces = new Map()
function traceFor(p) {
  if (traces.has(p.k)) return traces.get(p.k)
  const rowY = TITLE + 8 + 22 + (p.k + 1) * 22.5 + 9
  const sx = p.rect.x + 14 + p.k * 6, sy = p.rect.y + p.rect.h - 14 - p.k * 4
  const midX = SIDE + 14 + p.k * 7
  const yb = sy - 18 - p.k * 9, ex = SIDE - 6
  const pts = [[sx, sy], [sx, yb], [midX + 10, yb], [midX, yb + Math.sign(rowY - yb) * 10], [midX, rowY], [ex, rowY]]
  const len = []; let L = 0; for (let q = 1; q < pts.length; q++) { L += Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]); len.push(L) }
  const tr = { pts, len, L }; traces.set(p.k, tr); return tr
}
function along(tr, f) { const d = f * tr.L; let q = 0; while (q < tr.len.length - 1 && tr.len[q] < d) q++; const d0 = q ? tr.len[q - 1] : 0, [ax, ay] = tr.pts[q], [bx, by] = tr.pts[q + 1], k = (d - d0) / ((tr.len[q] - d0) || 1); return [ax + (bx - ax) * k, ay + (by - ay) * k] }
add({ id: 'circuit', name: 'Circuit', scene: 'pcb', fps: 0, ground: '#0c3b2b', light: false,
  v: { chrome: 'rgba(9,44,32,.78)', 'chrome-text': '#e4f1e8', 'chrome-dim': '#8fb09c', 'chrome-sel': 'rgba(228,241,232,.09)', pane: 'rgba(10,46,33,.88)', 'pane-clear': 'rgba(10,46,33,.55)', 'pane-edge': 'inset 0 0 0 .5px rgba(201,136,61,.35)', 'bar-text': '#8fb09c', 'bar-focus': '#f0f8f2', 'tray-bg': 'rgba(12,52,38,.94)', 'tray-text': '#e4f1e8', 'tray-accent': '#f0a35a', wait: '#f5cf6a' },
  c: { text: '#e4f1e8', dim: '#8fb09c', subtle: '#24493a', claude: '#f0a35a', success: '#7ee39a', error: '#ff7a6e', warning: '#f5cf6a', perm: '#a8c9f5', border: '#4f7a63', userbg: '#134432', addbg: '#155a3a', delbg: '#5a2a26', addword: '#2c8a55', delword: '#9a3d33', eye: '#0b3324' },
  sceneDef: {
    draw(c) {
      const [board] = once('pcb', () => { const [cv, g] = canvas(); const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0f4532'); gr.addColorStop(1, '#0a3022'); g.fillStyle = gr; g.fillRect(0, 0, W, H); seed = 44
        // a bus of parallel traces on the grid, with vias and pads, and silkscreen labels
        g.strokeStyle = 'rgba(201,136,61,.32)'; g.lineWidth = 1.6; g.lineJoin = 'round'
        for (let k = 0; k < 46; k++) { let x = SIDE + rand() * (W - SIDE), y = TITLE + rand() * (H - TITLE); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { const L = 20 + rand() * 90, d = Math.floor(rand() * 4); if (d === 0) x += L; else if (d === 1) y += L; else if (d === 2) { x += L * .7; y += L * .7 } else { x -= L * .7; y += L * .7 } g.lineTo(x, y) } g.stroke(); g.fillStyle = 'rgba(201,136,61,.45)'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); g.fillStyle = '#0c3b2b'; g.beginPath(); g.arc(x, y, 1, 0, TAU); g.fill() }
        g.font = `600 7px ${MONO}`; g.fillStyle = 'rgba(233,240,230,.4)'; for (let k = 0; k < 26; k++) g.fillText(['U', 'R', 'C', 'Q', 'D', 'J'][k % 6] + (1 + Math.floor(rand() * 40)), SIDE + rand() * (W - SIDE), TITLE + 10 + rand() * (H - TITLE - 10))
        return [cv] })
      c.globalAlpha = 1; c.drawImage(board, 0, 0, W, H)
      c.lineJoin = 'round'
      for (const p of panes) { const tr = traceFor(p); c.strokeStyle = p.state === 'waiting' ? 'rgba(245,207,106,.6)' : 'rgba(214,150,72,.75)'; c.lineWidth = 2; c.beginPath(); tr.pts.forEach(([x, y], n) => n ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke()
        const [sx, sy] = tr.pts[0]; c.fillStyle = '#d69648'; c.fillRect(sx - 4, sy - 4, 8, 8); c.font = `600 7px ${MONO}`; c.fillStyle = 'rgba(233,240,230,.6)'; c.textAlign = 'left'; c.fillText('U' + (p.k + 1), sx + 7, sy + 2.5) }
    },
  },
  live: () => true,
  fx(c, t) {
    for (const p of panes) {
      const tr = traceFor(p)
      if (p.state === 'working') for (let q = 0; q < 3; q++) { const f = ((t * .45 + q / 3) % 1), [x, y] = along(tr, f); c.globalAlpha = .9 * Math.sin(f * Math.PI); c.fillStyle = '#ffe2b0'; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); c.globalAlpha *= .3; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill() }
      if (p.state === 'done' && p.k === 0) { const a = ageOf(p, t) / 1.1; if (a < 1) { const [x, y] = along(tr, ease(a)); c.globalAlpha = 1; c.fillStyle = '#d9ffe6'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); c.globalAlpha = .35; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill() } }
      // the pane's LED, next to its close button
      const lx = barRight(p) - 6, ly = p.rect.y + 11, on = p.state === 'waiting' ? Math.sin(t * 6) > 0 : p.state !== 'idle'
      const col = p.state === 'waiting' ? '#f5cf6a' : p.state === 'done' ? '#7ee39a' : p.state === 'working' ? '#f0a35a' : '#2a5a46'
      c.globalAlpha = 1; c.fillStyle = '#062419'; roundRect(c, lx - 4.5, ly - 3, 9, 6, 1.5); c.fill(); c.fillStyle = on ? col : '#1f4a3a'; roundRect(c, lx - 3.5, ly - 2, 7, 4, 1); c.fill()
      if (on) { c.globalAlpha = .28; c.beginPath(); c.arc(lx, ly, 7, 0, TAU); c.fill() }
    }
  },
  edge(c, x, y, rad, p) {
    c.strokeStyle = '#d69648'; c.lineWidth = 1.6; c.lineJoin = 'round'
    for (let q = 0; q < 16; q++) { const a = q / 16 * TAU, k = rad * .6; c.globalAlpha = (1 - p) * .8; c.beginPath(); c.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k); c.lineTo(x + Math.cos(a) * k + Math.cos(a + .785) * rad * .3, y + Math.sin(a) * k + Math.sin(a + .785) * rad * .3); c.lineTo(x + Math.cos(a + .2) * rad, y + Math.sin(a + .2) * rad); c.stroke(); c.fillStyle = '#ffe2b0'; c.beginPath(); c.arc(x + Math.cos(a + .2) * rad, y + Math.sin(a + .2) * rad, 2.2, 0, TAU); c.fill() }
  },
})

// ======================================================================================== Darkroom
// Red safelight. Behind a working pane a print slowly develops; a finished one is fixed with its white border; a
// question pulses the safelight.
function printImage(k) {
  return once('print' + k, () => { const w = 220, h = 150, [cv, g] = canvas(w, h); seed = 300 + k * 9
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#ffd6c8'); sky.addColorStop(.55, '#d8705a'); sky.addColorStop(1, '#3a0d0a'); g.fillStyle = sky; g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff1e8'; g.beginPath(); g.arc(w * (.3 + rand() * .4), h * .42, 12 + rand() * 6, 0, TAU); g.fill()
    for (let L = 0; L < 3; L++) { g.fillStyle = ['#8a2a20', '#5a1610', '#260706'][L]; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) g.lineTo(x, h * (.5 + L * .14) - fbm(x * .02 + k * 3 + L, L * 2.3) * 40); g.lineTo(w, h); g.fill() }
    const img = g.getImageData(0, 0, w, h); for (let q = 0; q < img.data.length; q += 4) { const n = (rand() - .5) * 26; img.data[q] += n; img.data[q + 1] += n * .6; img.data[q + 2] += n * .5 } g.putImageData(img, 0, 0); return cv })
}
const developOf = (p, t) => p.state === 'working' ? clamp(.08 + ageOf(p, t) / 55, 0, .75) : p.state === 'done' ? (p.k === 0 ? clamp(.75 + ageOf(p, t) / 1.5 * .25) : 1) : p.state === 'waiting' ? .45 : 0
add({ id: 'darkroom', name: 'Darkroom', scene: 'darkroom', fps: 8, ground: '#120607', light: false,
  v: { chrome: 'rgba(18,6,7,.8)', 'chrome-text': '#ffb59e', 'chrome-dim': '#a86a5a', 'chrome-sel': 'rgba(255,181,158,.08)', pane: 'rgba(22,8,9,.86)', 'pane-clear': 'rgba(22,8,9,.5)', 'pane-edge': 'inset 0 0 0 .5px rgba(255,120,90,.16)', 'bar-text': '#a86a5a', 'bar-focus': '#ffc9b8', 'tray-bg': 'rgba(26,9,10,.92)', 'tray-text': '#ffb59e', 'tray-accent': '#ff6a4a', wait: '#ff6a4a', 'wait-ring': 'rgba(255,106,74,.55)', 'wait-glow': 'rgba(255,60,40,.3)' },
  c: { text: '#ffb59e', dim: '#a86a5a', subtle: '#3a1a16', claude: '#ff7a4a', success: '#ffd9bc', error: '#ff4a3a', warning: '#ff9a5a', perm: '#ffc4b0', border: '#6a2e28', userbg: '#2a0f0d', addbg: '#3a1a10', delbg: '#3a0a0a', addword: '#6a3418', delword: '#7a1a16', eye: '#120607' },
  sceneDef: {
    draw(c, t) {
      const wait = panes.some((p) => p.state === 'waiting'), pulse = wait ? .75 + .25 * Math.sin(t * 2.4) : 1
      c.globalAlpha = 1; c.fillStyle = '#120607'; c.fillRect(0, 0, W, H)
      const g = c.createRadialGradient(W * .58, -40, 20, W * .58, -40, H * 1.1); g.addColorStop(0, `rgba(255,50,30,${.36 * pulse})`); g.addColorStop(.5, `rgba(160,20,10,${.12 * pulse})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H)
      for (const p of panes) { const d = developOf(p, t); if (d <= 0) continue
        const img = printImage(p.k), pw = p.rect.w * .62, ph = pw * img.height / img.width, x = p.rect.x + p.rect.w - pw - 16, y = p.rect.y + p.rect.h - ph - 40
        if (p.state === 'done') { c.globalAlpha = .85; c.fillStyle = '#ffd9cc'; c.fillRect(x - 6, y - 6, pw + 12, ph + 12) }
        c.globalAlpha = d; c.drawImage(img, x, y, pw, ph) }
    },
  },
  edge(c, x, y, rad, p) { glowPath(c, () => { c.beginPath(); c.arc(x, y, rad, 0, TAU) }, '#ff3a22', '#ffb59e', 1.6, (1 - p) * .9) },
})
})()
