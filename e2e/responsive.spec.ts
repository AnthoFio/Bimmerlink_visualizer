import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'
import { colouredPixels, openLog } from './support.ts'

const HEIGHT = 900

/** The time window of the first chart, as its accessible description gives it. */
async function windowOf(page: Page) {
  const text = await page.locator('.plot').first().getAttribute('aria-label')
  const match = /from ([\d.]+) s to ([\d.]+) s/.exec(text ?? '')
  if (!match) throw new Error(`no window in "${text}"`)
  return { min: Number(match[1]), max: Number(match[2]) }
}

/** Saves a full-page screenshot as an artefact of the test. */
async function snapshot(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}

/** The page does not scroll sideways, and every chart fits the viewport. */
async function expectFits(page: Page, width: number) {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scroll).toBeLessThanOrEqual(width)
  await expect
    .poll(async () => {
      const boxes = await page
        .locator('.chart-host canvas')
        .evaluateAll((canvases) => canvases.map((canvas) => canvas.getBoundingClientRect().right))
      return Math.max(...boxes)
    })
    .toBeLessThanOrEqual(width)
}

const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Parameters' })
const toggle = (page: Page) => page.getByRole('button', { name: 'Parameters' })

for (const width of [1440, 1024]) {
  test(`at ${width} px the side panel sits beside the charts`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: HEIGHT })
    await openLog(page)
    await expect(sidebar(page)).toBeVisible()
    await expect(toggle(page)).toBeHidden()
    await expectFits(page, width)
    expect(await colouredPixels(page)).toBeGreaterThan(500)
    await snapshot(page, testInfo, `layout-${width}`)
  })
}

test('at 768 px the side panel is a drawer', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 768, height: HEIGHT })
  await openLog(page)
  await expect(sidebar(page)).toBeHidden()
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
  await expectFits(page, 768)
  const chartWidth = (await page.locator('.chart-host canvas').first().boundingBox())!.width
  expect(chartWidth).toBeGreaterThan(600)
  expect(await colouredPixels(page)).toBeGreaterThan(500)
  await snapshot(page, testInfo, 'layout-768')

  await toggle(page).click()
  await expect(sidebar(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close parameters' })).toBeFocused()
  const box = (await sidebar(page).boundingBox())!
  expect(box.x).toBe(0)
  expect(box.width).toBeLessThan(768)
  await snapshot(page, testInfo, 'layout-768-drawer')

  await page.keyboard.press('Escape')
  await expect(sidebar(page)).toBeHidden()
  await expect(toggle(page)).toBeFocused()
})

test('charts resize without losing the selection, panels or zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: HEIGHT })
  await openLog(page)
  await page.getByRole('button', { name: 'Add panel' }).click()
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('60')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('120')
  await page.getByRole('button', { name: 'Apply window' }).click()
  await expect.poll(() => windowOf(page)).toEqual({ min: 60, max: 120 })
  const speed = sidebar(page).getByRole('checkbox', { name: /Engine Speed/ })
  const selected = await speed.isChecked()
  const wide = (await page.locator('.chart-host canvas').first().boundingBox())!.width

  await page.setViewportSize({ width: 768, height: HEIGHT })
  await expect
    .poll(async () => (await page.locator('.chart-host canvas').first().boundingBox())!.width)
    .toBeLessThan(wide)
  await expectFits(page, 768)
  expect(await windowOf(page)).toEqual({ min: 60, max: 120 })
  await expect(page.getByRole('region', { name: 'Panel 2' })).toBeVisible()

  await toggle(page).click()
  await speed.click()
  await page.getByRole('button', { name: 'Close parameters' }).click()
  await expect(sidebar(page)).toBeHidden()

  await page.setViewportSize({ width: 1024, height: HEIGHT })
  await expectFits(page, 1024)
  await expect(speed).toBeChecked({ checked: !selected })
  expect(await windowOf(page)).toEqual({ min: 60, max: 120 })
  await expect(page.getByRole('region', { name: 'Panel 2' })).toBeVisible()
  expect(await colouredPixels(page)).toBeGreaterThan(500)
})
