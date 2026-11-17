'use strict'
// Theme lab: real xterm 6 + WebGL panes over a character-grid "ground" canvas. Driven by main.cjs.
const DPR = window.devicePixelRatio || 1
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const FG = (h) => `\x1b[38;2;${hex(h).join(';')}m`, BG = (h) => `\x1b[48;2;${hex(h).join(';')}m`
const R = '\x1b[0m', B = '\x1b[1m', NB = '\x1b[22m'

// Claude Code role colors per theme (what a custom ~/.claude/themes file would override).
const UI = {
  spool:     { text: '#FFFFFF', dim: '#999999', subtle: '#505050', claude: '#D77757', success: '#4EBA65', error: '#FF6B80', warning: '#FFC107', permission: '#B1B9F9', border: '#888888', userBg: '#373737', addBg: '#225C2B', delBg: '#7A2936', addWord: '#38A660', delWord: '#B3596B', eye: '#000000' },
  clay:      { text: '#F3E9DF', dim: '#9C8F84', subtle: '#4A3F37', claude: '#E58457', success: '#A9C47A', error: '#E8705A', warning: '#E8B04D', permission: '#9FB2DE', border: '#6B5B50', userBg: '#2C221C', addBg: '#2E3A22', delBg: '#47241E', addWord: '#6E8F3E', delWord: '#A0473A', eye: '#1A1411' },
  contour:   { text: '#E3EEE9', dim: '#7F958D', subtle: '#2E3B37', claude: '#E3A15D', success: '#7FD1A0', error: '#F07F7F', warning: '#E8C26A', permission: '#8FB6F0', border: '#4D625B', userBg: '#17221F', addBg: '#17362A', delBg: '#3B1F22', addWord: '#3F8F64', delWord: '#A3474F', eye: '#0B1210' },
  snow:      { text: '#E8EEF8', dim: '#8592AA', subtle: '#2C3550', claude: '#F0A27A', success: '#8BD4A8', error: '#F28C96', warning: '#F2CC7A', permission: '#A9BCF5', border: '#4A5675', userBg: '#1A2338', addBg: '#1B3A33', delBg: '#43242E', addWord: '#3E8F6E', delWord: '#A8495E', eye: '#0C1220' },
  blueprint: { text: '#EAF2FF', dim: '#9DB4D6', subtle: '#3A5A85', claude: '#FFB86B', success: '#8EE3C8', error: '#FF8A7A', warning: '#FFD27A', permission: '#BFD7FF', border: '#6E8DBA', userBg: '#1A3C66', addBg: '#1D4A55', delBg: '#4A2A45', addWord: '#3C8FA0', delWord: '#9A4A7A', eye: '#0F2B4C' },
  phosphor:  { text: '#9DFFB5', dim: '#4F9E66', subtle: '#1E3A27', claude: '#FFB347', success: '#9DFFB5', error: '#FF7A6B', warning: '#FFD166', permission: '#C8FFD8', border: '#2E6B41', userBg: '#0E2416', addBg: '#12361F', delBg: '#3A1714', addWord: '#2E8F4E', delWord: '#9A3A30', eye: '#06100A' },
}

