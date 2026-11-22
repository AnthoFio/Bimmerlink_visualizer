import { describe, expect, it } from 'vitest'
import { rangeStats } from './stats.ts'

const time = Float64Array.of(0, 1, 2, 3, 4, 5)
const values = Float64Array.of(10, 4, NaN, 8, 6, 100)

describe('rangeStats', () => {
  it('gives min, max, mean, delta and sample count, ends included', () => {
    expect(rangeStats(time, values, { min: 1, max: 4 })).toEqual({
      min: 4,
      max: 8,
      mean: 6,
      delta: 2,
      count: 3,
    })
  })

  it('takes delta from the first valid sample to the last', () => {
    const gaps = Float64Array.of(NaN, 10, 3, 4, 7, NaN)

    expect(rangeStats(time, gaps, { min: 0, max: 5 }).delta).toBe(-3)
  })

  it('counts nothing between two samples and in gaps', () => {
    expect(rangeStats(time, values, { min: 1.2, max: 1.8 })).toEqual({ count: 0 })
    expect(rangeStats(time, values, { min: 2, max: 2 })).toEqual({ count: 0 })
  })
})
