import { describe, expect, it } from 'vitest'
import { assignSlots, CHART_COLOURS, dimmed } from './palette.ts'

const ids = ['engine speed', 'oil temperature', 'boost pressure', 'lambda actual value']

describe('assignSlots', () => {
  it('gives distinct slots while there are enough', () => {
    const slots = assignSlots(ids)

    expect(new Set(slots.values()).size).toBe(ids.length)
    const eight = assignSlots(Array.from({ length: 8 }, (_, i) => `channel ${i}`))
    expect(new Set(eight.values()).size).toBe(8)
  })

  it('is stable: the same parameters get the same colours, whatever the order', () => {
    const forwards = assignSlots(ids)
    const backwards = assignSlots([...ids].reverse())

    for (const id of ids) expect(backwards.get(id)).toBe(forwards.get(id))
  })

  it('spreads more than eight channels evenly', () => {
    const slots = [...assignSlots(Array.from({ length: 13 }, (_, i) => `channel ${i}`)).values()]
    const uses = slots.reduce(
      (count, slot) => count.set(slot, (count.get(slot) ?? 0) + 1),
      new Map(),
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
