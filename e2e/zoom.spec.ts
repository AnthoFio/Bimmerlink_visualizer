import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { colouredPixels, openLog } from './support.ts'

/** The time window of the first chart, as its accessible description gives it. */
async function windowOf(page: Page) {
  const text = await page.locator('.plot').first().getAttribute('aria-label')
  const match = /from ([\d.]+) s to ([\d.]+) s/.exec(text ?? '')
  if (!match) throw new Error(`no window in "${text}"`)
  return { min: Number(match[1]), max: Number(match[2]) }
}

test('wheel, drag, double click and keys zoom and pan', async ({ page }) => {
  await openLog(page)
  const area = page.locator('.u-over').first()
  const box = (await area.boundingBox())!
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const full = await windowOf(page)

  await page.mouse.move(centre.x, centre.y)
  await page.mouse.wheel(0, -400)
  await expect.poll(async () => (await windowOf(page)).max).toBeLessThan(full.max)
  const zoomed = await windowOf(page)
  expect((zoomed.min + zoomed.max) / 2).toBeCloseTo((full.min + full.max) / 2, -1)

  await page.mouse.down()
  await page.mouse.move(centre.x + 120, centre.y, { steps: 6 })
  await page.mouse.up()
  await expect.poll(async () => (await windowOf(page)).min).toBeLessThan(zoomed.min)

  await area.dblclick()
  await expect.poll(() => windowOf(page)).toEqual(full)

  await page.locator('.plot').first().focus()
  await page.keyboard.press('+')
  await expect.poll(async () => (await windowOf(page)).max).toBeLessThan(full.max)
  const keyed = await windowOf(page)
  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => (await windowOf(page)).min).toBeGreaterThan(keyed.min)

  expect(await colouredPixels(page)).toBeGreaterThan(500)
})

test.describe('touch', () => {
  test.use({ hasTouch: true })

  test('pinch zooms in', async ({ page }) => {
    await openLog(page)
    const box = (await page.locator('.u-over').first().boundingBox())!
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]
    const full = await windowOf(page)

    const session = await page.context().newCDPSession(page)
    const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', gap?: number) =>
      session.send('Input.dispatchTouchEvent', {
        type,
        touchPoints:
          gap === undefined
            ? []
            : [
                { x: x - gap, y, id: 0 },
                { x: x + gap, y, id: 1 },
              ],
      })
    await send('touchStart', 50)
    for (const gap of [70, 90, 110, 130]) await send('touchMove', gap)
    await send('touchEnd')

    await expect.poll(async () => (await windowOf(page)).max).toBeLessThan(full.max)
  })
})
