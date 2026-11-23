// The performance budgets (docs/performance.md). Run alone with `npm run e2e:perf`: other tests
// would skew the timings. Every test attaches what it measured as perf.json, also on a failure.
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'
import { BIGGEST_LOG, openLog, openLogFile, openLogText, panFrameRate, wideLog } from './support.ts'

const BUDGET = {
  parseMs: 1000,
  firstPaintMs: 1500,
  fps: 30,
  appJsGzipKb: 300,
}

async function record(testInfo: TestInfo, numbers: Record<string, unknown>) {
  const path = testInfo.outputPath('perf.json')
  writeFileSync(path, `${JSON.stringify({ test: testInfo.title, ...numbers }, null, 2)}\n`)
  await testInfo.attach('perf', { path, contentType: 'application/json' })
  console.log(`${testInfo.title}: ${JSON.stringify(numbers)}`)
}

/** The app's measures (src/lib/perfMarks.ts) of the log opened last, in milliseconds. */
async function loadTimings(page: Page) {
  const latest = (name: string) =>
    page.evaluate(
      (name) => performance.getEntriesByName(name, 'measure').at(-1)?.duration ?? null,
      name,
    )
  await expect.poll(() => latest('log-first-chart-paint')).not.toBeNull()
  return {
    parseMs: (await latest('log-parse'))!,
    firstPaintMs: (await latest('log-first-chart-paint'))!,
  }
}

/** The 210 catalog labels that the log does not already have, so that every column matches once. */
function catalogLabels(): string[] {
  const header = readFileSync(`Example/${BIGGEST_LOG}`, 'utf8').split('\n', 1)[0]!.toLowerCase()
  const { parameters } = JSON.parse(
    readFileSync('bimmerlink_n55_parameter_catalog.json', 'utf8'),
  ) as {
    parameters: { label: string }[]
  }
  const labels = new Set(parameters.map((parameter) => parameter.label))
  return [...labels].filter((label) => !header.includes(`"${label.toLowerCase()}"`))
}

test('loads the biggest example log within the parse and first paint budgets', async ({
  page,
}, testInfo) => {
  await openLog(page)
  const timings = await loadTimings(page)

  await record(testInfo, { file: BIGGEST_LOG, budget: BUDGET, ...timings })
  expect(timings.parseMs).toBeLessThan(BUDGET.parseMs)
  expect(timings.firstPaintMs).toBeLessThan(BUDGET.firstPaintMs)
})

for (const share of [0.95, 0.1]) {
  test(`loads and pans 51k rows x 13 series within budget, window ${share * 100}%`, async ({
    page,
  }, testInfo) => {
    await openLogText(page, 'wide.csv', wideLog(13))
    const timings = await loadTimings(page)
    await page.getByRole('button', { name: 'Select all' }).click()
    await expect(page.getByRole('list', { name: 'Legend' }).getByRole('listitem')).toHaveCount(13)

    const fps = await panFrameRate(page, share)

    await record(testInfo, {
      rows: 51_019,
      channels: 13,
      window: share,
      budget: BUDGET,
      ...timings,
      fps,
    })
    expect(timings.parseMs).toBeLessThan(BUDGET.parseMs)
    expect(timings.firstPaintMs).toBeLessThan(BUDGET.firstPaintMs)
    expect(fps).toBeGreaterThanOrEqual(BUDGET.fps)
  })
}

test('loads and pans a synthetic log of 210 catalog columns within budget', async ({
  page,
}, testInfo) => {
  // Over the 50 MB that Playwright passes from memory, so it goes through a file.
  const path = testInfo.outputPath('catalog-210.csv')
  writeFileSync(path, wideLog(210, catalogLabels()))
  await openLogFile(page, path)
  const timings = await loadTimings(page)
  const legend = page.getByRole('list', { name: 'Legend' }).getByRole('listitem')

  // The pan budget, with a selection made for analysis: the catalog's core channels.
  await page.getByRole('combobox', { name: 'Preset' }).selectOption('Core only')
  await page.getByRole('button', { name: 'Apply preset' }).click()
  await expect.poll(() => legend.count()).toBeGreaterThan(6)
  const core = { series: await legend.count(), fps: await panFrameRate(page, 0.95) }

  // Measured, not budgeted: every listed parameter (the hidden roles stay out) in one chart.
  await page.locator('.u-over').first().dispatchEvent('dblclick')
  await page.getByRole('button', { name: 'Select all' }).click()
  await expect.poll(() => legend.count()).toBeGreaterThan(core.series)
  const everything = { series: await legend.count(), fps: await panFrameRate(page, 0.95) }

  // The parse budget is for 13 columns; 210 get the same time per cell.
  const parseBudgetMs = (BUDGET.parseMs * 210) / 13
  await record(testInfo, {
    rows: 51_019,
    channels: 210,
    window: 0.95,
    budget: { ...BUDGET, parseMs: parseBudgetMs },
    ...timings,
    panCoreOnly: core,
    panSelectAll: everything,
  })
  expect(timings.parseMs).toBeLessThan(parseBudgetMs)
  expect(timings.firstPaintMs).toBeLessThan(BUDGET.firstPaintMs)
  expect(core.fps).toBeGreaterThanOrEqual(BUDGET.fps)
})

test('keeps the app JavaScript under 300 kB gzip, the chart library apart', async ({
  page,
  baseURL,
}, testInfo) => {
  const origin = new URL(baseURL!).origin
  const scripts = new Map<string, Promise<Buffer>>()
  // The context sees the worker's script too.
  page.context().on('response', (response) => {
    const url = new URL(response.url())
    if (url.origin === origin && url.pathname.endsWith('.js')) {
      scripts.set(url.pathname, response.body())
    }
  })
  // Opening a log loads whatever the page fetches later.
  await openLog(page)
  await page.waitForLoadState('networkidle')

  const files = await Promise.all(
    [...scripts].map(async ([path, body]) => {
      const text = (await body).toString('utf8')
      return {
        path,
        gzipKb: gzipSync(await body).length / 1000, // kB, as in the budget
        // uPlot's own class names, which no app code spells out.
        chartLib: text.includes('u-wrap') && text.includes('u-under'),
        // A label of the app: a chunk with it is app code, whatever else it holds.
        app: text.includes('BimmerLink CSV file'),
      }
    }),
  )
  const sum = (list: typeof files) => list.reduce((total, file) => total + file.gzipKb, 0)
  const chartLib = files.filter((file) => file.chartLib)
  const totalGzipKb = sum(files)
  const appGzipKb = totalGzipKb - sum(chartLib)

  await record(testInfo, {
    budget: BUDGET,
    files,
    totalGzipKb,
    chartLibGzipKb: sum(chartLib),
    appGzipKb,
  })
  // uPlot comes in a chunk of its own (vite.config.ts), apart from the app.
  expect(chartLib).toHaveLength(1)
  expect(chartLib[0]!.app).toBe(false)
  expect(files.some((file) => file.app)).toBe(true)
  expect(appGzipKb).toBeLessThan(BUDGET.appJsGzipKb)
})
