// Throwaway Playwright bench for the uPlot spike. Usage: npm run build && npm run bench
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { runBench } from '../scripts/bench-common.mjs'

const variant = process.env.VARIANT ?? 'decimate' // decimate | raw
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview'], { stdio: 'inherit' })
await new Promise((r) => setTimeout(r, 2500))
try {
  const res = await runBench({ chromium, url: `http://localhost:5301/?variant=${variant}`, lib: `uplot-${variant}` })
  writeFileSync(`bench-result-${variant}.run${process.env.RUN ?? 1}.json`, JSON.stringify(res, null, 2))
  console.log(JSON.stringify(res, null, 2))
} finally {
  server.kill()
}
