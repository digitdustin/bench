// Spool Desk theme prototype: a 1040 x 640 Spool window with four Claude Code panes, an animated ground drawn on the
// terminal's cell grid, an effects layer, and the theme tray. Plain browser JS, no dependencies.
const W = 1040, H = 640, TITLE = 38, SIDE = 190, BAR = 22, LINE = 13
const MONO = '"SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, monospace'
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const SPIN = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']
const ICON = {
  side: '<svg viewBox="0 0 18 18"><path d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm1.25,11.25c0,.689-.561,1.25-1.25,1.25H7V3.5h7.25c.689,0,1.25,.561,1.25,1.25V13.25Z" fill="currentColor"/></svg>',
  brush: '<svg viewBox="0 0 18 18"><path d="M6.956,9.044L13.534,2.466c.621-.621,1.629-.621,2.25,0h0c.621,.621,.621,1.629,0,2.25l-6.578,6.578" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M1.75,14.706c2.703,.812,4.896,.88,6.689-.955,1.081-1.085,1.081-2.845,0-3.931s-2.826-1.102-3.916,0c-1.773,1.792-.225,3.494-2.773,4.886Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>',
  tidy: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect x="2.75" y="2.75" width="4.5" height="3.5" rx="1"/><rect x="2.75" y="9.25" width="4.5" height="6" rx="1"/><rect x="10.75" y="11.75" width="4.5" height="3.5" rx="1"/><rect x="10.75" y="2.75" width="4.5" height="6" rx="1"/></svg>',
  close: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><line x1="14" y1="4" x2="4" y2="14"/><line x1="4" y1="4" x2="14" y2="14"/></svg>',
  check: '<svg viewBox="0 0 12 12"><path d="m1.76,7.004l2.25,3L10.24,1.746" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>',
}

// ---------- themes ----------
// c = Claude Code's own colors in that theme (what Spool would write to ~/.claude/themes/spool.json).
const T = (o) => o
const THEMES = [
  T({ id: 'spool', name: 'Spool', scene: 'flat', fps: 0, edge: 'line', ground: '#161618', light: false,
    v: { chrome: 'rgba(22,22,24,.97)', 'chrome-text': '#e6e6ea', 'chrome-dim': '#8b8b94', 'chrome-sel': 'rgba(255,255,255,.08)', pane: '#0e0e10', 'pane-clear': '#0e0e10', 'bar-text': '#77777f', 'bar-focus': '#ececf0', 'tray-bg': 'rgba(32,32,35,.94)', 'tray-text': '#e8e8ec', 'tray-accent': '#6aa2ff', wait: '#e8a23a', 'wait-ring': 'rgba(232,162,58,.7)', 'wait-glow': 'rgba(232,162,58,.28)' },
    c: { text: '#f2f2f2', dim: '#999999', subtle: '#505050', claude: '#d77757', success: '#4eba65', error: '#ff6b80', warning: '#ffc107', perm: '#b1b9f9', border: '#888888', userbg: '#373737', addbg: '#225c2b', delbg: '#7a2936', addword: '#38a660', delword: '#b3596b', eye: '#000000' } }),
  T({ id: 'clay', name: 'Clay', scene: 'clay', fps: 12, edge: 'glyphs', ground: '#140e0b', light: false,
    v: { chrome: 'rgba(36,26,20,.62)', 'chrome-text': '#efe2d4', 'chrome-dim': '#a8968a', 'chrome-sel': 'rgba(239,226,212,.09)', pane: 'rgba(26,19,15,.86)', 'pane-clear': 'rgba(26,19,15,.5)', 'bar-text': '#a18f81', 'bar-focus': '#f5e9dc', 'tray-bg': 'rgba(40,29,23,.9)', 'tray-text': '#f2e6d9', 'tray-accent': '#e58457', wait: '#f0a64a' },
    c: { text: '#f3e9df', dim: '#a39283', subtle: '#4a3d34', claude: '#e58457', success: '#a8c47a', error: '#ec7a62', warning: '#e9b357', perm: '#a9b8e0', border: '#6e5c50', userbg: '#2e231c', addbg: '#2f3b23', delbg: '#4a251f', addword: '#5f7f37', delword: '#9a4536', eye: '#1a130f' } }),
  T({ id: 'glass', name: 'Glass', scene: 'glass', fps: 0, edge: 'light', ground: '#14162c', light: false,
    v: { chrome: 'rgba(22,22,34,.26)', 'chrome-blur': '28px', 'chrome-text': '#f4f4f8', 'chrome-dim': '#b8b8c8', 'chrome-sel': 'rgba(255,255,255,.12)', pane: 'rgba(14,14,24,.5)', 'pane-clear': 'rgba(14,14,24,.38)', 'pane-filter': 'blur(26px) saturate(150%)', 'pane-edge': 'inset 0 0 0 .5px rgba(255,255,255,.14), inset 0 1px 0 rgba(255,255,255,.1)', sheen: 'radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.1), transparent 62%)', 'bar-text': '#babacc', 'bar-focus': '#ffffff', 'tray-bg': 'rgba(28,28,42,.5)', 'tray-text': '#f4f4fa', 'tray-accent': '#9cc0ff', wait: '#ffb35c', 'wait-ring': 'rgba(255,179,92,.8)', 'wait-glow': 'rgba(255,179,92,.45)' },
    c: { text: '#f6f6fa', dim: '#a9a9bd', subtle: '#4b4b5e', claude: '#f2a27e', success: '#7fdca0', error: '#ff8a95', warning: '#ffd27a', perm: '#b8c4ff', border: '#8a8aa2', userbg: '#2a2a3c', addbg: '#1e4a3a', delbg: '#5a2533', addword: '#2f7f5c', delword: '#9b3f55', eye: '#14141c' } }),
  T({ id: 'paper', name: 'Paper', scene: 'paper', fps: 0, edge: 'ink', ground: '#2d5a4a', light: true,
    v: { chrome: 'transparent', 'chrome-blur': '0px', 'chrome-text': '#eef2e4', 'chrome-dim': '#b4c4ad', 'chrome-sel': 'rgba(246,242,232,.14)', pane: '#f6f2e8', 'pane-clear': '#f6f2e8', 'pane-edge': '0 1px 1.5px rgba(10,30,20,.35), 0 0 0 .5px rgba(10,30,20,.18)', 'bar-text': '#8a8375', 'bar-focus': '#2a2824', 'bar-rule': 'inset 0 -1px 0 rgba(42,40,36,.08)', 'tray-bg': 'rgba(246,242,232,.97)', 'tray-text': '#2a2824', 'tray-accent': '#b5552f', 'tray-edge': 'rgba(42,40,36,.18)', wait: '#e0a100' },
    c: { text: '#2a2824', dim: '#7c7568', subtle: '#c9c1b1', claude: '#b5552f', success: '#2f7d4f', error: '#b23a2e', warning: '#9a6400', perm: '#2f5da8', border: '#bdb4a3', userbg: '#ebe4d4', addbg: '#dcebd2', delbg: '#f4dad3', addword: '#b7dca5', delword: '#edb6aa', eye: '#f6f2e8' } }),
  T({ id: 'blueprint', name: 'Blueprint', scene: 'blueprint', fps: 0, edge: 'compass', ground: '#0f3459', light: false,
    v: { chrome: 'rgba(14,42,74,.62)', 'chrome-blur': '12px', 'chrome-text': '#e8f1ff', 'chrome-dim': '#9fb7d8', 'chrome-sel': 'rgba(232,241,255,.1)', pane: 'rgba(17,52,90,.72)', 'pane-clear': 'rgba(17,52,90,.42)', 'pane-edge': 'inset 0 0 0 .5px rgba(214,232,255,.3)', 'bar-text': '#a6bddb', 'bar-focus': '#f2f7ff', 'bar-rule': 'inset 0 -.5px 0 rgba(214,232,255,.24)', 'tray-bg': 'rgba(18,50,86,.94)', 'tray-text': '#eaf2ff', 'tray-accent': '#ffb86b', 'tray-edge': 'rgba(214,232,255,.3)', wait: '#ff8a5c' },
    c: { text: '#eaf2ff', dim: '#9db4d6', subtle: '#3a5a85', claude: '#ffb86b', success: '#8ee3c8', error: '#ff8a7a', warning: '#ffd27a', perm: '#bfd7ff', border: '#6e8dba', userbg: '#1c4373', addbg: '#1d4a55', delbg: '#4a2a45', addword: '#2f7c8c', delword: '#8a3f6c', eye: '#123b66' } }),
  T({ id: 'phosphor', name: 'Phosphor', scene: 'phosphor', fps: 0, edge: 'crt', ground: '#0a0d0b', light: false,
    v: { chrome: 'rgba(10,13,11,.97)', 'chrome-text': '#8fe8a6', 'chrome-dim': '#4f8a60', 'chrome-sel': 'rgba(143,232,166,.1)', pane: '#061008', 'pane-clear': '#061008', 'bar-text': '#4f8a60', 'bar-focus': '#a6ffbf', 'tray-bg': 'rgba(8,14,10,.96)', 'tray-text': '#8fe8a6', 'tray-accent': '#8fe8a6', 'tray-edge': 'rgba(143,232,166,.22)', wait: '#ffb347', glow: '0 0 1.4px currentColor, 0 0 6px rgba(90,255,150,.22)' },
    c: { text: '#92ffae', dim: '#4f9a66', subtle: '#1d3a27', claude: '#ffb347', success: '#92ffae', error: '#ff7a6b', warning: '#ffd166', perm: '#c8ffd8', border: '#2e6b41', userbg: '#0e2416', addbg: '#12361f', delbg: '#3a1714', addword: '#2a7a44', delword: '#8a3428', eye: '#061008' } }),
  T({ id: 'snowfall', name: 'Snowfall', scene: 'snow', fps: 15, edge: 'flurry', ground: '#101830', light: false,
    v: { chrome: 'rgba(13,20,38,.6)', 'chrome-text': '#e3eaf6', 'chrome-dim': '#93a1bb', 'chrome-sel': 'rgba(227,234,246,.1)', pane: 'rgba(15,22,40,.82)', 'pane-clear': 'rgba(15,22,40,.5)', 'bar-text': '#93a1bb', 'bar-focus': '#f0f4fb', 'tray-bg': 'rgba(18,26,46,.9)', 'tray-text': '#e8eef8', 'tray-accent': '#9fc2ff', wait: '#ffc27a' },
    c: { text: '#e8eef8', dim: '#8592aa', subtle: '#2c3550', claude: '#f0a27a', success: '#8bd4a8', error: '#f28c96', warning: '#f2cc7a', perm: '#a9bcf5', border: '#4a5675', userbg: '#1b2540', addbg: '#1b3a33', delbg: '#43242e', addword: '#2e7a5c', delword: '#93405a', eye: '#0f1628' } }),
  T({ id: 'contour', name: 'Contour', scene: 'contour', fps: 12, edge: 'rings', ground: '#0c1513', light: false,
    v: { chrome: 'rgba(12,20,18,.64)', 'chrome-text': '#dce9e3', 'chrome-dim': '#8aa39a', 'chrome-sel': 'rgba(220,233,227,.09)', pane: 'rgba(12,20,18,.84)', 'pane-clear': 'rgba(12,20,18,.5)', 'bar-text': '#85a096', 'bar-focus': '#e6f1ec', 'tray-bg': 'rgba(16,26,23,.92)', 'tray-text': '#e3eee9', 'tray-accent': '#e3a15d', wait: '#e3a15d' },
    c: { text: '#e3eee9', dim: '#7f958d', subtle: '#2e3b37', claude: '#e3a15d', success: '#7fd1a0', error: '#f07f7f', warning: '#e8c26a', perm: '#8fb6f0', border: '#4d625b', userbg: '#18231f', addbg: '#17362a', delbg: '#3b1f22', addword: '#2c6e4c', delword: '#8a3a42', eye: '#0d1614' } }),
]
const byId = Object.fromEntries(THEMES.map((t) => [t.id, t]))

