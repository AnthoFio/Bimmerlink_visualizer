// Throwaway Playwright bench for the ECharts spike. Usage: npm run build && npm run bench
// Optional env: VARIANT=nosampling|lttb|minmax is handled in the page via ?variant=...
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { runBench } from '../scripts/bench-common.mjs'

const variant = process.env.VARIANT ?? 'lttb'
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview'], { stdio: 'inherit' })
await new Promise((r) => setTimeout(r, 2500))
try {
  const res = await runBench({ chromium, url: `http://localhost:5302/?variant=${variant}`, lib: `echarts-${variant}` })
  writeFileSync(`bench-result-${variant}.run${process.env.RUN ?? 1}.json`, JSON.stringify(res, null, 2))
  console.log(JSON.stringify(res, null, 2))
} finally {
  server.kill()
}
