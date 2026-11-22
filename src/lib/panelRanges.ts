import { indexAfter, indexAtOrAfter } from './search.ts'
import type { TimeWindow } from './timeWindow.ts'
import type { FitMode } from './view.ts'
import { autoRange, extent } from './yRange.ts'
import type { Range } from './yRange.ts'

interface RangedSeries {
  values: Float64Array
  axis: number
}

/** The rows of a window, with the sample that is held into it. */
export function windowRows(time: Float64Array, window: TimeWindow): [from: number, to: number] {
  return [Math.max(0, indexAtOrAfter(time, window.min) - 1), indexAfter(time, window.max)]
}

/** The automatic range of each axis of a panel. */
export function panelRanges(
  time: Float64Array,
  series: readonly RangedSeries[],
  axes: number,
  fit: FitMode,
  window: TimeWindow,
): Range[] {
  const [from, to] = fit === 'visible' ? windowRows(time, window) : [0, time.length]
  const extents = series.map((line) => extent(line.values, from, to))
  return Array.from({ length: axes }, (_, axis) =>
    autoRange(extents.filter((_, i) => series[i]!.axis === axis)),
  )
}
