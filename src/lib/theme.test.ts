import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHART_COLOURS } from './palette.ts'
import { contrastRatio, THEME_KEY, themeInitScript } from './theme.ts'

const run = (stored: string | null, prefersDark: boolean) => {
  if (stored === null) localStorage.removeItem(THEME_KEY)
  else localStorage.setItem(THEME_KEY, stored)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefersDark && query.includes('dark'),
  }))
  new Function(themeInitScript)()
  return document.documentElement.dataset.theme
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

describe('theme before the first paint', () => {
  it('follows prefers-color-scheme by default', () => {
    expect(run(null, true)).toBe('dark')
    expect(run(null, false)).toBe('light')
    expect(run('system', true)).toBe('dark')
  })

  it('uses the stored choice', () => {
    expect(run('light', true)).toBe('light')
    expect(run('dark', false)).toBe('dark')
  })

  it('survives junk and blocked storage', () => {
    expect(run('purple', true)).toBe('dark')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(run(null, false)).toBe('light')
  })
})

describe('chart palettes', () => {
  it.each(['light', 'dark'] as const)('have sufficient contrast in the %s theme', (theme) => {
    const { surface, ink, series } = CHART_COLOURS[theme]

    expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(4.5)
    for (const colour of series) expect(contrastRatio(colour, surface)).toBeGreaterThanOrEqual(3)
  })

  it('measures contrast like WCAG', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })
})
