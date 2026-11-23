import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { BIGGEST_LOG, openLog } from './support.ts'

test('exports the charts as a 2x PNG and as SVG', async ({ page }) => {
  await openLog(page)
  await page.getByRole('button', { name: 'Add panel' }).click()

  const [png] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export PNG' }).click(),
  ])
  expect(png.suggestedFilename()).toBe(BIGGEST_LOG.replace('.csv', '.png'))
  const bytes = readFileSync((await png.path())!)
  // Width and height sit in the IHDR chunk of a PNG.
  const width = bytes.readUInt32BE(16)

  const [svg] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export SVG' }).click(),
  ])
  const text = readFileSync((await svg.path())!, 'utf8')
  const svgWidth = Number(/width="(\d+)"/.exec(text)![1])
  expect(width).toBe(svgWidth * 2)
  expect(text.match(/<g class="panel"/g)).toHaveLength(2)
  expect(text).toContain('recorded 2026-10-25 09:33:22')
})