// ---------- what each pane shows: Claude Code's screen as [class, text] runs per line ----------
const S = (cls, s) => [cls, s]
const PANES = [
  { title: 'Fix flaky retry test', state: 'working', lines: (w) => [
    [S('cl', ' ▐'), S('cl ey', '▛███▜'), S('cl', '▌'), S('', '   '), S('t', 'Claude Code '), S('d', 'v2.1.322')],
    [S('cl', '▝▜'), S('cl ey', '█████'), S('cl', '▛▘'), S('', '  '), S('d', 'Opus 5.5 · Claude Enterprise')],
    [S('cl', '  ▘▘ ▝▝  '), S('', '  '), S('d', '~/Desktop/Repos/payments')],
    [],
    [S('t ub', pad('> fix the flaky retry test in payments', w))],
    [],
    [S('t', '● '), S('t', "I'll read the test and the retry helper first.")],
    [S('ok', '● '), S('t', 'Read(src/payments/retry.test.ts)')],
    [S('d', '  ⎿  Read 84 lines')],
    [S('ok', '● '), S('t', 'Update(src/payments/retry.ts)')],
    [S('d', '  ⎿  Updated retry.ts with 2 additions and 1 removal')],
    [S('t db', '   41 -    await sleep('), S('t dw', '100'), S('t db', pad(')', w - 24))],
    [S('t ab', '   41 +    await sleep('), S('t aw', 'backoff(attempt)'), S('t ab', pad(')', w - 37))],
    [],
    'SPIN',
  ] },
  { title: 'Search A/B readout', state: 'waiting', noPrompt: true, lines: (w) => [
    [S('t ub', pad('> rerun the readout with this week', w))],
    [],
    [S('t', '● '), S('t', 'Running the readout with the new start date.')],
    [],
    [S('t', '● '), S('t', 'Bash(python3 readout.py --since nov-3)')],
    [],
    [S('pe', '╭' + '─'.repeat(w - 2) + '╮')],
    [S('pe', '│ '), S('t', pad('Bash command', w - 4)), S('pe', ' │')],
    [S('pe', '│ '), S('t', pad('  python3 readout.py --since nov-3', w - 4)), S('pe', ' │')],
    [S('pe', '│ '), S('t', pad('Do you want to proceed?', w - 4)), S('pe', ' │')],
    [S('pe', '│ '), S('pe', pad('❯ 1. Yes', w - 4)), S('pe', ' │')],
    [S('pe', '│ '), S('d', pad('  2. No, and tell Claude what to do', w - 4)), S('pe', ' │')],
    [S('pe', '╰' + '─'.repeat(w - 2) + '╯')],
  ] },
  { title: 'Amplitude dashboard', state: 'done', lines: (w) => [
    [S('t ub', pad('> why did buy volume drop after the guardrail', w))],
    [],
    [S('ok', '● '), S('t', 'amplitude - query_amplitude_data (MCP)')],
    [S('d', '  ⎿  Returned 2 series')],
    [],
    [S('t', '● '), S('t', 'Buy volume fell 3.5% in the week after the')],
    [S('t', '  guardrail, almost all of it from orders over $500.')],
    [],
    [S('d', '✻ Brewed for 48s')],
  ] },
  { title: 'Flex combo prototypes', state: 'idle', lines: (w) => [
    [S('t ub', pad('> how would flex work on existing combos', w))],
    [],
    [S('t', '● '), S('t', 'Flex pays out early once enough legs have won.')],
    [],
    [S('er', '● '), S('t', 'Bash(npm test -- flex)')],
    [S('er', '  ⎿  Error: 1 test failed in flex.spec.ts')],
    [],
    [S('d', '✻ Crunched for 51s')],
  ] },
]
function pad(s, n) { return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length) }

// ---------- state ----------
let root, fit, sp, ground, gctx, fx, fctx, tray, thumbsEl, stage
let cw = 6.02, ox = 0, oy = 0, cols = 0, rows = 0
let theme = byId.spool, mode = 'clear', trayOpen = true, focusIdx = 0, openedWith = 'spool', explode = false
const panes = [] // { el, tel, rect:{x,y,w,h} (window coords), tx, ty (text origin), cols, rows, state, occ:Set of "i,j" }
let occ = new Uint8Array(0), occCanvas, scene = null, sceneState = {}, lastFrame = 0, t0 = performance.now(), events = [], hover = -1, pointer = { x: -1, y: -1 }
let spinEl = null, spinStart = performance.now(), applyTime = 0, shelf = 'built'

