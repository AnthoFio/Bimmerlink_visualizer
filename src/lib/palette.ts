// Chart colours for both themes. The series palettes are eight hues in a fixed order, tuned so
// that neighbours stay apart for protan and deutan vision and every slot has at least 3:1
// contrast against the chart surface of its theme.

export type Theme = 'light' | 'dark'

export interface ChartColours {
  surface: string
  ink: string
  grid: string
  series: readonly string[]
}

export const CHART_COLOURS: Record<Theme, ChartColours> = {
  light: {
    surface: '#ffffff',
    ink: '#4d535b',
    grid: '#e7e9ec',
    series: [
      '#1f6fd0',
      '#c9501c',
      '#00856f',
      '#b88000',
      '#c2447c',
      '#006b00',
      '#5a45cc',
      '#cc3535',
    ],
  },
  dark: {
    surface: '#17191c',
    ink: '#aeb5bd',
    grid: '#2a2e33',
    series: [
      '#3987e5',
      '#d95926',
      '#199e70',
      '#c98500',
      '#d55181',
      '#0ca30c',
      '#9085e9',
      '#e66767',
    ],
  },
}

export function slotColour(slot: number, theme: Theme): string {
  const { series } = CHART_COLOURS[theme]
  return series[slot % series.length]!
}

/** FNV-1a: a small, stable hash, the same in every browser. */
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

/**
 * A palette slot per channel id. Each id prefers the slot of its hash and takes the least used
 * slot from there, in sorted order: the same channels always get the same colours, whatever
 * order the log has them in, and no slot is used twice before all are used once.
 */
export function assignSlots(ids: readonly string[], slots = 8): Map<string, number> {
  const used = new Array<number>(slots).fill(0)
  const assigned = new Map<string, number>()
  for (const id of [...new Set(ids)].sort()) {
    const preferred = hash(id) % slots
    let best = preferred
    for (let step = 1; step < slots; step++) {
      const slot = (preferred + step) % slots
      if (used[slot]! < used[best]!) best = slot
    }
    used[best]!++
    assigned.set(id, best)
  }
  return assigned
}

/** A colour faded back, for the series that are not highlighted. */
export function dimmed(hex: string): string {
  const value = Number.parseInt(hex.slice(1, 7), 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, 0.22)`
}
