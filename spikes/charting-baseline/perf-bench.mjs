// Throwaway runner for the Plotly / Recharts smoke benchmarks. Usage: npm run build && npm run bench
// Each configuration gets a hard time budget; a config that exceeds it is reported as "timeout" (that IS the result).
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const r2 = (n) => Math.round(n * 100) / 100
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]
const root = join(homedir(), 'AppData', 'Local', 'ms-playwright')
const exe = [
  join(root, 'chromium-1217', 'chrome-win64', 'chrome.exe'),
  join(root, 'chromium_headless_shell-1217', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
].find(existsSync)

const configs = [
  { name: 'plotly scattergl (gl2d bundle), 51k pts', q: 'lib=plotly-gl', budget: 90000 },
  { name: 'plotly scatter SVG (cartesian bundle), 51k pts', q: 'lib=plotly-svg', budget: 90000 },
  { name: 'recharts, 51k pts', q: 'lib=recharts', budget: 120000 },
  { name: 'recharts, pre-decimated to 2000 pts', q: 'lib=recharts&maxpts=2000', budget: 60000 },
]

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5303', '--strictPort'], {
  stdio: 'inherit',
})
await new Promise((r) => setTimeout(r, 2500))
const results = []
const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout: ' + label)), ms))])
try {
  for (const cfg of configs) {
    const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--enable-precise-memory-info'] })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const res = { config: cfg.name, machine: cpus()[0].model, browser: await browser.version() }
    try {
      const t0 = Date.now()
      await page.goto(`http://localhost:5303/perf.html?${cfg.q}`)
      await withTimeout(page.waitForFunction(() => window.__api, null, { timeout: cfg.budget }), cfg.budget, 'first render')
      res.page_load_to_first_render_ms = Date.now() - t0
      const fresh = []
      for (let i = 0; i < 3; i++) fresh.push(await withTimeout(page.evaluate(() => window.__api.renderFresh()), cfg.budget, 'renderFresh'))
      res.initial_render_ms = { runs: fresh.map(r2), median: r2(pct(fresh, 50)) }
      res.pan_raf = {}
      res.update_cost_ms = {}
      for (const frac of [0.1, 0.95]) {
        const d = await withTimeout(page.evaluate(([f]) => window.__api.panBench(60, f), [frac]), cfg.budget, 'pan')
        res.pan_raf[`window_${Math.round(frac * 100)}pct`] = { frames: d.length, fps_mean: r2(1000 / mean(d)), frame_ms_p95: r2(pct(d, 95)), frame_ms_max: r2(Math.max(...d)) }
        const c = await withTimeout(page.evaluate(([f]) => window.__api.stress(30, f), [frac]), cfg.budget, 'stress')
        res.update_cost_ms[`window_${Math.round(frac * 100)}pct`] = { n: c.length, ms_mean: r2(mean(c)), ms_p95: r2(pct(c, 95)), ms_max: r2(Math.max(...c)) }
      }
      res.js_heap_mb = r2((await page.evaluate(() => window.__api.heap())) / 2 ** 20)
    } catch (e) {
      res.error = String(e.message ?? e)
    }
    console.log(JSON.stringify(res))
    results.push(res)
    await browser.close().catch(() => {})
  }
} finally {
  server.kill()
}
mkdirSync('results', { recursive: true })
writeFileSync('results/perf-baseline.json', JSON.stringify(results, null, 2))