function mount(el) {
  stage = el
  stage.classList.add('sp-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'application')
  stage.setAttribute('aria-label', 'Spool window with themes. Use the brush button or press T to open the theme tray; arrow keys preview, Return applies, Escape reverts.')
  fit = div('sp-fit'); stage.appendChild(fit)
  sp = div('sp'); fit.appendChild(sp)
  // layers
  const lg = div('sp-layer ground'); ground = document.createElement('canvas'); ground.className = 'sp-ground'; lg.append(ground, tag('Ground · one canvas on the terminal cell grid'))
  const lc = div('sp-layer chrome'); lc.append(titleBar(), sideBar(), tag('Chrome · title bar and chat list, tinted glass'))
  const lp = div('sp-layer glass'); const desk = div('sp-desk'); lp.append(desk, tag('Panes · glass in three strengths'))
  const lt = div('sp-layer text'); const tdesk = div('sp-desk'); lt.append(tdesk, tag("Claude's text · colors from the theme"))
  const lf = div('sp-layer fx'); fx = document.createElement('canvas'); fx.className = 'sp-fx'; lf.append(fx, tag('Effects · waiting, finished, reveals'))
  const ly = div('sp-layer tray'); tray = trayEl(); ly.append(tray, tag('Theme tray'))
  sp.append(lg, lc, lp, lt, lf, ly)
  gctx = ground.getContext('2d'); fctx = fx.getContext('2d')
  measure()
  sp.dataset.mode = mode
  buildPanes(desk, tdesk)
  sizeCanvases()
  apply(byId.spool, true)
  renderThumbs()
  new ResizeObserver(fitScale).observe(stage); fitScale()
  wire()
  requestAnimationFrame(loop)
}
const div = (c) => { const d = document.createElement('div'); d.className = c; return d }
const tag = (s) => { const d = div('sp-tag'); d.textContent = s; return d }
function titleBar() {
  const t = div('sp-title')
  t.innerHTML = `<div class="sp-lights"><i></i><i></i><i></i></div>
    <button class="sp-ibtn side" type="button" aria-label="Hide the chat list">${ICON.side}</button>
    <div class="sp-switch" role="tablist" aria-label="Chats view"><span>Chat</span><span class="on">Desk</span></div>
    <button class="sp-ibtn theme" type="button" aria-label="Themes" aria-pressed="true" title="Themes (T)">${ICON.brush}</button>
    <button class="sp-ibtn tidy" type="button" aria-label="Even out the panes">${ICON.tidy}</button>`
  return t
}
function sideBar() {
  const s = div('sp-side')
  const rows = [['Desk themes plan', ''], ...PANES.map((p) => [p.title, p.state]), ['Slack thread analysis', ''], ['Staggering 5m research', ''], ['Pricing page', ''], ['Email campaign', '']]
  s.innerHTML = '<div class="sp-sec">Today</div>' + rows.map(([t, st], i) => `<div class="sp-row${i === 1 ? ' on' : ''}"><i data-s="${st}"></i><b>${t}</b></div>`).join('')
  return s
}
function trayEl() {
  const el = div('sp-tray')
  el.innerHTML = `<div class="sp-tray-h"><b>Themes</b><span>Desk and window</span><div class="sp-keys"><span>← → preview</span><span>↵ keep</span><span>esc undo</span></div></div><div class="sp-thumbs"></div>`
  thumbsEl = el.querySelector('.sp-thumbs')
  THEMES.forEach((th, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sp-thumb'; b.dataset.id = th.id; b.dataset.shelf = th.shelf || 'built'
    b.innerHTML = `<canvas width="164" height="100"></canvas><small>${th.name}${ICON.check}</small>`
    b.addEventListener('click', (e) => { focusIdx = i; const r = b.querySelector('canvas').getBoundingClientRect(), s = scale(); choose(th, (r.left + r.width / 2 - sp.getBoundingClientRect().left) / s, (r.top + r.height / 2 - sp.getBoundingClientRect().top) / s); e.stopPropagation() })
    thumbsEl.appendChild(b)
  })
  return el
}

function measure() {
  const c = document.createElement('canvas').getContext('2d'); c.font = `10px ${MONO}`
  cw = c.measureText('MMMMMMMMMM').width / 10
}
function buildPanes(desk, tdesk) {
  const dw = W - SIDE, dh = H - TITLE, m = 4, g = 4
  const pw = (dw - 2 * m - g) / 2, ph = (dh - 2 * m - g) / 2
  const rects = [[m, m], [m + pw + g, m], [m, m + ph + g], [m + pw + g, m + ph + g]].map(([x, y]) => ({ x: SIDE + x, y: TITLE + y, w: pw, h: ph }))
  ox = rects[0].x + 8; oy = rects[0].y + BAR + 3
  PANES.forEach((p, i) => {
    const r = rects[i]
    // snap each pane's first character cell onto one window-wide grid, so the ground's glyphs line up with the text
    const tx = ox + Math.ceil((r.x + 8 - ox) / cw - 1e-6) * cw, ty = oy + Math.ceil((r.y + BAR + 3 - oy) / LINE - 1e-6) * LINE
    const pc = Math.floor((r.x + r.w - 6 - tx) / cw), pr = Math.floor((r.y + r.h - 4 - ty) / LINE)
    const el = div('sp-pane' + (i === 0 ? ' focus' : '')); el.dataset.state = p.state
    Object.assign(el.style, { left: r.x - SIDE + 'px', top: r.y - TITLE + 'px', width: r.w + 'px', height: r.h + 'px' })
    el.innerHTML = `<div class="sp-bar"><i></i><span>${p.title}</span>${ICON.close}</div>`
    desk.appendChild(el)
    const tel = div('sp-tpane'); tel.dataset.state = p.state
    Object.assign(tel.style, { left: r.x - SIDE + 'px', top: r.y - TITLE + 'px', width: r.w + 'px', height: r.h + 'px' })
    const term = div('sp-term'); Object.assign(term.style, { left: tx - r.x + 'px', top: ty - r.y + 'px', width: pc * cw + 'px', height: pr * LINE + 'px' })
    tel.appendChild(term); tdesk.appendChild(tel)
    const pane = { el, tel, term, rect: r, tx, ty, cols: pc, rows: pr, state: p.state, def: p, since: -(p.age ?? 0), k: i }
    panes.push(pane)
    renderTerm(pane)
    el.addEventListener('pointerenter', () => { hover = i; drawFx(true); if (!fpsOf()) drawGround(performance.now()) })
    el.addEventListener('pointerleave', () => { if (hover === i) hover = -1; drawFx(true); if (!fpsOf()) drawGround(performance.now()) })
    el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(), s = scale(); el.style.setProperty('--mx', (e.clientX - b.left) / s + 'px'); el.style.setProperty('--my', (e.clientY - b.top) / s + 'px') })
    el.addEventListener('click', () => { panes.forEach((q) => q.el.classList.toggle('focus', q === pane)) })
  })
  const cs = Math.floor(-ox / cw), rs = Math.floor(-oy / LINE)
  sceneState.i0 = cs; sceneState.j0 = rs
  cols = Math.ceil((W - ox) / cw) - cs + 1; rows = Math.ceil((H - oy) / LINE) - rs + 1
  buildOcc()
}
function renderTerm(p) {
  const lines = p.def.lines(p.cols)
  const body = lines.filter((l) => l !== 'SPIN').length + (lines.includes('SPIN') ? 1 : 0)
  const prompt = p.def.noPrompt ? [] : [
    [S('bo', '─'.repeat(p.cols))], [S('t', '❯ ')], [S('bo', '─'.repeat(p.cols))], [S('wa', '  ⏵⏵ auto mode on'), S('d', ' (shift+tab to cycle)')],
  ]
  const free = Math.max(0, p.rows - body - prompt.length)
  const all = [...lines, ...Array(free).fill([]), ...prompt].slice(0, p.rows)
  p.term.innerHTML = ''
  p.text = []
  for (const l of all) {
    const d = div('sp-l')
    if (l === 'SPIN') { spinEl = d; d.innerHTML = spinHTML(); p.text.push(' ✻ Simmering… (14s · ↓ 1.9k tokens)'); }
    else { d.innerHTML = l.map(([c, s]) => c ? `<span class="${c}">${esc(s)}</span>` : esc(s)).join(''); p.text.push({ s: l.map((r) => r[1]).join(''), band: l.some((r) => /\b(ub|ab|db)\b/.test(r[0])) }) }
    p.term.appendChild(d)
  }
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
function spinHTML(done) {
  const secs = Math.floor((performance.now() - spinStart) / 1000) + 14
  if (done) return `<span class="d">✻ Simmered for ${secs}s</span>`
  const g = SPIN[Math.floor(performance.now() / 120) % SPIN.length]
  return `<span class="cl">${g} Simmering… </span><span class="d">(${secs}s · ↓ ${(1.9 + secs * 0.04).toFixed(1)}k tokens)</span>`
}
function buildOcc() {
  occ = new Uint8Array(cols * rows)
  for (const p of panes) {
    const ci = Math.round((p.tx - ox) / cw) - sceneState.i0, cj = Math.round((p.ty - oy) / LINE) - sceneState.j0
    p.text.forEach((ln, y) => {
      const s = typeof ln === 'string' ? ln : ln.s, band = typeof ln === 'string' ? false : ln.band
      for (let x = 0; x < p.cols; x++) {
        const on = band ? x < Math.max(s.trimEnd().length, p.cols) : (s[x] && s[x] !== ' ')
        if (!on) continue
        for (let dx = -1; dx <= 1; dx++) { const gi = ci + x + dx, gj = cj + y; if (gi >= 0 && gi < cols && gj >= 0 && gj < rows) occ[gj * cols + gi] = 1 }
      }
    })
  }
  occCanvas = document.createElement('canvas'); occCanvas.width = W; occCanvas.height = H
  const c = occCanvas.getContext('2d'); c.filter = 'blur(2.5px)'; c.fillStyle = '#000'
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (occ[j * cols + i]) c.fillRect(cellX(i) - 1, cellY(j) - 1, cw + 2, LINE + 2)
}
const cellX = (i) => ox + (i + sceneState.i0) * cw, cellY = (j) => oy + (j + sceneState.j0) * LINE
const occAt = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && occ[j * cols + i] === 1
function insidePane(x, y) { for (const p of panes) if (x >= p.rect.x && x < p.rect.x + p.rect.w && y >= p.rect.y && y < p.rect.y + p.rect.h) return p; return null }

function sizeCanvases() {
  const d = Math.min(2, devicePixelRatio || 1)
  for (const c of [ground, fx]) { c.width = W * d; c.height = H * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0) }
}
function scale() { return fit._s || 1 }
function fitScale() {
  const w = stage.clientWidth || W
  const s = Math.min(1, w / W)
  fit._s = s; fit.style.transform = `scale(${s})`; stage.style.height = H * s + 'px'
}