const THEMES = {
  spool:     { ground: ['#0E0E10', '#0E0E10'], chrome: 'rgba(22,22,24,.92)', chromeText: '#d6d6d6', pane: [14, 14, 16], barText: '#8a8a90', barFocus: '#ededed', scene: null, grid: 0 },
  clay:      { ground: ['#1B1410', '#120E0B'], chrome: 'rgba(30,23,19,.72)', chromeText: '#efe3d6', pane: [26, 20, 16], barText: '#9c8f84', barFocus: '#f3e9df', scene: 'clay', grid: 1, gridColor: [0.95, 0.80, 0.68, 0.06] },
  contour:   { ground: ['#0E1715', '#0A110F'], chrome: 'rgba(14,22,20,.72)', chromeText: '#dbe8e2', pane: [12, 19, 17], barText: '#7f958d', barFocus: '#e3eee9', scene: 'contour', grid: 0 },
  snow:      { ground: ['#0A1020', '#16203A'], chrome: 'rgba(14,20,36,.70)', chromeText: '#dfe7f5', pane: [14, 20, 34], barText: '#8592aa', barFocus: '#e8eef8', scene: 'snow', grid: 0 },
  blueprint: { ground: ['#12345A', '#0E2A4A'], chrome: 'rgba(16,44,78,.74)', chromeText: '#e6efff', pane: [16, 46, 80], barText: '#9db4d6', barFocus: '#eaf2ff', scene: 'blueprint', grid: 2, gridColor: [0.85, 0.92, 1.0, 0.07] },
  phosphor:  { ground: ['#070A08', '#040605'], chrome: 'rgba(8,12,9,.9)', chromeText: '#9dffb5', pane: [6, 16, 10], barText: '#4f9e66', barFocus: '#9dffb5', scene: null, grid: 0 },
}

// ---------- the Claude Code screen each pane shows ----------
const CONVOS = [
  { title: 'Fix flaky retry test', state: 'working', lines: (u, w) => [
    `${BG(u.userBg)}${FG(u.text)}> fix the flaky retry test in payments${' '.repeat(Math.max(0, w - 39))}${R}`, '',
    `${FG(u.text)}⏺${R} ${FG(u.text)}I'll read the test and the retry helper first.${R}`, '',
    `${FG(u.success)}⏺${R} ${B}${FG(u.text)}Read${NB}(src/payments/retry.test.ts)${R}`,
    `  ${FG(u.dim)}⎿  Read 84 lines (ctrl+o to expand)${R}`, '',
    `${FG(u.success)}⏺${R} ${B}${FG(u.text)}Update${NB}(src/payments/retry.ts)${R}`,
    `  ${FG(u.dim)}⎿  Updated src/payments/retry.ts with 2 additions and 1 removal${R}`,
    `      ${FG(u.dim)}40${R}        ${FG(u.text)}try { return await fn() } catch (e) { last = e }${R}`,
    `      ${BG(u.delBg)}${FG(u.text)}41 -      await sleep(${BG(u.delWord)}100${BG(u.delBg)})${' '.repeat(Math.max(0, w - 33))}${R}`,
    `      ${BG(u.addBg)}${FG(u.text)}41 +      await sleep(${BG(u.addWord)}backoff(attempt)${BG(u.addBg)})${' '.repeat(Math.max(0, w - 46))}${R}`,
    `      ${FG(u.dim)}42${R}      ${FG(u.text)}}${R}`, '',
    `${FG(u.claude)}✻ Simmering… ${FG(u.dim)}(14s · ↓ 1.9k tokens · esc to interrupt)${R}`,
  ] },
  { title: 'Search A/B readout', state: 'waiting', lines: (u, w) => [
    `${BG(u.userBg)}${FG(u.text)}> rerun the readout with this week${' '.repeat(Math.max(0, w - 34))}${R}`, '',
    `${FG(u.text)}⏺${R} ${FG(u.text)}Running the readout script with the new start date.${R}`, '',
    `${FG(u.text)}⏺${R} ${B}${FG(u.text)}Bash${NB}(python3 readout.py --since nov-3)${R}`, '',
    `${FG(u.permission)}╭${'─'.repeat(w - 2)}╮${R}`,
    `${FG(u.permission)}│${R} ${B}${FG(u.text)}Bash command${R}${' '.repeat(Math.max(0, w - 16))}${FG(u.permission)}│${R}`,
    `${FG(u.permission)}│${R}   ${FG(u.text)}python3 readout.py --since nov-3${R}${' '.repeat(Math.max(0, w - 38))}${FG(u.permission)}│${R}`,
    `${FG(u.permission)}│${R} ${FG(u.text)}Do you want to proceed?${R}${' '.repeat(Math.max(0, w - 27))}${FG(u.permission)}│${R}`,
    `${FG(u.permission)}│${R} ${FG(u.permission)}❯ 1. Yes${R}${' '.repeat(Math.max(0, w - 12))}${FG(u.permission)}│${R}`,
    `${FG(u.permission)}│${R}   ${FG(u.dim)}2. No, and tell Claude what to do differently${R}${' '.repeat(Math.max(0, w - 50))}${FG(u.permission)}│${R}`,
    `${FG(u.permission)}╰${'─'.repeat(w - 2)}╯${R}`,
  ], noPrompt: true },
  { title: 'Amplitude dashboard', state: 'idle', lines: (u, w) => [
    `${BG(u.userBg)}${FG(u.text)}> why did buy volume drop after the guardrail${' '.repeat(Math.max(0, w - 46))}${R}`, '',
    `${FG(u.success)}⏺${R} ${B}${FG(u.text)}amplitude - query_amplitude_data${NB} (MCP)${R}`,
    `  ${FG(u.dim)}⎿  Returned 2 series${R}`, '',
    `${FG(u.text)}⏺${R} ${FG(u.text)}Buy volume fell 3.5% in the week after the guardrail,${R}`,
    `  ${FG(u.text)}almost all of it from orders over $500.${R}`, '',
    `${FG(u.dim)}✻ Brewed for 48s${R}`,
  ] },
  { title: 'Flex combo prototypes', state: 'idle', lines: (u, w) => [
    `${BG(u.userBg)}${FG(u.text)}> how would flex work on existing combos${' '.repeat(Math.max(0, w - 40))}${R}`, '',
    `${FG(u.text)}⏺${R} ${FG(u.text)}Flex pays out early when enough legs have already won.${R}`, '',
    `${FG(u.error)}⏺${R} ${B}${FG(u.text)}Bash${NB}(npm test -- flex)${R}`,
    `  ${FG(u.error)}⎿  Error: 1 test failed in flex.spec.ts${R}`, '',
    `${FG(u.dim)}✻ Crunched for 51s${R}`,
  ] },
]

