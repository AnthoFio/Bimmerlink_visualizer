import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { openLog } from './support.ts'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function violations(page: Page) {
  const { violations: found } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  return found.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(' | ')}`)
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('the landing page passes axe', async ({ page }) => {
      await page.goto('./')
      expect(await violations(page)).toEqual([])
    })

    test('the loaded log passes axe, with menus and tables open', async ({ page }) => {
      await openLog(page)
      await page.getByRole('button', { name: 'Add panel' }).click()
      await page
        .getByRole('button', { name: /^Options for / })
        .first()
        .click()
      await page.getByRole('button', { name: 'Axes of panel 1' }).click()
      await page.getByRole('button', { name: 'Select visible range' }).click()
      await page.getByText('Data table').click()
      await page.locator('.u-over').first().hover()
      expect(await violations(page)).toEqual([])
    })

    test('the narrow layout passes axe, with the drawer closed and open', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await openLog(page)
      expect(await violations(page)).toEqual([])
      await page.getByRole('button', { name: 'Parameters' }).click()
      await expect(page.getByRole('complementary', { name: 'Parameters' })).toBeVisible()
      expect(await violations(page)).toEqual([])
    })
  })
}

test('every control can be reached with Tab and shows where the focus is', async ({ page }) => {
  await openLog(page)
  const seen = new Set<string>()
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null
      if (!element || element === document.body) return null
      const style = getComputedStyle(element)
      const name = element.getAttribute('aria-label') ?? element.textContent?.trim() ?? ''
      return {
        name: `${element.tagName}:${name.slice(0, 40)}`,
        visible: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
      }
    })
    if (!focus) continue
    expect(focus.visible, focus.name).toBe(true)
    seen.add(focus.name)
  }
  for (const control of ['Open another file', 'Export PNG', 'Apply window', 'Add panel']) {
    expect(
      [...seen].some((name) => name.includes(control)),
      control,
    ).toBe(true)
  }
  expect([...seen].some((name) => name.startsWith('DIV:Time-series chart'))).toBe(true)
})
