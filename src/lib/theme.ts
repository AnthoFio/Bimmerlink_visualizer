// The light and dark theme. The choice lives in localStorage; "system" follows
// prefers-color-scheme. The script below runs in the head before the first paint, so the
// page never flashes the wrong theme. vite.config.ts inlines it and allows it by its hash.

export const THEME_KEY = 'blv:theme'
export const THEME_CHOICES = ['system', 'light', 'dark'] as const
export type ThemeChoice = (typeof THEME_CHOICES)[number]

export const themeInitScript = `(function () {
  var choice = null
  try { choice = localStorage.getItem('${THEME_KEY}') } catch (error) {}
  var dark = choice === 'dark' || (choice !== 'light' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()`

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1, 7), 16)
  const channel = (shift: number) => {
    const c = ((value >> shift) & 255) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
}

/** WCAG 2 contrast ratio of two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}