// ---------- applying a theme ----------
function apply(th, first) {
  theme = th; applyTime = performance.now()
  sp.dataset.theme = th.id
  const st = sp.style
  for (const k of ['chrome', 'chrome-blur', 'chrome-text', 'chrome-dim', 'chrome-sel', 'pane', 'pane-clear', 'pane-filter', 'pane-edge', 'sheen', 'bar-text', 'bar-focus', 'bar-rule', 'tray-bg', 'tray-text', 'tray-accent', 'tray-edge', 'wait', 'wait-ring', 'wait-glow', 'glow', 'pane-over', 'pane-over-blend', 'bar-font']) {
    if (th.v[k] !== undefined) st.setProperty('--' + k, th.v[k]); else st.removeProperty('--' + k)
  }
  st.setProperty('--ground', th.ground)
  const tex = th.id === 'paper' ? paperTex() : th.tex?.()
  if (tex) st.setProperty('--pane-tex', `url(${tex})`); else st.removeProperty('--pane-tex')
  th.onApply?.()
  for (const [k, v] of Object.entries(th.c)) st.setProperty('--c-' + k, v)
  scene = SCENES[th.scene]; sceneState = { i0: sceneState.i0, j0: sceneState.j0 }
  scene.init?.(sceneState)
  for (const b of thumbsEl?.children ?? []) b.setAttribute('aria-pressed', String(b.dataset.id === th.id))
  drawGround(performance.now(), true)
  drawFx(true)
}