function header(u) {
  return [
    `${FG(u.claude)} ▐${BG(u.eye)}▛███▛█${R}   ${B}${FG(u.text)}Claude Code${NB} ${FG(u.dim)}v2.1.322${R}`,
    `${FG(u.claude)}▝▜${BG(u.eye)}█████${R}${FG(u.claude)}█▀${R}  ${FG(u.dim)}Opus 5.5 · Claude Enterprise${R}`,
    `${FG(u.claude)} ▝▝   ▝▝ ${R}  ${FG(u.dim)}~/Desktop/Repos/payments${R}`, '',
  ]
}

function screen(convo, u, cols, rows) {
  const body = [...header(u), ...convo.lines(u, cols)]
  const prompt = convo.noPrompt ? [] : [
    `${FG(u.border)}${'─'.repeat(cols)}${R}`,
    `${FG(u.text)}❯ ${R}`,
    `${FG(u.border)}${'─'.repeat(cols)}${R}`,
    `  ${FG(u.warning)}⏵⏵ auto mode on${R} ${FG(u.dim)}(shift+tab to cycle)${R}`,
  ]
  const free = Math.max(0, rows - body.length - prompt.length)
  const out = [...body, ...Array(free).fill(''), ...prompt].slice(0, rows)
  return '\x1b[?25l\x1b[2J\x1b[H' + out.join('\r\n')
}

