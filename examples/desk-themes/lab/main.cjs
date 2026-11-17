// Hidden-window theme lab: renders real xterm panes over the ground canvas, captures stills, prints timings.
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
const out = (n) => path.join(__dirname, n)
setTimeout(() => { console.error('watchdog'); app.exit(2) }, 90_000)
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1440, height: 900, useContentSize: true, backgroundColor: '#000000', webPreferences: { backgroundThrottling: false } })
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) console.log('[page]', msg) })
  await win.loadFile(path.join(__dirname, 'lab.html'))
  const run = (js) => win.webContents.executeJavaScript(js, true)
  const shot = async (name) => { const img = await win.capturePage(undefined, { stayHidden: true }); fs.writeFileSync(out(name), img.toPNG()); return img.getSize() }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const report = {}
  try {
    report.ready = await run('lab.ready')
    report.rafPerSecHidden = await run('lab.rafRate()')
    await run("lab.set('spool')"); await wait(300); report.size = await shot('L1-spool.png')
    await run("lab.set('clay','clear')"); await run('lab.advance(3)'); await wait(250); await shot('L2-clay-clear.png')
    report.claySim = await run('lab.sim(2)')
    await run("lab.set('clay','faint')"); await run('lab.advance(5)'); await wait(250); await shot('L3-clay-faint.png')
    await run("lab.set('contour','clear')"); report.contourSim = await run('lab.sim(1)'); await wait(250); await shot('L4-contour-clear.png')
    await run("lab.set('snow','clear')"); report.snowSim = await run('lab.sim(40, 1/15)'); await wait(250); await shot('L5-snow-clear.png')
    await run("lab.set('blueprint','clear')"); await wait(250); await shot('L6-blueprint-clear.png')
    await run("lab.set('phosphor','solid')"); await wait(400); await shot('L7-phosphor.png')
    report.switchCost = []
    for (const t of ['clay', 'contour', 'snow', 'spool']) report.switchCost.push({ to: t, ...(await run(`lab.timeSwitch('${t}')`)) })
    report.groundStats = await run('lab.stats()')
    report.reveal = await run("lab.reveal('spool','clay',0.42)"); await shot('L8-reveal.png'); await run('lab._finish()')
  } catch (e) { report.error = String(e && e.stack || e) }
  console.log(JSON.stringify(report, null, 1))
  app.exit(0)
})