// The reveal: the new theme grows out of the thumbnail you clicked, with an edge drawn in the new theme's own material.
let revealing = null
async function choose(th, cx, cy) {
  setFocus(THEMES.indexOf(th))
  if (th === theme) return
  openedWith = th.id
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy))
  const dur = th.edge === 'crt' ? 560 : th.edge === 'compass' ? 820 : 700
  if (reduce || !document.startViewTransition || explode) { apply(th); return }
  const vt = document.startViewTransition(() => apply(th))
  try { await vt.ready } catch { return }
  const opts = { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }
  if (th.edge === 'crt') {
    document.documentElement.animate([{ transform: 'scaleY(.006)', filter: 'brightness(4)' }, { transform: 'scaleY(.006)', filter: 'brightness(4)', offset: .18 }, { transform: 'scaleY(1)', filter: 'brightness(1)' }], { ...opts, easing: 'cubic-bezier(.23,1,.32,1)', pseudoElement: '::view-transition-new(sp-win)' })
    document.documentElement.animate([{ transform: 'scaleY(1)', opacity: 1 }, { transform: 'scaleY(.006)', opacity: 1, offset: .16 }, { transform: 'scaleY(.006)', opacity: 0, offset: .2 }, { opacity: 0 }], { ...opts, easing: 'linear', pseudoElement: '::view-transition-old(sp-win)' })
  } else {
    document.documentElement.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${R}px at ${cx}px ${cy}px)`] }, { ...opts, pseudoElement: '::view-transition-new(sp-win)' })
    if (th.edge === 'light') document.documentElement.animate({ filter: ['blur(8px)', 'blur(0px)'] }, { ...opts, pseudoElement: '::view-transition-new(sp-win)' })
  }
  revealing = { th, cx, cy, R, dur, start: performance.now() }
}
function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

// ---------- scenes: the ground, drawn on the terminal's cell grid ----------
function noise2(x, y) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j; const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }; const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g); return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v }
const fbm = (x, y) => { let a = .5, s = 0; for (let k = 0; k < 4; k++) { s += a * noise2(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 3.7; a *= .5 } return s }
let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
function glyph(c, i, j, g, color, a) { if (a <= 0.01) return; c.globalAlpha = Math.min(1, a); c.fillStyle = color; c.fillText(g, cellX(i) + cw / 2, cellY(j) + LINE / 2 + .5) }
function setGlyphFont(c) { c.font = `10px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle' }
function grainTile(alpha, light) {
  const t = document.createElement('canvas'); t.width = t.height = 160; const c = t.getContext('2d'); const img = c.createImageData(160, 160)
  for (let k = 0; k < img.data.length; k += 4) { const v = rand() * 255; img.data[k] = img.data[k + 1] = img.data[k + 2] = light ? 255 : v; img.data[k + 3] = (light ? rand() : 1) * alpha * 255 }
  c.putImageData(img, 0, 0); return t
}
let grainDark, grainLight, paperURL
function paperTex() {
  if (paperURL) return paperURL
  const t = document.createElement('canvas'); t.width = t.height = 220; const c = t.getContext('2d'); seed = 21
  const img = c.createImageData(220, 220)
  for (let k = 0; k < img.data.length; k += 4) { const v = 120 + rand() * 60; img.data[k] = v; img.data[k + 1] = v * .97; img.data[k + 2] = v * .9; img.data[k + 3] = rand() * 22 }
  c.putImageData(img, 0, 0)
  c.strokeStyle = 'rgba(120,105,80,.07)'; c.lineWidth = .6
  for (let k = 0; k < 70; k++) { const x = rand() * 220, y = rand() * 220, a = rand() * 6.28, l = 6 + rand() * 18; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke() }
  return (paperURL = t.toDataURL())
}
function paneHalo(c, p, color, a, spread = 1.2) {
  const cx = p.rect.x + p.rect.w / 2, cy = p.rect.y + p.rect.h / 2, r = Math.hypot(p.rect.w, p.rect.h) / 2 * spread
  const gr = c.createRadialGradient(cx, cy, r * .2, cx, cy, r); gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0))
  c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(p.rect.x - r, p.rect.y - r, p.rect.w + 2 * r, p.rect.h + 2 * r)
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})` }
const SCENES = {
  flat: { draw(c) { c.fillStyle = theme.ground; c.fillRect(0, 0, W, H) }, still(c, w, h) { c.fillStyle = '#161618'; c.fillRect(0, 0, w, h) } },

  clay: {
    init(s) { seed = 5; s.stars = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (rand() < .03) s.stars.push({ i, j, ph: rand() * 10, per: 1.3 + rand() * 1.8, warm: rand() < .22 })
      const lat = document.createElement('canvas'); lat.width = W; lat.height = H; const l = lat.getContext('2d'); l.fillStyle = 'rgba(243,226,207,.055)'
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { l.beginPath(); l.arc(cellX(i) + cw / 2, cellY(j) + LINE / 2, .7, 0, 7); l.fill() }
      s.lattice = lat },
    draw(c, t, s) {
      const gr = c.createRadialGradient(W * .32, H * .22, 40, W * .5, H * .5, W * .8); gr.addColorStop(0, '#2c1e16'); gr.addColorStop(1, '#120d0a')
      c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(0, 0, W, H); c.drawImage(s.lattice, 0, 0, W, H)
      for (const p of panes) { if (p.state === 'working') paneHalo(c, p, '#e58457', .10, 1.0); if (p.state === 'waiting') paneHalo(c, p, '#f0a64a', .10 + .07 * Math.sin(t * 2.4), 1.05) }
      setGlyphFont(c)
      for (const st of s.stars) {
        if (mode === 'clear' && occAt(st.i, st.j)) continue
        const x = cellX(st.i), y = cellY(st.j), p = insidePane(x, y), hot = p && p.state === 'working'
        const per = hot ? st.per / 3.2 : st.per, f = Math.floor((t / per) * SPIN.length + st.ph)
        const tw = .5 + .5 * Math.sin(t * 6.28 / per / 2 + st.ph)
        glyph(c, st.i, st.j, SPIN[((f % SPIN.length) + SPIN.length) % SPIN.length], hot || st.warm ? '#e58457' : '#f3e2cf', hot ? .9 : st.warm ? .62 : .26 + .3 * tw)
      }
      c.globalAlpha = 1
    },
    still(c, w, h) { c.fillStyle = '#1a120e'; c.fillRect(0, 0, w, h); c.font = '7px sans-serif'; c.textAlign = 'center'; seed = 3; for (let k = 0; k < 40; k++) { c.fillStyle = k % 4 ? 'rgba(243,226,207,.45)' : '#e58457'; c.fillText('✻', rand() * w, rand() * h) } },
  },

  glass: {
    init(s) { if (s.wall) return; const wall = document.createElement('canvas'); wall.width = W; wall.height = H; const w = wall.getContext('2d')
      w.fillStyle = '#121430'; w.fillRect(0, 0, W, H); w.filter = 'blur(60px)'
      const blob = (x, y, r, col) => { w.fillStyle = col; w.beginPath(); w.ellipse(x, y, r, r * .72, .4, 0, 7); w.fill() }
      blob(180, 120, 260, '#3b2a8a'); blob(760, 90, 300, '#0f5d73'); blob(560, 520, 320, '#6a2f6e'); blob(980, 560, 220, '#c4664e'); blob(320, 600, 200, '#1f3f8c'); blob(640, 300, 140, '#2c7f8a')
      w.filter = 'none'; s.wall = wall },
    draw(c, t, s) { c.globalAlpha = 1; c.drawImage(s.wall, 0, 0, W, H); if (!grainLight) grainLight = grainTile(.05, true); c.fillStyle = c.createPattern(grainLight, 'repeat'); c.fillRect(0, 0, W, H)
      for (const p of panes) if (p.state === 'waiting') paneHalo(c, p, '#ffb35c', .16, .95) },
    still(c, w, h) { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3b2a8a'); g.addColorStop(.5, '#0f5d73'); g.addColorStop(1, '#c4664e'); c.fillStyle = g; c.fillRect(0, 0, w, h) },
  },

  paper: {
    draw(c) {
      c.globalAlpha = 1; c.fillStyle = '#2d5a4a'; c.fillRect(0, 0, W, H)
      if (!grainDark) grainDark = grainTile(.07, false); c.fillStyle = c.createPattern(grainDark, 'repeat'); c.globalAlpha = .5; c.fillRect(0, 0, W, H); c.globalAlpha = 1
      c.lineWidth = .6
      for (let i = -8; i < cols + 8; i += 4) { const x = Math.round(cellX(i)) + .5; c.strokeStyle = (i + sceneState.i0) % 20 === 0 ? 'rgba(232,240,214,.26)' : 'rgba(232,240,214,.11)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke() }
      for (let j = -4; j < rows + 4; j += 2) { const y = Math.round(cellY(j)) + .5; c.strokeStyle = (j + sceneState.j0) % 10 === 0 ? 'rgba(232,240,214,.26)' : 'rgba(232,240,214,.11)'; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke() }
      // rulers along the desk's top and left edges, counted in terminal columns and rows
      c.strokeStyle = 'rgba(238,242,228,.7)'; c.fillStyle = 'rgba(238,242,228,.75)'; c.font = `7px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'
      c.font = `6.5px ${MONO}`
      for (let i = 0; i < (W - SIDE) / cw; i++) { const x = Math.round(SIDE + 4 + i * cw) + .5, len = i % 10 === 0 ? 5 : i % 5 === 0 ? 3 : 1.5; c.beginPath(); c.moveTo(x, TITLE); c.lineTo(x, TITLE - len); c.stroke(); if (i % 10 === 0 && i && Math.abs(x - W / 2) > 84) c.fillText(String(i), x + 6, TITLE - 1.5) }
      c.textAlign = 'right'; c.textBaseline = 'middle'
      for (let j = 0; j < (H - TITLE) / LINE; j++) { const y = Math.round(TITLE + 4 + j * LINE) + .5, len = j % 10 === 0 ? 5 : j % 5 === 0 ? 3 : 1.5; c.beginPath(); c.moveTo(SIDE, y); c.lineTo(SIDE - len, y); c.stroke(); if (j % 10 === 0 && j) c.fillText(String(j), SIDE - 7, y + 5) }
      if (hover >= 0) { const p = panes[hover]; c.fillStyle = 'rgba(255,224,102,.9)'; c.fillRect(p.rect.x, TITLE - 3, p.rect.w, 2); c.fillRect(SIDE - 3, p.rect.y, 2, p.rect.h)
        c.font = `600 8px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'
        const lab = `${p.cols} cols`, lw = c.measureText(lab).width + 10, lx = p.rect.x + p.rect.w / 2
        c.fillStyle = '#2d5a4a'; c.fillRect(lx - lw / 2, TITLE - 13, lw, 10); c.fillStyle = '#ffe066'; c.fillText(lab, lx, TITLE - 8)
        c.save(); c.translate(SIDE - 9, p.rect.y + p.rect.h / 2); c.rotate(-Math.PI / 2); c.fillStyle = '#2d5a4a'; c.fillRect(-22, -6, 44, 11); c.fillStyle = '#ffe066'; c.fillText(`${p.rows} rows`, 0, 0); c.restore() }
    },
    still(c, w, h) { c.fillStyle = '#2d5a4a'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(232,240,214,.18)'; c.lineWidth = .5; for (let x = 0; x < w; x += 8) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, h); c.stroke() } for (let y = 0; y < h; y += 8) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(w, y + .5); c.stroke() } },
  },

  blueprint: {
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#133d69'); g.addColorStop(1, '#0d2d50'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, W, H)
      c.lineWidth = .5
      for (let i = -8; i < cols + 8; i += 2) { const k = i + sceneState.i0, x = Math.round(cellX(i)) + .25; c.strokeStyle = k % 8 === 0 ? 'rgba(205,228,255,.16)' : 'rgba(205,228,255,.055)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke() }
      for (let j = -4; j < rows + 4; j++) { const k = j + sceneState.j0, y = Math.round(cellY(j)) + .25; c.strokeStyle = k % 4 === 0 ? 'rgba(205,228,255,.16)' : 'rgba(205,228,255,.055)'; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke() }
      c.strokeStyle = 'rgba(225,238,255,.4)'; c.lineWidth = .75
      for (let i = -8; i < cols + 8; i++) for (let j = -4; j < rows + 4; j++) { if ((i + sceneState.i0) % 8 || (j + sceneState.j0) % 4) continue; const x = cellX(i), y = cellY(j); c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke() }
    },
    still(c, w, h) { c.fillStyle = '#123a64'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(205,228,255,.2)'; c.lineWidth = .5; for (let x = 0; x < w; x += 6) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, h); c.stroke() } for (let y = 0; y < h; y += 6) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(w, y + .5); c.stroke() } },
  },

  phosphor: {
    draw(c) { c.globalAlpha = 1; c.fillStyle = '#0a0d0b'; c.fillRect(0, 0, W, H); if (!grainDark) grainDark = grainTile(.07, false); c.globalAlpha = .35; c.fillStyle = c.createPattern(grainDark, 'repeat'); c.fillRect(0, 0, W, H); c.globalAlpha = 1 },
    still(c, w, h) { c.fillStyle = '#0a0d0b'; c.fillRect(0, 0, w, h) },
  },

  snow: {
    init(s) { seed = 9; s.f = []; for (let k = 0; k < 320; k++) s.f.push(this.flake(true)); s.piles = panes.map((p, n) => { const a = new Float32Array(p.cols + 4); for (let x = 0; x < a.length; x++) a[x] = Math.max(0, fbm(x * .09 + n * 7.3, n * 1.7) * 2.3 - 1.02); return a }) },
    flake(any) { const d = rand(); return { x: rand() * W, y: any ? rand() * H : -10, vy: 7 + d * 20, amp: 3 + d * 10, ph: rand() * 7, g: d < .5 ? '·' : d < .78 ? '*' : d < .93 ? '+' : '•', d, vx: 0 } },
    draw(c, t, s, dt) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1122'); g.addColorStop(1, '#1a2644'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, W, H)
      for (const p of panes) if (p.state === 'waiting') paneHalo(c, p, '#ffc27a', .13 + .04 * Math.sin(t * 2), 1.1)
      for (const e of events) { const age = t - e.t; if (age < 0 || age > 1.2) continue; const p = panes[e.pane]
        for (const f of s.f) { const dx = f.x - (p.rect.x + p.rect.w / 2), dy = f.y - (p.rect.y + p.rect.h / 2); const dd = Math.hypot(dx, dy); if (dd < 380 && age < .1) { f.vx += dx / dd * (380 - dd) * .25; f.vy -= 6 } } }
      setGlyphFont(c)
      for (const f of s.f) {
        f.y += f.vy * dt; f.vx *= Math.pow(.2, dt); f.x += f.vx * dt
        if (f.y > H + 10 || f.x < -20 || f.x > W + 20) Object.assign(f, this.flake(false))
        const x = f.x + Math.sin(t * .7 + f.ph) * f.amp, i = Math.floor((x - ox) / cw) - sceneState.i0, j = Math.floor((f.y - oy) / LINE) - sceneState.j0
        if (mode === 'clear' && occAt(i, j)) continue
        const warm = panes.some((p) => p.state === 'waiting' && Math.abs(x - (p.rect.x + p.rect.w / 2)) < p.rect.w * .7 && Math.abs(f.y - (p.rect.y + p.rect.h / 2)) < p.rect.h * .7)
        c.font = f.d > .82 ? `13px ${MONO}` : `10px ${MONO}`; glyph(c, i, j, f.g, warm ? '#ffd9a8' : f.d < .5 ? '#9fb0cf' : '#e6eefb', f.d < .5 ? .55 : .9)
      }
      c.globalAlpha = 1
    },
    still(c, w, h) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1122'); g.addColorStop(1, '#1a2644'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.font = '7px sans-serif'; c.fillStyle = '#e6eefb'; seed = 4; for (let k = 0; k < 34; k++) c.fillText(k % 3 ? '·' : '*', rand() * w, rand() * h) },
  },

  contour: {
    init(s) { s.lift = panes.map(() => 0) },
    draw(c, t, s, dt) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e1816'); g.addColorStop(1, '#0a110f'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, W, H)
      const step = 8, gw = Math.ceil(W / step) + 1, gh = Math.ceil(H / step) + 1
      if (!s.h || s.h.length !== gw * gh) s.h = new Float32Array(gw * gh)
      panes.forEach((p, k) => { const target = p.state === 'working' ? 1 : p.state === 'waiting' ? .7 : 0; s.lift[k] += (target - s.lift[k]) * Math.min(1, dt * .8) })
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const px = x * step, py = y * step
        let v = fbm(px * .0042 + t * .012, py * .0058 - t * .008) * 1.15
        panes.forEach((p, k) => { if (!s.lift[k]) return; const dx = (px - p.rect.x - p.rect.w / 2) / (p.rect.w * .62), dy = (py - p.rect.y - p.rect.h / 2) / (p.rect.h * .62); v += .34 * s.lift[k] * Math.exp(-(dx * dx + dy * dy)) })
        for (const e of events) { const age = t - e.t; if (age < 0 || age > 2.4) continue; const p = panes[e.pane]; const d = Math.hypot(px - p.rect.x - p.rect.w / 2, py - p.rect.y - p.rect.h / 2); v += .16 * (1 - age / 2.4) * Math.exp(-Math.pow((d - age * 240) / 30, 2)) }
        s.h[y * gw + x] = v
      }
      const off = s.off || (s.off = document.createElement('canvas')); off.width = W; off.height = H; const o = off.getContext('2d')
      const lv = []; for (let L = .32; L < 1.25; L += .045) lv.push(L)
      lv.forEach((L, li) => {
        o.beginPath(); const idx = li % 4 === 0
        for (let y = 0; y < gh - 1; y++) for (let x = 0; x < gw - 1; x++) {
          const a = s.h[y * gw + x], b = s.h[y * gw + x + 1], cc = s.h[(y + 1) * gw + x + 1], d = s.h[(y + 1) * gw + x]
          const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0); if (k === 0 || k === 15) continue
          const X = x * step, Y = y * step, lerp = (p, q) => (L - p) / (q - p)
          const top = [X + step * lerp(a, b), Y], right = [X + step, Y + step * lerp(b, cc)], bot = [X + step * lerp(d, cc), Y + step], left = [X, Y + step * lerp(a, d)]
          const seg = { 1: [left, bot], 2: [bot, right], 3: [left, right], 4: [top, right], 5: [left, top, bot, right], 6: [top, bot], 7: [left, top], 8: [left, top], 9: [top, bot], 10: [top, right, left, bot], 11: [top, right], 12: [left, right], 13: [bot, right], 14: [left, bot] }[k]
          for (let q = 0; q < seg.length; q += 2) { o.moveTo(seg[q][0], seg[q][1]); o.lineTo(seg[q + 1][0], seg[q + 1][1]) }
        }
        o.lineWidth = idx ? 1.25 : .7; o.strokeStyle = idx ? 'rgba(98,160,140,.75)' : 'rgba(70,118,104,.55)'; o.stroke()
      })
      // working and waiting panes tint the lines around them amber, the color of Claude's accent in this theme
      o.globalCompositeOperation = 'source-atop'
      panes.forEach((p, k) => { if (s.lift[k] > .05) { const cx = p.rect.x + p.rect.w / 2, cy = p.rect.y + p.rect.h / 2, r = Math.hypot(p.rect.w, p.rect.h) * .62; const gr = o.createRadialGradient(cx, cy, r * .3, cx, cy, r); gr.addColorStop(0, `rgba(240,170,96,${1 * s.lift[k]})`); gr.addColorStop(1, 'rgba(227,161,93,0)'); o.fillStyle = gr; o.fillRect(0, 0, W, H) } })
      o.globalCompositeOperation = 'source-over'
      if (mode === 'clear') { o.globalCompositeOperation = 'destination-out'; o.drawImage(occCanvas, 0, 0); o.globalCompositeOperation = 'source-over' }
      c.drawImage(off, 0, 0, W, H)
    },
    still(c, w, h) { c.fillStyle = '#0d1614'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(98,160,140,.7)'; c.lineWidth = .7; for (let r = 6; r < 120; r += 7) { c.beginPath(); c.ellipse(w * .55, h * .6, r * 1.25, r * .8, .3, 0, 7); c.stroke() } },
  },
}

// ---------- effects layer: state reactions and the reveal edge ----------
function drawFx(force) {
  const c = fctx; c.clearRect(0, 0, W, H)
  const now = performance.now(), t = (now - t0) / 1000
  if (theme.id === 'blueprint') {
    panes.forEach((p, k) => {
      const show = hover === k || now - applyTime < 1500 || events.some((e) => e.pane === k && t - e.t < 1.6)
      if (show) dims(c, p, hover === k ? 1 : Math.max(0, 1 - Math.max(0, (now - applyTime - 900) / 600)))
      if (p.state === 'waiting') cloud(c, p, Math.min(1, (now - applyTime) / 600))
    })
  }
  if (theme.id === 'snowfall') snowPiles(c)
  if (theme.id === 'clay') clayBurst(c, t)
  if (theme.fx) { c.save(); theme.fx(c, t, now); c.restore() }
  if (revealing) edge(c, now)
}
function dims(c, p, a) {
  if (a <= 0) return
  c.save(); c.globalAlpha = a; c.strokeStyle = '#d6e8ff'; c.fillStyle = '#d6e8ff'; c.lineWidth = .75; c.font = `600 9px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'
  const y = p.ty + (p.rows - 6.5) * LINE, x0 = p.tx, x1 = p.tx + p.cols * cw, mid = (x0 + x1) / 2, label = `${p.cols} cols`, lw = c.measureText(label).width + 10
  c.beginPath(); c.moveTo(x0, y); c.lineTo(mid - lw / 2, y); c.moveTo(mid + lw / 2, y); c.lineTo(x1, y)
  c.moveTo(x0, y - 5); c.lineTo(x0, y + 5); c.moveTo(x1, y - 5); c.lineTo(x1, y + 5); c.moveTo(x0 - 3, y + 3); c.lineTo(x0 + 3, y - 3); c.moveTo(x1 - 3, y + 3); c.lineTo(x1 + 3, y - 3); c.stroke()
  c.save(); c.fillStyle = 'rgba(16,52,90,.92)'; c.fillRect(mid - lw / 2, y - 7, lw, 14); c.restore(); c.fillText(label, mid, y)
  const xr = x1 - 14, y0 = p.ty, y1 = p.ty + p.rows * LINE, my = (y0 + y1) / 2
  c.beginPath(); c.moveTo(xr, y0); c.lineTo(xr, my - 16); c.moveTo(xr, my + 16); c.lineTo(xr, y1); c.moveTo(xr - 5, y0); c.lineTo(xr + 5, y0); c.moveTo(xr - 5, y1); c.lineTo(xr + 5, y1); c.stroke()
  c.save(); c.translate(xr, my); c.rotate(-Math.PI / 2); c.save(); c.fillStyle = 'rgba(16,52,90,.92)'; c.fillRect(-24, -7, 48, 14); c.restore(); c.fillText(`${p.rows} rows`, 0, 0); c.restore()
  c.restore()
}
function cloud(c, p, k) {
  // a drafting revision cloud: scallops around the pane's title, the mark for "look here"
  const x = p.rect.x + 4, y = p.rect.y + 3, w = Math.min(p.rect.w - 8, 150), h = BAR - 6, r = 4.2
  const pts = []; const per = 2 * (w + h), n = Math.round(per / (r * 1.7))
  for (let q = 0; q < n; q++) { let d = q / n * per; let px, py; if (d < w) { px = x + d; py = y } else if ((d -= w) < h) { px = x + w; py = y + d } else if ((d -= h) < w) { px = x + w - d; py = y + h } else { d -= w; px = x; py = y + h - d } pts.push([px, py]) }
  c.save(); c.strokeStyle = '#ff8a5c'; c.lineWidth = 1.1; c.beginPath()
  const m = Math.floor(pts.length * k)
  for (let q = 0; q < m; q++) { const [ax, ay] = pts[q], [bx, by] = pts[(q + 1) % pts.length]; const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1; c.moveTo(ax, ay); c.quadraticCurveTo(mx - nx / nl * r * 1.3, my - ny / nl * r * 1.3, bx, by) }
  c.stroke(); c.restore()
}
function clayBurst(c, t) {
  c.save(); setGlyphFont(c)
  c.font = `12px ${MONO}`
  for (const e of events) { const age = (t - e.t) / 1.7; if (age < 0 || age > 1) continue; const p = panes[e.pane], ea = 1 - Math.pow(1 - age, 3)
    for (let k = 0; k < 44; k++) { const a = k / 44 * Math.PI * 2 + k * .37, cx = p.rect.x + p.rect.w / 2, cy = p.rect.y + p.rect.h / 2, rx = p.rect.w * (.18 + .42 * ea) + (k % 5) * 4, ry = p.rect.h * (.18 + .42 * ea) + (k % 3) * 4
      c.globalAlpha = (1 - age) * (k % 3 ? .95 : .6); c.fillStyle = k % 4 ? '#e58457' : '#f6dcc4'; c.fillText(SPIN[(k + Math.floor(age * 12)) % SPIN.length], cx + Math.cos(a) * rx, cy + Math.sin(a) * ry) } }
  c.restore()
}
function snowPiles(c) {
  const s = sceneState; if (!s.piles) return
  // soft drifts that settle on the top edge of each pane, only where the snow happened to land
  c.save(); c.fillStyle = 'rgba(238,243,252,.95)'; c.shadowColor = 'rgba(160,190,240,.35)'; c.shadowBlur = 3
  panes.forEach((p, k) => {
    const a = s.piles[k], n = p.cols + 2, x0 = p.rect.x + 2, span = p.rect.w - 4, base = p.rect.y + 1.5
    c.beginPath(); c.moveTo(x0, base)
    let px0 = x0, py0 = base
    for (let x = 0; x <= n; x += 3) { const h = Math.min(6, ((a[x] || 0) + (a[x + 1] || 0) + (a[x + 2] || 0)) / 3 * 6.5); const px = x0 + Math.min(n, x) * span / n, py = base - h; c.quadraticCurveTo(px0, py0, (px0 + px) / 2, (py0 + py) / 2); px0 = px; py0 = py }
    c.quadraticCurveTo(px0, py0, x0 + span, base)
    c.lineTo(x0 + span, base); c.closePath(); c.fill()
  })
  c.restore()
}
function edge(c, now) {
  const r = revealing, p = Math.min(1, (now - r.start) / r.dur), e = easeInOut(p), rad = r.R * e
  if (p >= 1) { revealing = null; return }
  c.save()
  const kind = r.th.edge
  if (typeof kind === 'function') { kind(c, r.cx, r.cy, rad, p, e); c.restore(); return }
  if (kind === 'glyphs' || kind === 'flurry') {
    setGlyphFont(c); c.font = `11px ${MONO}`
    const n = Math.max(12, Math.floor(rad * 2 * Math.PI / 11))
    for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2, jit = (Math.sin(q * 12.9898) * 43758.5453 % 1) * 8
      const rr = rad + (kind === 'flurry' ? jit * (1 + p * 3) : jit * .5)
      c.globalAlpha = (1 - p) * .95; c.fillStyle = kind === 'glyphs' ? '#e58457' : '#eef3fb'
      c.fillText(kind === 'glyphs' ? SPIN[(q + Math.floor(p * 10)) % SPIN.length] : (q % 3 ? '·' : '*'), r.cx + Math.cos(a) * rr, r.cy + Math.sin(a) * rr) }
  } else if (kind === 'compass') {
    c.strokeStyle = '#e6f0ff'; c.lineWidth = .9; c.globalAlpha = .9 * (1 - p * .6)
    c.beginPath(); c.arc(r.cx, r.cy, rad, 0, Math.PI * 2 * Math.min(1, p * 2.2)); c.stroke()
    c.setLineDash([3, 4]); c.globalAlpha = .5 * (1 - p); c.beginPath(); c.arc(r.cx, r.cy, Math.max(0, rad - 10), 0, Math.PI * 2); c.stroke(); c.setLineDash([])
    const a = p * Math.PI * 2.2; c.globalAlpha = .8 * (1 - p); c.beginPath(); c.moveTo(r.cx, r.cy); c.lineTo(r.cx + Math.cos(a) * rad, r.cy + Math.sin(a) * rad); c.stroke()
    c.beginPath(); c.moveTo(r.cx - 6, r.cy); c.lineTo(r.cx + 6, r.cy); c.moveTo(r.cx, r.cy - 6); c.lineTo(r.cx, r.cy + 6); c.stroke()
  } else if (kind === 'ink') {
    for (let q = 0; q < 140; q++) { const a = q * 2.399963, jit = ((q * 7919) % 13) / 13, rr = rad + (jit - .3) * 10
      c.globalAlpha = .28 * (1 - p); c.fillStyle = '#2a2824'; c.beginPath(); c.arc(r.cx + Math.cos(a) * rr, r.cy + Math.sin(a) * rr, .8 + jit * 2.4, 0, 7); c.fill() }
  } else if (kind === 'rings') {
    c.strokeStyle = '#62a08c'; for (let q = 0; q < 3; q++) { c.globalAlpha = (1 - p) * (.7 - q * .2); c.lineWidth = q ? .7 : 1.2; c.beginPath(); c.arc(r.cx, r.cy, Math.max(0, rad - q * 11), 0, 7); c.stroke() }
  } else if (kind === 'light') {
    c.globalAlpha = (1 - p) * .55; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.shadowColor = '#ffffff'; c.shadowBlur = 14; c.beginPath(); c.arc(r.cx, r.cy, rad, 0, 7); c.stroke()
  } else if (kind === 'crt') {
    const k2 = Math.min(1, p / .25); c.globalAlpha = (1 - k2) * .9; c.fillStyle = '#c8ffd8'; c.fillRect(0, H / 2 - 1, W, 2)
  } else {
    c.globalAlpha = (1 - p) * .5; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.arc(r.cx, r.cy, rad, 0, 7); c.stroke()
  }
  c.restore()
}

