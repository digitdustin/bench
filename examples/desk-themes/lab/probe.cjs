// Starts Claude Code in a pty with a per-process custom theme, records what it prints, rewrites the theme
// file to check the live reload, then exits. No message is ever sent.
const pty = require('node-pty')
const fs = require('fs'), path = require('path'), os = require('os')
const dir = path.join(os.homedir(), '.claude', 'themes')
const madeDir = !fs.existsSync(dir)
fs.mkdirSync(dir, { recursive: true })
const file = path.join(dir, 'spool-probe.json')
const write = (c) => fs.writeFileSync(file, JSON.stringify({ name: 'Spool probe', base: 'dark', overrides: { claude: c, promptBorder: 'rgb(11,22,33)', clawd_body: c } }))
write('rgb(1,2,3)')
const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', TERM_PROGRAM: 'Spool' }
for (const k of Object.keys(env)) if (k.startsWith('CLAUDE_CODE_') || k === 'CLAUDECODE') delete env[k]
const p = pty.spawn(path.join(os.homedir(), '.local/bin/claude'), ['--settings', JSON.stringify({ theme: 'custom:spool-probe' })], { name: 'xterm-256color', cols: 100, rows: 30, cwd: path.join(os.homedir(), 'Desktop/Repos/tax-calc'), env })
let out1 = '', out2 = '', phase = 1
p.onData((d) => {
  // Answer the terminal queries Claude sends so it doesn't stall: device attributes, OSC 11 background.
  if (d.includes('\x1b[c')) p.write('\x1b[?62;22c')
  if (d.includes('\x1b]11;?')) p.write('\x1b]11;rgb:1010/1010/1212\x1b\\')
  if (phase === 1) out1 += d; else out2 += d
})
const has = (s, rgb) => s.includes(`38;2;${rgb.join(';')}`) || s.includes(`48;2;${rgb.join(';')}`)
setTimeout(() => { phase = 2; write('rgb(4,5,6)') }, 8000)
setTimeout(() => {
  try { p.kill('SIGTERM') } catch {}
  fs.rmSync(file, { force: true })
  if (madeDir) { try { fs.rmdirSync(dir) } catch {} }
  fs.writeFileSync('out1.txt', out1); fs.writeFileSync('out2.txt', out2)
  console.log(JSON.stringify({
    bytes1: out1.length, bytes2: out2.length,
    phase1_claude_1_2_3: has(out1, [1, 2, 3]), phase1_border_11_22_33: has(out1, [11, 22, 33]),
    phase1_default_claude_215_119_87: has(out1, [215, 119, 87]),
    phase2_claude_4_5_6: has(out2, [4, 5, 6]),
    sample_sgr: [...new Set((out1.match(/\x1b\[[0-9;]*m/g) || []).filter((s) => s.includes('38;2') || s.includes('48;2')))].slice(0, 12),
  }, null, 1))
  process.exit(0)
}, 14000)
