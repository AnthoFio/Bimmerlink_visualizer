import { describe, expect, it } from 'vitest'
import { CHART_COLOURS, dimmed, extendSlots } from './palette.ts'

const ids = ['engine speed', 'oil temperature', 'boost pressure', 'lambda actual value']
const eleven = Array.from({ length: 11 }, (_, i) => `channel ${i}`)

describe('extendSlots', () => {
  it('gives the shown series distinct slots while there are enough', () => {
    expect(new Set(extendSlots(new Map(), ids).values()).size).toBe(ids.length)
    const eight = extendSlots(new Map(), eleven.slice(0, 8))
    expect(new Set(eight.values()).size).toBe(8)
  })

  it('is stable: the same selection gets the same colours, whatever the order', () => {
    const forwards = extendSlots(new Map(), ids)
    const backwards = extendSlots(new Map(), [...ids].reverse())

    for (const id of ids) expect(backwards.get(id)).toBe(forwards.get(id))
  })

  it('never repaints a series that stays shown', () => {
    const first = extendSlots(new Map(), eleven.slice(0, 6))
    const later = extendSlots(first, [...eleven.slice(0, 3), ...eleven.slice(6, 11)])

    for (const id of eleven.slice(0, 3)) expect(later.get(id)).toBe(first.get(id))
    // The three that stay and the five that join share the eight slots.
    const shown = [...eleven.slice(0, 3), ...eleven.slice(6, 11)].map((id) => later.get(id))
    expect(new Set(shown).size).toBe(8)
  })

  it('gives no two shown series one slot after a series is hidden and shown again', () => {
    // Both prefer slot 4 by their hash.
    const shown = extendSlots(new Map(), ['engine speed'])
    const swapped = extendSlots(shown, ['ignition timing'])
    const both = extendSlots(swapped, ['engine speed', 'ignition timing'])

    expect(both.get('engine speed')).not.toBe(both.get('ignition timing'))
  })

  it('spreads more than eight shown series evenly', () => {
    const slots = [...extendSlots(new Map(), eleven.concat('a', 'b')).values()]
    const uses = slots.reduce(
      (count, slot) => count.set(slot, (count.get(slot) ?? 0) + 1),
      new Map<number, number>(),
    )

    expect(Math.max(...uses.values())).toBe(2)
  })
})

describe('palettes', () => {
  it('have eight colours for each theme', () => {
    expect(CHART_COLOURS.light.series).toHaveLength(8)
    expect(CHART_COLOURS.dark.series).toHaveLength(8)
  })

  it('dim a colour', () => {
    expect(dimmed('#1f6fd0')).toBe('rgba(31, 111, 208, 0.22)')
  })
})
