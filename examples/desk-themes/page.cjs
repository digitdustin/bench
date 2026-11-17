// Renders the built Bench page in a hidden window and captures it in screen-height slices.
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
setTimeout(() => { console.error('watchdog'); app.exit(2) }, 90_000)
const theme = process.argv.find((a) => a.startsWith('--theme='))?.slice(8)
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1280, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } })
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2 && !/Security|Content-Security/.test(msg)) console.log('[page]', msg) })
  await win.loadFile(path.join(__dirname, 'desk-themes.html'))
  const run = (js) => win.webContents.executeJavaScript(js, true)
  if (theme) await run(`document.documentElement.dataset.theme='${theme}'`)
  await new Promise((r) => setTimeout(r, 1500))
  const H = await run('document.documentElement.scrollHeight')
  fs.mkdirSync(path.join(__dirname, 'page'), { recursive: true })
  let k = 0
  for (let y = 0; y < H; y += 900) {
    await run(`window.scrollTo(0, ${y})`); await new Promise((r) => setTimeout(r, 350))
    const img = await win.capturePage(undefined, { stayHidden: true })
    fs.writeFileSync(path.join(__dirname, 'page', `${theme || 'auto'}-${String(k++).padStart(2, '0')}.png`), img.toPNG())
  }
  console.log('height', H, 'slices', k)
  app.exit(0)
})
