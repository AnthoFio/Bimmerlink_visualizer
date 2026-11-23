import { expect, test } from '@playwright/test'
import { openLog } from './support.ts'

test('dragging an axis zooms that axis', async ({ page }) => {
  await openLog(page)
  await page.getByText('Axes of panel 1').click()
  const min = page.getByRole('textbox', { name: 'Min of count in panel 1' })
  const before = await min.inputValue()

  const strip = page.locator('.axis-drag:visible').first()
  const plot = (await page.locator('.u-over').first().boundingBox())!
  const box = (await strip.boundingBox())!
  // The strip of the first axis sits right at the left edge of the plot.
  expect(Math.abs(box.x + box.width - plot.x)).toBeLessThan(2)

  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 80, { steps: 5 })
  await page.mouse.up()

  await expect(min).not.toHaveValue(before)
  await expect(
    page.getByRole('checkbox', { name: 'Auto range of count in panel 1' }),
  ).not.toBeChecked()
})
