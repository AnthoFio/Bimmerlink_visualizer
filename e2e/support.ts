import { readdirSync } from 'node:fs'
import { basename } from 'node:path'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { widenLog } from './wideLog.ts'

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

/** The biggest example log with `channels` columns. */
export const wideLog = (channels: number, labels?: readonly string[]) =>
  widenLog(BIGGEST_LOG, channels, labels)

export async function openLogText(page: Page, name: string, text: string) {
  await page.goto('./')
  await page
    .getByLabel('BimmerLink CSV file')
    .setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(text) })
  await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible({
    timeout: 30_000,
  })
}

/** Opens a log from disk: Playwright passes at most 50 MB from memory. */
export async function openLogFile(page: Page, path: string) {
  await page.goto('./')
  await page.getByLabel('BimmerLink CSV file').setInputFiles(path)
  await expect(
    page.getByRole('heading', { level: 2, name: basename(path), exact: true }),
  ).toBeVisible({ timeout: 30_000 })
}

/**
 * Zooms the first chart to `share` of the log, then pans it once per animation frame with
 * sideways wheel events, the way a trackpad does, and returns the frames per second.
 */
export function panFrameRate(page: Page, share: number): Promise<number> {
  return page
    .locator('.u-over')
    .first()
    .evaluate(async (area, share) => {
      const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))
      const box = area.getBoundingClientRect()
      const wheel = (deltaX: number, deltaY: number) =>
        area.dispatchEvent(
          new WheelEvent('wheel', {
            deltaX,
            deltaY,
            clientX: box.left,
            clientY: box.top + box.height / 2,
            cancelable: true,
          }),
        )

      // The wheel zooms by exp(delta * 0.0015) and takes at most 600 at a time.
      let left = Math.log(share) / 0.0015
      while (left < 0) {
        const step = Math.max(-600, left)
        wheel(0, step)
        left -= step
        await frame()
      }
      await frame()

      const FRAMES = 150
      // Cross what is outside the window once, within the run.
      const stepPx = Math.max(1, (box.width * (1 - share)) / share / FRAMES)
      const start = await frame()
      let end = start
      for (let i = 0; i < FRAMES; i++) {
        wheel(stepPx, 0)
        end = await frame()
      }
      return (FRAMES * 1000) / (end - start)
    }, share)
}
