// Captures each new theme at rest, then its reaction to a finished turn, then a mid-reveal frame.
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
setTimeout(() => { console.error('watchdog'); app.exit(2) }, 170_000)
const only = process.argv.slice(2).find((a) => a.startsWith('--only='))?.slice(7)?.split(',')
const done = process.argv.includes('--done'), reveal = process.argv.includes('--reveal'), tray = process.argv.includes('--tray')
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1080, height: 680, useContentSize: true, backgroundColor: '#e9e9e6', webPreferences: { backgroundThrottling: false } })
  win.webContents.on('console-message', (_e, level, msg, line, src) => { if (level >= 2) console.log('[page]', msg, src, line) })
  await win.loadFile(path.join(__dirname, 'test.html'))
  const run = (js) => win.webContents.executeJavaScript(js, true)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const shot = async (name) => { const img = await win.capturePage({ x: 20, y: 20, width: 1040, height: 640 }, { stayHidden: true }); fs.writeFileSync(path.join(__dirname, 'shots', name), img.toPNG()) }
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true })
  await wait(800)
  const ids = only || ['departures', 'thermal', 'greenhouse', 'stitch', 'riso', 'sumi', 'constellation', 'rain', 'neon', 'greenbar', 'circuit', 'darkroom']
  await run(`SpoolThemes.tray(${tray})`)
  if (tray) { await run(`SpoolThemes.setShelf('new')`); await wait(1200) }
  for (const id of ids) {
    await run(`SpoolThemes.apply('${id}')`); await wait(1300); await shot(`n-${id}.png`)
    if (done) { await run(`SpoolThemes.finishTurn()`); await wait(id === 'sumi' || id === 'riso' ? 500 : 900); await shot(`d-${id}.png`); await wait(4500) }
  }
  if (reveal) for (const id of ids) {
    await run(`SpoolThemes.apply('spool'); SpoolThemes.choose('${id}', 700, 600)`); await wait(60)
    await run(`(async () => { await new Promise(r => setTimeout(r, 30)); for (const a of document.getAnimations()) { a.pause(); a.currentTime = (a.effect.getTiming().duration || 700) * .5 } })()`)
    await wait(250); await shot(`v-${id}.png`); await run(`for (const a of document.getAnimations()) a.finish()`); await wait(800)
  }
  app.exit(0)
})
