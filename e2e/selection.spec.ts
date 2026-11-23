import { expect, test } from '@playwright/test'
import { colouredPixels, openLog } from './support.ts'

test('the keyboard toggles a parameter and the chart follows at once', async ({ page }) => {
  await openLog(page)
  const list = page.getByRole('complementary', { name: 'Parameters' })

  await list.getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByText(/select one or more parameters/i)).toBeVisible()
  await expect.poll(() => colouredPixels(page)).toBe(0)

  const rows = list.getByRole('checkbox')
  await rows.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(1)).toBeFocused()

  const speed = list.getByRole('checkbox', { name: /Engine Speed/ })
  await speed.focus()
  await page.keyboard.press('Space')
  await expect(speed).toBeChecked()
  await expect.poll(() => colouredPixels(page)).toBeGreaterThan(500)
})
