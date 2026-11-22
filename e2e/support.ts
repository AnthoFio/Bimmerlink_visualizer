import { readdirSync } from 'node:fs'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const BIGGEST_LOG = '2026-10-25_09-33-22.csv'
export const allExampleLogs = readdirSync('Example').filter((name) => name.endsWith('.csv'))

export async function openLog(page: Page, name = BIGGEST_LOG) {
  await page.goto('./')
  await page.getByLabel('BimmerLink CSV file').setInputFiles(`Example/${name}`)
  await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible()
}

/**
 * How many pixels of the first chart canvas are coloured. Axes, grid and background are grey,
 * so a high count means that series lines were drawn.
 */
export function colouredPixels(page: Page): Promise<number> {
  return page
    .locator('.chart-host canvas')
    .first()
    .evaluate((element) => {
      const canvas = element as HTMLCanvasElement
      const { width, height } = canvas
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, width, height).data
      let count = 0
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b, alpha] = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!, pixels[i + 3]!]
        if (alpha > 100 && Math.max(r, g, b) - Math.min(r, g, b) > 50) count++
      }
      return count
    })
}
