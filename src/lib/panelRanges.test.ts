import { describe, expect, it } from 'vitest'
import { panelRanges } from './panelRanges.ts'

const time = Float64Array.from({ length: 101 }, (_, i) => i)
const rising = Float64Array.from({ length: 101 }, (_, i) => i)
const series = [{ values: rising, axis: 0 }]

describe('panelRanges', () => {
  it('fits all data, with about 5% padding', () => {
    const [range] = panelRanges(time, series, 1, 'all', { min: 40, max: 60 })

    expect(range![0]).toBeCloseTo(-5)
    expect(range![1]).toBeCloseTo(105)
  })

  it('fits the visible window, with about 5% padding', () => {
    const [range] = panelRanges(time, series, 1, 'visible', { min: 40, max: 60 })

    // 39 is the value that is held into the window.
    expect(range![0]).toBeCloseTo(39 - 1.05)
    expect(range![1]).toBeCloseTo(60 + 1.05)
  })

  it('still has a value to fit between two samples', () => {
    const [range] = panelRanges(time, series, 1, 'visible', { min: 50.2, max: 50.7 })

    expect(range![0]).toBeLessThan(50)
    expect(range![1]).toBeGreaterThan(50)
  })
})
