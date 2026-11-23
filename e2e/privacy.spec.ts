import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { BIGGEST_LOG } from './support.ts'

interface Seen {
  url: string
  body: string
}

/** Records every request, CSP violation, console error and page error from the start. */
async function watch(page: Page) {
  const requests: Seen[] = []
  const problems: string[] = []
  page.on('request', (request) =>
    requests.push({ url: request.url(), body: request.postData() ?? '' }),
  )
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`))
  await page.exposeFunction('reportViolation', (text: string) => problems.push(`csp: ${text}`))
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const report = (window as unknown as { reportViolation: (text: string) => void })
        .reportViolation
      void report(`${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  return { requests, problems }
}

const policyOf = (page: Page) =>
  page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')

test('the built page has a strict CSP and loads only its own files', async ({ page, baseURL }) => {
  const { requests, problems } = await watch(page)
  await page.goto('./')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
  // A meta CSP covers only what comes after it, so it must precede every script.
  expect(
    await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')!
      return [...document.scripts].every(
        (script) => meta.compareDocumentPosition(script) & Node.DOCUMENT_POSITION_FOLLOWING,
      )
    }),
  ).toBe(true)
  expect(await page.evaluate(() => document.head.firstElementChild?.outerHTML)).toBe(
    '<meta charset="UTF-8">',
  )
  const policy = await policyOf(page)
  expect(policy).toContain("default-src 'self'")
  expect(policy).toContain("connect-src 'none'")
  expect(policy).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/]{43}='/)
  expect(policy).not.toContain('unsafe-')

  const origin = new URL(baseURL!).origin
  expect(requests.length).toBeGreaterThan(0)
  expect(requests.map(({ url }) => url).filter((url) => !url.startsWith(`${origin}/`))).toEqual([])
  expect(problems).toEqual([])
})

test('the privacy statement is on the landing page', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText(/processed locally in your browser/)).toBeVisible()
  await expect(page.getByText(/never uploaded/)).toBeVisible()
})

test('works with the network blocked after load and sends no log data', async ({
  page,
}, testInfo) => {
  const { requests, problems } = await watch(page)
  await page.goto('./')
  await page.waitForLoadState('networkidle')
  // The theme script ran under the CSP: its hash matches what is in the page.
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toMatch(/light|dark/)

  const loaded = requests.length
  const blocked: string[] = []
  await page.route('**/*', (route) => {
    blocked.push(route.request().url())
    return route.abort('internetdisconnected')
  })

  await page.getByLabel('BimmerLink CSV file').setInputFiles(`Example/${BIGGEST_LOG}`)
  await expect(
    page.getByRole('heading', { level: 2, name: BIGGEST_LOG, exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Add panel' }).click()

  const plot = page.locator('.plot').first()
  const before = await plot.getAttribute('aria-label')
  const area = page.locator('.u-over').first()
  const box = (await area.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -400)
  await expect.poll(() => plot.getAttribute('aria-label')).not.toBe(before)

  const download = async (name: string) => {
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name }).click(),
    ])
    const path = testInfo.outputPath(file.suggestedFilename())
    await file.saveAs(path)
    return path
  }
  const png = readFileSync(await download('Export PNG'))
  expect(png.subarray(1, 4).toString()).toBe('PNG')
  expect(readFileSync(await download('Export SVG'), 'utf8')).toContain('<svg')
  expect(readFileSync(await download('Export CSV'), 'utf8')).toMatch(/^Time,/)
  const view = await download('Export view')

  await page.getByLabel('View file').setInputFiles(view)
  await expect(page.getByRole('status').filter({ hasText: 'View imported.' })).toBeVisible()

  // Nothing at all went to the network after load, so nothing was blocked either.
  expect(blocked).toEqual([])
  expect(requests.slice(loaded).map(({ url }) => url)).toEqual([])

  // No request, before or after load, carried the file name or any log content.
  const log = readFileSync(`Example/${BIGGEST_LOG}`, 'utf8').split('\n')
  const secrets = [
    BIGGEST_LOG,
    BIGGEST_LOG.replace('.csv', ''),
    encodeURIComponent(BIGGEST_LOG),
    'Misfire Detection Counter',
    log[1000]!,
    log[20_000]!,
  ]
  for (const { url, body } of requests) {
    for (const secret of secrets) {
      expect(decodeURIComponent(url)).not.toContain(secret)
      expect(body).not.toContain(secret)
    }
  }
  expect(problems).toEqual([])
})