// ---------- desk ----------
const desk = document.getElementById('desk')
const panes = []
let cw = 7, ch = 15
function termTheme(name) {
  const u = UI[name]
  return {
    background: 'rgba(0,0,0,0)', foreground: u.text, cursor: u.text, cursorAccent: u.userBg,
    selectionBackground: 'rgba(127,127,127,.35)',
    black: u.subtle, red: u.error, green: u.success, yellow: u.warning, blue: u.permission, magenta: u.delWord, cyan: u.addWord, white: u.dim,
    brightBlack: u.dim, brightRed: u.error, brightGreen: u.success, brightYellow: u.warning, brightBlue: u.permission, brightMagenta: u.delWord, brightCyan: u.addWord, brightWhite: u.text,
  }
}
function layout() {
  const W = desk.clientWidth, H = desk.clientHeight, m = 4, g = 4
  const pw = (W - 2 * m - g) / 2, ph = (H - 2 * m - g) / 2
  return [[m, m], [m + pw + g, m], [m, m + ph + g], [m + pw + g, m + ph + g]].map(([x, y]) => ({ x, y, w: pw, h: ph }))
}
function build() {
  const rects = layout()
  CONVOS.forEach((c, i) => {
    const el = document.createElement('div'); el.className = 'pane' + (i === 0 ? ' focus' : '')
    const r = rects[i]; Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' })
    el.innerHTML = `<div class="bar"><i></i><span>${c.title}</span></div><div class="host"></div>`
    desk.appendChild(el)
    const term = new Terminal({ fontFamily: 'Monaco, "SF Mono", Menlo, monospace', fontSize: 12, lineHeight: 1.1, allowTransparency: true, allowProposedApi: true, theme: termTheme('spool'), scrollback: 0 })
    const host = el.querySelector('.host')
    term.open(host)
    const webgl = new WebglAddon.WebglAddon()
    term.loadAddon(webgl)
    panes.push({ el, host, term, rect: r, convo: c, busy: c.state === 'working' ? 1 : 0 })
  })
  const dims = panes[0].term._core._renderService.dimensions.css.cell
  cw = dims.width; ch = dims.height
  const dr = desk.getBoundingClientRect()
  for (const p of panes) {
    // Snap each terminal's first cell onto the window-wide cell grid, so ground glyphs line up with text.
    const ax = dr.left + p.rect.x, ay = dr.top + p.rect.y
    const left = Math.ceil((ax + 8) / cw) * cw - ax, top = Math.ceil((ay + 30) / ch) * ch - ay
    const cols = Math.floor((p.rect.w - left - 4) / cw), rows = Math.floor((p.rect.h - top - 4) / ch)
    Object.assign(p.host.style, { left: left + 'px', top: top + 'px', width: cols * cw + 'px', height: rows * ch + 'px' })
    p.term.resize(cols, rows)
    p.cell = { x: Math.round((ax + left) / cw), y: Math.round((ay + top) / ch), cols, rows }
  }
}

