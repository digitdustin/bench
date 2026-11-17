// Starts Claude Code in a pty, answers its OSC 7501 probe like a supporting terminal, and records the status reports. No message is sent.
const pty = require('node-pty')
const path = require('path'), os = require('os')
const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', TERM_PROGRAM: 'Spool' }
for (const k of Object.keys(env)) if (k.startsWith('CLAUDE_CODE_') || k === 'CLAUDECODE') delete env[k]
const p = pty.spawn(path.join(os.homedir(), '.local/bin/claude'), [], { name: 'xterm-256color', cols: 100, rows: 30, cwd: path.join(os.homedir(), 'Desktop/Repos/tax-calc'), env })
let all = '', probes = []
p.onData((d) => {
  all += d
  if (d.includes('\x1b[c')) p.write('\x1b[?62;22c')
  if (d.includes('\x1b]11;?')) p.write('\x1b]11;rgb:1010/1010/1212\x1b\\')
  if (d.includes('\x1b]7501;?')) { probes.push(Date.now()); p.write('\x1b]7501;?\x1b\\') }
})
setTimeout(() => {
  try { p.kill('SIGTERM') } catch {}
  const reports = [...all.matchAll(/\x1b\]7501;([^\x07\x1b]*)(?:\x07|\x1b\\)/g)].map((m) => m[1])
  console.log(JSON.stringify({ probes: probes.length, reports, tab: [...all.matchAll(/\x1b\]21337;([^\x07\x1b]*)/g)].map((m) => m[1]).slice(0, 4) }, null, 1))
  process.exit(0)
}, 12000)
