const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
setTimeout(() => { console.error('watchdog'); app.exit(2) }, 90_000)
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1080, height: 680, useContentSize: true, backgroundColor: '#e9e9e6', webPreferences: { backgroundThrottling: false } })
  await win.loadFile(path.join(__dirname, 'test.html'))
  const run = (js) => win.webContents.executeJavaScript(js, true)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const hover = (i, on = true) => run(`document.querySelectorAll('.sp-pane')[${i}].dispatchEvent(new PointerEvent('${on ? 'pointerenter' : 'pointerleave'}'))`)
  fs.mkdirSync(path.join(__dirname, 'gallery'), { recursive: true })
  await wait(700); await run('SpoolThemes.tray(false)')
  for (const id of (process.argv.find((a) => a.startsWith('--ids='))?.slice(6).split(',') || ['spool', 'clay', 'glass', 'paper', 'blueprint', 'phosphor', 'snowfall', 'contour'])) {
    await run(`SpoolThemes.apply('${id}')`)
    await wait(id === 'snowfall' ? 2500 : id === 'blueprint' ? 1800 : 900)
    if (id === 'paper' || id === 'blueprint') { await hover(0); await wait(200) }
    const img = await win.capturePage({ x: 20, y: 20, width: 1040, height: 585 }, { stayHidden: true })
    fs.writeFileSync(path.join(__dirname, 'gallery', `${id}.png`), img.toPNG())
    if (id === 'paper' || id === 'blueprint') await hover(0, false)
  }
  app.exit(0)
})