// ---------- ground: one WebGL2 canvas, cells on the terminal grid ----------
const canvas = document.getElementById('ground')
const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
const GLYPHS = [' ', '·', '✢', '✳', '✶', '✻', '✽', '*', '+', '.', ':', '-', '|', '/', '\\', '_', '=', '~', 'o', '•', '#', '%']
const G = Object.fromEntries(GLYPHS.map((g, i) => [g, i]))
let cols = 0, rows = 0, cells, mask, cellTex, maskTex, atlasTex, prog, uni = {}
const vs = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`
const fs = `#version 300 es
precision highp float;
uniform sampler2D uCells, uAtlas, uMask;
uniform vec2 uCellPx, uRes; uniform float uCount, uMaskK; uniform int uGrid; uniform vec4 uGridColor; uniform vec2 uMajor;
uniform vec3 uBgTop, uBgBot; uniform vec3 uPal[16];
out vec4 o;
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(p / uCellPx); vec2 l = p - cell * uCellPx;
  vec3 col = mix(uBgTop, uBgBot, p.y / uRes.y);
  vec4 c = texelFetch(uCells, ivec2(cell), 0);
  float m = texelFetch(uMask, ivec2(cell), 0).r;
  float vis = 1.0 - uMaskK * m;
  if (uGrid == 1) { float d = length(l - uCellPx * 0.5); col = mix(col, uGridColor.rgb, uGridColor.a * smoothstep(1.6, 0.6, d) * vis); }
  if (uGrid == 2) {
    vec2 e = min(l, uCellPx - l); float minor = smoothstep(1.2, 0.0, min(e.x, e.y));
    vec2 mc = mod(cell, uMajor); vec2 em = vec2(mc.x == 0.0 ? l.x : 1e3, mc.y == 0.0 ? l.y : 1e3);
    float major = smoothstep(1.6, 0.0, min(em.x, em.y));
    col = mix(col, uGridColor.rgb, uGridColor.a * max(minor, major * 2.2) * mix(1.0, 0.55, uMaskK * m));
  }
  int pal = int(c.a * 255.0 + 0.5); int gp = pal & 15; int tp = pal >> 4;
  float tileA = c.b * vis;
  if (tileA > 0.0) { vec2 h = uCellPx * 0.5 - 1.0; float r = 2.0; vec2 q = abs(l - uCellPx * 0.5) - (h - r); float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; col = mix(col, uPal[tp], clamp(0.5 - d, 0.0, 1.0) * tileA); }
  float gi = floor(c.r * 255.0 + 0.5);
  if (gi > 0.0) { vec2 auv = vec2((gi * uCellPx.x + l.x) / (uCount * uCellPx.x), l.y / uCellPx.y); float ga = texture(uAtlas, auv).a * c.g * vis; col = mix(col, uPal[gp], ga); }
  o = vec4(col, 1.0);
}`
function sh(t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x }
function initGL() {
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  gl.useProgram(prog)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  for (const n of ['uCells', 'uAtlas', 'uMask', 'uCellPx', 'uRes', 'uCount', 'uMaskK', 'uGrid', 'uGridColor', 'uMajor', 'uBgTop', 'uBgBot', 'uPal']) uni[n] = gl.getUniformLocation(prog, n)
  // glyph atlas, drawn in the terminal's font at device pixels
  const aw = Math.ceil(cw * DPR), ah = Math.ceil(ch * DPR)
  const ac = document.createElement('canvas'); ac.width = aw * GLYPHS.length; ac.height = ah
  const ax = ac.getContext('2d'); ax.fillStyle = '#fff'; ax.font = `${12 * DPR}px Monaco, "Apple Symbols", Menlo, monospace`; ax.textAlign = 'center'; ax.textBaseline = 'middle'
  GLYPHS.forEach((g, i) => ax.fillText(g, i * aw + aw / 2, ah / 2 + 0.5 * DPR))
  atlasTex = tex(gl.RGBA, gl.RGBA, ac, gl.LINEAR)
  resizeGround()
}
function tex(ifmt, fmt, src, filter, w, h) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  if (w) gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.UNSIGNED_BYTE, src); else gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, fmt, gl.UNSIGNED_BYTE, src)
  return t
}
function resizeGround() {
  canvas.width = Math.round(innerWidth * DPR); canvas.height = Math.round(innerHeight * DPR)
  cols = Math.ceil(innerWidth / cw); rows = Math.ceil(innerHeight / ch)
  cells = new Uint8Array(cols * rows * 4); mask = new Uint8Array(cols * rows)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  cellTex = tex(gl.RGBA8, gl.RGBA, cells, gl.NEAREST, cols, rows)
  maskTex = tex(gl.R8, gl.RED, mask, gl.NEAREST, cols, rows)
}
function put(x, y, glyph, alpha, glyphPal, tileAlpha = 0, tilePal = 0) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= cols || y >= rows) return
  const i = (y * cols + x) * 4
  cells[i] = G[glyph] ?? 0; cells[i + 1] = Math.max(0, Math.min(255, alpha * 255)); cells[i + 2] = Math.max(0, Math.min(255, tileAlpha * 255)); cells[i + 3] = (tilePal << 4) | glyphPal
}

// ---------- scenes ----------
const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()
function noise2(x, y) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j; const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }; const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g); return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v }
const fbm = (x, y) => { let a = 0.5, s = 0; for (let k = 0; k < 4; k++) { s += a * noise2(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 3.7; a *= 0.5 } return s }
function paneCells(p) { return { x0: p.cell.x - Math.round((p.host.offsetLeft) / cw), y0: Math.floor((desk.getBoundingClientRect().top + p.rect.y) / ch), x1: p.cell.x + p.cell.cols, y1: p.cell.y + p.cell.rows } }
const SCENES = {
  clay: {
    pal: ['#000000', '#f3e2cf', '#e58457', '#8a6e5c', '#3a2b22'],
    init() { this.stars = Array.from({ length: Math.round(cols * rows * 0.018) }, () => ({ x: rand() * cols | 0, y: rand() * rows | 0, ph: rand() * 6, sp: 0.4 + rand() * 0.8, warm: rand() < 0.25 })) },
    tick(t) {
      cells.fill(0)
      const busy = panes.filter((p) => p.busy).map(paneCells)
      for (const s of this.stars) {
        const near = busy.some((b) => s.x >= b.x0 - 3 && s.x <= b.x1 + 3 && s.y >= b.y0 - 2 && s.y <= b.y1 + 2)
        const sp = near ? s.sp * 3.2 : s.sp
        const f = Math.floor(t * sp * 2 + s.ph)
        const frames = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']
        const tw = 0.5 + 0.5 * Math.sin(t * sp * 1.7 + s.ph * 3)
        put(s.x, s.y, frames[((f % frames.length) + frames.length) % frames.length], (near ? 0.75 : 0.32) + 0.25 * tw, near || s.warm ? 2 : 3)
      }
    },
  },
  contour: {
    pal: ['#000000', '#28423a', '#4c7a6b', '#e3a15d'],
    init() { this.h = new Float32Array(cols * rows) },
    tick(t) {
      cells.fill(0)
      const H = this.h, busy = panes.filter((p) => p.busy).map(paneCells)
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        let v = fbm(x * 0.035 + t * 0.012, y * 0.075 - t * 0.006)
        for (const b of busy) { const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, dx = (x - cx) / ((b.x1 - b.x0) * 0.75), dy = (y - cy) / ((b.y1 - b.y0) * 0.75); v += 0.42 * Math.exp(-(dx * dx + dy * dy) * 1.4) }
        H[y * cols + x] = v
      }
      const L = 14
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
        const v = H[y * cols + x], lv = Math.floor(v * L)
        if (lv === Math.floor(H[y * cols + x + 1] * L) && lv === Math.floor(H[(y + 1) * cols + x] * L)) continue
        const gx = H[y * cols + x + 1] - H[y * cols + x - 1], gy = (H[(y + 1) * cols + x] - H[(y - 1) * cols + x]) * 0.5
        const a = ((Math.atan2(gy, gx) * 180 / Math.PI) + 90 + 360) % 180
        const glyph = a < 22.5 || a >= 157.5 ? '-' : a < 67.5 ? '\\' : a < 112.5 ? '|' : '/'
        const index = lv % 4 === 0
        let hot = 0; for (const b of busy) if (x >= b.x0 - 6 && x <= b.x1 + 6 && y >= b.y0 - 3 && y <= b.y1 + 3) hot = 1
        put(x, y, glyph, index ? 0.9 : 0.55, hot && index ? 3 : index ? 2 : 1)
      }
    },
  },
  snow: {
    pal: ['#000000', '#dfe7f5', '#9fb0cf', '#5b6a8c', '#eef3fb'],
    init() { this.f = Array.from({ length: Math.round(cols * 0.9) }, () => this.spawn(true)); this.piles = panes.map(() => new Float32Array(cols)) },
    spawn(any) { const r = rand(); return { x: rand() * cols, y: any ? rand() * rows : -1, vy: 1.2 + rand() * 2.2, ph: rand() * 6, g: r < 0.45 ? '·' : r < 0.75 ? '*' : r < 0.9 ? '+' : '•' } },
    tick(t, dt) {
      cells.fill(0)
      const tops = panes.map(paneCells)
      for (const fl of this.f) {
        fl.y += fl.vy * dt; const x = fl.x + Math.sin(t * 0.8 + fl.ph) * 1.2
        tops.forEach((b, i) => { if (x >= b.x0 && x < b.x1 && fl.y >= b.y0 && fl.y < b.y0 + 1) { this.piles[i][x | 0] = Math.min(1.6, this.piles[i][x | 0] + 0.35); Object.assign(fl, this.spawn(false)) } })
        if (fl.y > rows) Object.assign(fl, this.spawn(false))
        put(x, fl.y, fl.g, fl.g === '·' ? 0.55 : 0.8, fl.g === '·' ? 2 : 1)
      }
      tops.forEach((b, i) => { const pile = this.piles[i]; for (let x = b.x0; x < b.x1; x++) { const h = (pile[x] + pile[x - 1] * 0.5 + pile[x + 1] * 0.5) / 2; if (h > 0.25) put(x, b.y0, h > 0.9 ? '%' : ':', 0.5, 3, Math.min(0.85, h * 0.7), 4); if (h > 1.1) put(x, b.y0 + 1, ':', 0.4, 3, 0.45, 4) } })
    },
  },
  blueprint: { pal: ['#000000', '#cfe0ff'], init() {}, tick() { cells.fill(0); for (let y = 0; y < rows; y += 4) for (let x = 0; x < cols; x += 8) put(x, y, '+', 0.5, 1) } },
}

let theme = 'spool', scene = null, paneMode = 'solid', last = 0, t0 = performance.now(), fps = 15, raf = 0, stats = { ticks: 0, tickMs: 0, drawMs: 0 }
function applyTheme(name, mode) {
  theme = name; paneMode = mode || (name === 'spool' || name === 'phosphor' ? 'solid' : 'clear')
  const T = THEMES[name]
  document.body.dataset.theme = name
  const st = document.documentElement.style
  st.setProperty('--ground', T.ground[1]); st.setProperty('--chrome', T.chrome); st.setProperty('--chrome-text', T.chromeText)
  st.setProperty('--bar-text', T.barText); st.setProperty('--bar-focus', T.barFocus)
  const a = paneMode === 'solid' ? 1 : paneMode === 'faint' ? 0.88 : 0.6
  st.setProperty('--pane', `rgba(${T.pane.join(',')},${a})`)
  for (const p of panes) { p.term.options.theme = termTheme(name); p.term.write(screen(p.convo, UI[name], p.term.cols, p.term.rows)) }
  scene = T.scene ? SCENES[T.scene] : null
  if (scene) scene.init()
  gl.useProgram(prog)
  const pal = new Float32Array(48); (scene?.pal || ['#000000']).forEach((h, i) => { const c = hex(h); pal.set([c[0] / 255, c[1] / 255, c[2] / 255], i * 3) })
  gl.uniform3fv(uni.uPal, pal)
  const top = hex(T.ground[0]), bot = hex(T.ground[1]); gl.uniform3f(uni.uBgTop, top[0] / 255, top[1] / 255, top[2] / 255); gl.uniform3f(uni.uBgBot, bot[0] / 255, bot[1] / 255, bot[2] / 255)
  gl.uniform1i(uni.uGrid, T.grid || 0); gl.uniform4fv(uni.uGridColor, T.gridColor || [0, 0, 0, 0]); gl.uniform2f(uni.uMajor, 8, 4)
  gl.uniform1f(uni.uMaskK, paneMode === 'clear' ? 1 : 0)
  frame(performance.now(), true)
}
function updateMask() {
  mask.fill(0)
  for (const p of panes) {
    const buf = p.term.buffer.active
    for (let y = 0; y < p.cell.rows; y++) {
      const line = buf.getLine(buf.viewportY + y); if (!line) continue
      for (let x = 0; x < p.cell.cols; x++) {
        const c = line.getCell(x); if (!c) continue
        const ch2 = c.getChars()
        if ((ch2 && ch2 !== ' ') || !c.isBgDefault()) for (let dx = -1; dx <= 1; dx++) { const gx = p.cell.x + x + dx, gy = p.cell.y + y; if (gx >= 0 && gx < cols && gy < rows) mask[gy * cols + gx] = 255 }
      }
    }
  }
  gl.bindTexture(gl.TEXTURE_2D, maskTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED, gl.UNSIGNED_BYTE, mask)
}
function frame(now, force) {
  raf = requestAnimationFrame((n) => frame(n))
  if (!force && now - last < 1000 / fps) return
  const dt = Math.min(0.1, (now - last) / 1000); last = now
  const t = (now - t0) / 1000
  const a = performance.now()
  if (scene) scene.tick(t, dt); else cells.fill(0)
  const b = performance.now()
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cellTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, cells); gl.uniform1i(uni.uCells, 0)
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(uni.uAtlas, 1)
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, maskTex); gl.uniform1i(uni.uMask, 2)
  gl.uniform2f(uni.uCellPx, cw * DPR, ch * DPR); gl.uniform2f(uni.uRes, canvas.width, canvas.height); gl.uniform1f(uni.uCount, GLYPHS.length)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  stats.ticks++; stats.tickMs += b - a; stats.drawMs += performance.now() - b
}

window.lab = {
  ready: new Promise((res) => { document.fonts.ready.then(() => { build(); initGL(); applyTheme('spool'); setTimeout(() => { updateMask(); res({ cw, ch, cols, rows, dpr: DPR, panes: panes.map((p) => p.cell) }) }, 400) }) }),
  async set(name, mode) { applyTheme(name, mode); await new Promise((r) => setTimeout(r, 350)); updateMask(); frame(performance.now(), true); return { theme, paneMode } },
  advance(sec) { t0 -= sec * 1000; frame(performance.now(), true) },
  sim(sec, step = 1 / 15) { const t = (performance.now() - t0) / 1000; let k = 0; const a = performance.now(); for (let s = 0; s < sec; s += step) { scene?.tick(t + s, step); k++ } t0 -= sec * 1000; frame(performance.now(), true); return { steps: k, msPerTick: +((performance.now() - a) / k).toFixed(3) } },
  rafRate: () => new Promise((res) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 1000) requestAnimationFrame(f); else res(n) }; requestAnimationFrame(f) }),
  async timeSwitch(name) {
    const a = performance.now()
    for (const p of panes) p.term.options.theme = termTheme(name)
    const b = performance.now()
    let pending = panes.length
    await new Promise((res) => { for (const p of panes) { const d = p.term.onRender(() => { d.dispose(); if (--pending === 0) res() }) } for (const p of panes) p.term.refresh(0, p.term.rows - 1) })
    return { setOptionsMs: +(b - a).toFixed(2), untilAllRenderedMs: +(performance.now() - a).toFixed(1) }
  },
  stats() { const s = { ...stats, tickMsAvg: +(stats.tickMs / Math.max(1, stats.ticks)).toFixed(3), drawMsAvg: +(stats.drawMs / Math.max(1, stats.ticks)).toFixed(3) }; stats = { ticks: 0, tickMs: 0, drawMs: 0 }; return s },
  async reveal(from, to, progress) {
    applyTheme(from); await new Promise((r) => setTimeout(r, 400)); updateMask(); frame(performance.now(), true)
    const vt = document.startViewTransition(() => { applyTheme(to); updateMask() })
    await vt.ready
    const x = 248 + 300, y = 44 + 200, r = Math.hypot(innerWidth, innerHeight)
    const anim = document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 1000, easing: 'linear', pseudoElement: '::view-transition-new(root)', fill: 'both' })
    anim.pause(); anim.currentTime = progress * 1000
    await new Promise((r) => setTimeout(r, 500))
    lab._finish = () => { anim.finish() }
    return { ok: true }
  },
}
