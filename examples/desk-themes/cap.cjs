// Renders the prototype in a hidden window and captures each theme.
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
setTimeout(() => { console.error('watchdog'); app.exit(2) }, 120_000)
const only = process.argv.slice(2).find((a) => a.startsWith('--only='))?.slice(7)?.split(',')
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1080, height: 680, useContentSize: true, backgroundColor: '#e9e9e6', webPreferences: { backgroundThrottling: false } })
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) console.log('[page]', msg) })
  await win.loadFile(path.join(__dirname, 'test.html'))
  const run = (js) => win.webContents.executeJavaScript(js, true)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const shot = async (name) => { const img = await win.capturePage({ x: 20, y: 20, width: 1040, height: 640 }, { stayHidden: true }); fs.writeFileSync(path.join(__dirname, 'shots', name), img.toPNG()) }
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true })
  await wait(800)
  console.log(JSON.stringify(await run('SpoolThemes._state()')))
  for (const id of (only || ['spool', 'clay', 'glass', 'paper', 'blueprint', 'phosphor', 'snowfall', 'contour'])) {
    await run(`SpoolThemes.apply('${id}')`); await wait(id === 'blueprint' ? 300 : 900); await shot(`t-${id}.png`)
  }
  if (!only) {
    await run(`SpoolThemes.apply('clay'); SpoolThemes.finishTurn()`); await wait(450); await shot('r-clay-done.png')
    await wait(4400)
    await run(`SpoolThemes.apply('contour'); SpoolThemes.finishTurn()`); await wait(900); await shot('r-contour-done.png')
    await wait(4400)
    await run(`SpoolThemes.apply('paper'); SpoolThemes.finishTurn()`); await wait(700); await shot('r-paper-done.png')
    await wait(4400)
    await run(`SpoolThemes.apply('spool'); SpoolThemes.setExplode(true)`); await wait(1300); await shot('x-explode.png')
    await run(`SpoolThemes.setExplode(false)`); await wait(1000)
    // mid-reveal: start a reveal then pause every view-transition animation at 45%
    await run(`SpoolThemes.apply('spool'); SpoolThemes.choose('clay', 700, 600)`); await wait(60)
    await run(`(async () => { await new Promise(r => setTimeout(r, 30)); for (const a of document.getAnimations()) { a.pause(); a.currentTime = (a.effect.getTiming().duration || 700) * .45 } return document.getAnimations().length })()`)
    await wait(300); await shot('v-reveal.png')
    await run(`for (const a of document.getAnimations()) a.finish()`); await wait(300)
  }
  app.exit(0)
})
