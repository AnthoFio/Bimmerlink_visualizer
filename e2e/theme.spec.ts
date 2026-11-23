import { expect, test } from '@playwright/test'
import { openLog } from './support.ts'

const background = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.describe('dark system theme', () => {
  test.use({ colorScheme: 'dark' })

  test('is dark from the first paint', async ({ page }) => {
    // Record the theme as soon as the document exists, before any app code ran.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        ;(window as unknown as { first: string }).first =
          document.documentElement.dataset.theme ?? 'none'
      })
    })
    await page.goto('./')
    expect(await page.evaluate(() => (window as unknown as { first: string }).first)).toBe('dark')
    expect(await background(page)).toBe('rgb(15, 17, 19)')
  })
})

test('the manual choice wins and is remembered', async ({ page }) => {
  await openLog(page)
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark')
  expect(await background(page)).toBe('rgb(15, 17, 19)')

  await page.reload()
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
})
