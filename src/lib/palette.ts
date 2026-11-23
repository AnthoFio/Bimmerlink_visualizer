import { hash } from './hash.ts'

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

/**
 * Gives a palette slot to each id that has none yet, and keeps the slots that exist: a series
 * never changes colour while it is shown. A new id prefers the slot of its hash, then the least
 * used one among the ids that are shown. Ids are taken in sorted order, so the same selection
 * gets the same colours on every load.
 */
export function extendSlots(
  slots: ReadonlyMap<string, number>,
  shown: readonly string[],
  count = 8,
): Map<string, number> {
  // Only shown series hold a slot: a kept slot of a hidden one could be given away and collide.
  const next = new Map([...slots].filter(([id]) => shown.includes(id)))
  const used = new Array<number>(count).fill(0)
  for (const id of shown) {
    const slot = next.get(id)
    if (slot !== undefined) used[slot]!++
  }
  for (const id of [...new Set(shown)].sort()) {
    if (next.has(id)) continue
    const preferred = hash(id) % count
    let best = preferred
    for (let step = 1; step < count; step++) {
      const slot = (preferred + step) % count
      if (used[slot]! < used[best]!) best = slot
    }
    used[best]!++
    next.set(id, best)
  }
  return next
}

/** The slot a channel would take on its own, for the swatch of a channel that is not shown. */
export function preferredSlot(id: string, count = 8): number {
  return hash(id) % count
}

/** A colour faded back, for the series that are not highlighted. */
export function dimmed(hex: string): string {
  const value = Number.parseInt(hex.slice(1, 7), 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, 0.22)`
}
