import { indexAfter, indexAtOrAfter } from './search.ts'
import type { TimeWindow } from './timeWindow.ts'

export interface RangeStats {
  /** Valid samples in the range; without any, the other figures are absent. */
  count: number
  min?: number
  max?: number
  /** Over the samples, not weighted by time. */
  mean?: number
  /** Last valid sample minus the first. */
  delta?: number
}

export function rangeStats(
  time: Float64Array,
  values: Float64Array,
  range: TimeWindow,
): RangeStats {
  const to = indexAfter(time, range.max)
  let count = 0
  let min = Infinity
  let max = -Infinity
  let sum = 0
  let first = NaN
  let last = NaN
  for (let i = indexAtOrAfter(time, range.min); i < to; i++) {
    const value = values[i]!
    if (Number.isNaN(value)) continue
    if (count === 0) first = value
    last = value
    count++
    sum += value
    if (value < min) min = value
    if (value > max) max = value
  }
  return count ? { count, min, max, mean: sum / count, delta: last - first } : { count }
}
