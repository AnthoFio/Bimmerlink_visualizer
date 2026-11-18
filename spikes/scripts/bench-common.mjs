// Shared throwaway Playwright harness. Each prototype exposes window.__api (see its App.tsx).
import { existsSync } from 'node:fs'
import { homedir, cpus, totalmem } from 'node:os'
import { join } from 'node:path'

const pct = (a, p) => {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
const r2 = (n) => Math.round(n * 100) / 100
const frameStats = (d) => ({
  frames: d.length,
  fps_mean: r2(1000 / mean(d)),
  frame_ms_mean: r2(mean(d)),
  frame_ms_p95: r2(pct(d, 95)),
  frame_ms_max: r2(Math.max(...d)),
  frames_over_33ms: d.filter((x) => x > 33.4).length,
})
const costStats = (d) => ({
  n: d.length,
  ms_mean: r2(mean(d)),
  ms_p95: r2(pct(d, 95)),
  ms_max: r2(Math.max(...d)),
})

function findChromium() {
  const root = join(homedir(), 'AppData', 'Local', 'ms-playwright')
  const cands = [
    join(root, 'chromium-1217', 'chrome-win64', 'chrome.exe'),
    join(root, 'chromium_headless_shell-1217', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
  ]
  return cands.find(existsSync)
}

export async function runBench({ chromium, url, lib, dpr = 1, extraArgs = [] }) {
  const exe = process.env.CHROMIUM_PATH ?? findChromium()
  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: ['--enable-precise-memory-info', ...extraArgs],
  })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const t0 = Date.now()
  await page.goto(url)
  await page.waitForFunction(() => window.__api && window.__api.info, null, { timeout: 120000 })
  const timeToApiMs = Date.now() - t0
  const info = await page.evaluate(() => window.__api.info())
  const result = {
    lib,
    machine: {
      cpu: cpus()[0].model,
      logicalCores: cpus().length,
      ramGB: r2(totalmem() / 2 ** 30),
      browser: await browser.version(),
      mode: 'headless Chromium, software raster, viewport 1280x900, DPR ' + dpr,
      node: process.version,
    },
    dataset: info,
    time_to_chart_ready_ms: timeToApiMs,
  }
  // 1. fresh render (destroy + create all 3 panels, until 2 rAFs after)
  const renders = []
  for (let i = 0; i < 7; i++) renders.push(await page.evaluate(() => window.__api.renderFresh()))
  result.initial_render_ms = { runs: renders.map(r2), median: r2(pct(renders, 50)), first: r2(renders[0]) }
  // 2. rAF-paced pan, zoomed window (10 % of log) and near-full window (95 %)
  result.pan_raf = {}
  for (const frac of [0.1, 0.95]) {
    await page.evaluate(([f]) => window.__api.panBench(30, f), [frac]) // warm-up
    const d = await page.evaluate(([f]) => window.__api.panBench(240, f), [frac])
    result.pan_raf[`window_${Math.round(frac * 100)}pct`] = frameStats(d)
  }
  // 3. un-paced updates: cost of one redraw of all panels
  result.update_cost_ms = {}
  for (const frac of [0.1, 0.95]) {
    const c = await page.evaluate(([f]) => window.__api.stress(200, f), [frac])
    result.update_cost_ms[`window_${Math.round(frac * 100)}pct`] = costStats(c)
  }
  // 4. real mouse hover across the first panel (cursor sync + tooltip) while recording frames
  await page.evaluate(() => window.__api.setWindow(window.__api.info().T0, window.__api.info().T1))
  await page.waitForTimeout(300)
  const rec = page.evaluate(() => window.__api.recordFrames(3000))
  await page.mouse.move(140, 120)
  for (let i = 0; i < 150; i++) {
    await page.mouse.move(140 + i * 7, 120 + (i % 10), { steps: 2 })
  }
  result.hover_raf = frameStats(await rec)
  // 5. real wheel zoom + drag pan on first panel; check that all panels share the window
  await page.mouse.move(600, 150)
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -120)
  await page.waitForTimeout(300)
  await page.mouse.down()
  await page.mouse.move(400, 150, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const sx = await page.evaluate(() => window.__api.scalesX())
  result.zoom_pan_sync = {
    scales_per_panel: sx,
    all_equal: sx.every((s) => Math.abs(s[0] - sx[0][0]) < 1e-6 && Math.abs(s[1] - sx[0][1]) < 1e-6),
    zoomed: sx[0][1] - sx[0][0] < info.T1 - info.T0,
  }
  // 6. memory + export + theme
  result.js_heap_mb = r2((await page.evaluate(() => window.__api.heap())) / 2 ** 20)
  result.export = await page.evaluate(() => window.__api.exportAll())
  result.theme_switch_ms = r2(
    await page.evaluate(async () => {
      const s = performance.now()
      window.__api.setTheme('dark')
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return performance.now() - s
    }),
  )
  if (process.env.SCREENSHOT) await page.screenshot({ path: process.env.SCREENSHOT })
  result.page_errors = errors
  await browser.close()
  return result
}