// ---------- loop ----------
function drawGround(now, force) {
  const t = (now - t0) / 1000, dt = Math.min(.1, (now - (lastFrame || now)) / 1000)
  lastFrame = now
  gctx.save(); scene.draw(gctx, t, sceneState, dt); gctx.restore()
}
let lastGround = 0, lastSpin = 0
function loop(now) {
  requestAnimationFrame(loop)
  if (document.hidden) return
  const fps = reduce ? 0 : theme.fps
  if (fps && now - lastGround >= 1000 / fps) { lastGround = now; drawGround(now) }
  if (now - lastSpin > 120 && spinEl && panes[0].state === 'working') { lastSpin = now; spinEl.innerHTML = spinHTML() }
  const tt = (now - t0) / 1000
  if (revealing || theme.id === 'blueprint' || theme.id === 'snowfall' || theme.live?.(tt) || events.some((e) => tt - e.t < 2)) drawFx()
}

// ---------- tray, keys, controls ----------
function setFocus(i) { focusIdx = (i + THEMES.length) % THEMES.length; for (const [k, b] of [...thumbsEl.children].entries()) b.toggleAttribute('data-focus', k === focusIdx) }
function openTray(on) {
  trayOpen = on; tray.hidden = !on
  sp.querySelector('.sp-ibtn.theme').setAttribute('aria-pressed', String(on))
  if (on) { openedWith = theme.id; setFocus(THEMES.indexOf(theme)) }
}
function wire() {
  sp.querySelector('.sp-ibtn.theme').addEventListener('click', (e) => { e.stopPropagation(); openTray(!trayOpen); stage.focus({ preventScroll: true }) })
  stage.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') { openTray(!trayOpen); e.preventDefault(); return }
    if (!trayOpen) return
    // keys preview at once with no animation; a click plays the reveal
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const list = THEMES.filter((t) => (t.shelf || 'built') === shelf), at = list.indexOf(THEMES[focusIdx]); const next = list[((at < 0 ? 0 : at) + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length]; setFocus(THEMES.indexOf(next)); apply(next); e.preventDefault() }
    else if (e.key === 'Enter') { openedWith = theme.id; openTray(false); e.preventDefault() }
    else if (e.key === 'Escape') { apply(byId[openedWith]); openTray(false); e.preventDefault() }
  })
  stage.addEventListener('pointerdown', () => stage.focus({ preventScroll: true }))
  setFocus(0)
}
function finishTurn() {
  const p = panes[0]; if (p.state !== 'working') return
  const t = (performance.now() - t0) / 1000
  events.push({ pane: 0, t }); events = events.filter((e) => t - e.t < 4)
  p.state = 'done'; p.since = t; p.el.dataset.state = 'done'; p.tel.dataset.state = 'done'; spinEl.innerHTML = spinHTML(true)
  theme.onDone?.(p, t)
  sideState(0, 'done')
  if (theme.id === 'paper') { const ck = document.createElement('span'); ck.className = 'sp-check'; ck.style.left = 9 + 6 + measureTitle(p) + 'px'; ck.innerHTML = '<svg viewBox="0 0 15 13"><path d="M1.5 7.2 5.2 11 13.5 1.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; p.el.appendChild(ck); p.check = ck }
  if (theme.id === 'glass') { p.el.setAttribute('data-sweep', ''); setTimeout(() => p.el.removeAttribute('data-sweep'), 950) }
  if (theme.id === 'phosphor') { p.tel.setAttribute('data-flash', ''); setTimeout(() => p.tel.removeAttribute('data-flash'), 450) }
  if (!fpsOf()) drawGround(performance.now())
  clearTimeout(p.timer)
  p.timer = setTimeout(() => { p.state = 'working'; p.since = (performance.now() - t0) / 1000; theme.onWork?.(p); p.el.dataset.state = 'working'; p.tel.dataset.state = 'working'; spinStart = performance.now(); p.check?.remove(); sideState(0, 'working'); if (!fpsOf()) drawGround(performance.now()) }, 4200)
}
const fpsOf = () => (reduce ? 0 : theme.fps)
function measureTitle(p) { const c = document.createElement('canvas').getContext('2d'); c.font = '500 10.5px -apple-system, system-ui, sans-serif'; return 5 + 6 + c.measureText(p.def.title).width }
function sideState(i, s) { const row = sp.querySelectorAll('.sp-row')[i + 1]; row?.querySelector('i')?.setAttribute('data-s', s) }
function setMode(m) { mode = m; sp.dataset.mode = m; drawGround(performance.now(), true) }
function setExplode(on) {
  explode = on; if (on) { sp.setAttribute('data-explode', ''); openTray(true) } else sp.removeAttribute('data-explode')
}
function renderThumbs() {
  const keep = theme, keepState = sceneState, keepMode = mode
  const big = document.createElement('canvas'); big.width = W; big.height = H; const b = big.getContext('2d')
  THEMES.forEach((th, k) => {
    theme = th; mode = 'clear'; sceneState = { i0: keepState.i0, j0: keepState.j0 }; const sc = SCENES[th.scene]; sc.init?.(sceneState)
    if (th.scene === 'snow') for (let q = 0; q < 30; q++) sc.draw(b, q / 15, sceneState, 1 / 15)
    sc.draw(b, 3.2, sceneState, 1 / 15)
    th.thumbGround?.(b)
    if (th.v.chrome !== 'transparent') { b.globalAlpha = 1; b.fillStyle = th.v.chrome; b.fillRect(0, 0, W, TITLE); b.fillRect(0, TITLE, SIDE, H - TITLE) }
    for (const p of panes) {
      b.globalAlpha = 1; b.fillStyle = th.v['pane-clear'] || th.v.pane; roundRect(b, p.rect.x, p.rect.y, p.rect.w, p.rect.h, 5); b.fill()
      const lines = [[th.c.claude, .16], [th.c.dim, .38], [0], [th.c.text, .6], [th.c.text, .44], [th.c.dim, .3], [th.c.success, .5], [th.c.text, .52], [0], [p.state === 'waiting' ? th.c.perm : th.c.text, .7], [th.c.dim, .4]]
      lines.forEach(([col, f], q) => { if (!col) return; b.fillStyle = col; b.globalAlpha = .9; b.fillRect(p.tx, p.ty + q * 14, (p.cols * cw) * f, 6) })
    }
    if (th.fx) { b.save(); th.fx(b, 3.2, performance.now(), true); b.restore() }
    if (th.id === 'phosphor') { b.globalAlpha = .25; b.fillStyle = '#000'; for (let y = 0; y < H; y += 3) b.fillRect(0, y, W, 1) }
    b.globalAlpha = 1
    const cv = thumbsEl.children[k].querySelector('canvas'), c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'
    c.drawImage(big, SIDE - 40, 0, W - SIDE + 40, H, 0, 0, cv.width, cv.height)
  })
  theme = keep; sceneState = keepState; mode = keepMode; scene = SCENES[theme.scene]; scene.init?.(sceneState)
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }

function setShelf(s) { shelf = s; sp.dataset.shelf = s; const first = THEMES.find((t) => (t.shelf || 'built') === s); if ((theme.shelf || 'built') !== s) choose(first, 520, 560); else setFocus(THEMES.indexOf(theme)) }
window.SpoolThemes = { mount, setShelf, setMode, finishTurn, setExplode, tray: (on) => openTray(on), apply: (id) => apply(byId[id]), choose: (id, x = 520, y = 560) => choose(byId[id], x, y), themes: THEMES.map((t) => t.id), _theme: () => theme, _panes: () => panes, _state: () => ({ theme: theme.id, mode, cols, rows, cw }) }
