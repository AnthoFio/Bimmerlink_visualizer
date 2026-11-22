import { expect, test } from '@playwright/test'
import { allExampleLogs, colouredPixels, openLog } from './support.ts'

test.describe('smoke', () => {
  for (const name of allExampleLogs) {
    test(`uploads ${name} and draws a chart`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })

      await openLog(page, name)

      await expect(page.locator('.chart-host canvas').first()).toBeVisible()
      await expect.poll(() => colouredPixels(page)).toBeGreaterThan(500)
      expect(errors).toEqual([])
    })
  }
})
