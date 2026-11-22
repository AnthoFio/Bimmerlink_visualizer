import { expect, test } from '@playwright/test'
import { openLogText, wideLog } from './support.ts'

test('the readout of 20 series scrolls under the chart instead of covering it', async ({
  page,
}) => {
  await openLogText(page, 'wide.csv', wideLog(20))
  await page.getByRole('button', { name: 'Select all' }).click()
  const area = page.locator('.u-over').first()
  await area.hover()

  const readout = page.getByRole('list', { name: 'Legend' })
  await expect(readout.locator('.value').first()).not.toBeEmpty()
  const plot = (await area.boundingBox())!
  const list = (await readout.boundingBox())!
  expect(list.y).toBeGreaterThanOrEqual(plot.y + plot.height)
  expect(await readout.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
})
