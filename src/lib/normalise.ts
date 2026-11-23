// The overlay mode: each series as 0 to 100% of its own range, on one axis.
import { windowRows } from './panelRanges.ts'
import type { TimeWindow } from './timeWindow.ts'
import type { NormaliseMode } from './view.ts'
import { autoRange, extent } from './yRange.ts'
import type { Range } from './yRange.ts'

export const PERCENT_AXIS = { key: 'percent', title: '% of range' }

/** The range of the percent axis, with the padding every automatic range has. */
export const PERCENT_RANGE: Range = autoRange([[0, 100]])

/** The min and max that become 0 and 100%, per series. */
export function normalisationSpans(
  time: Float64Array,
  columns: readonly Float64Array[],
  mode: NormaliseMode,
  window: TimeWindow,
): Range[] {
  const [from, to] = mode === 'window' ? windowRows(time, window) : [0, time.length]
  return columns.map((values) => extent(values, from, to) ?? [0, 0])
}

export function toPercent(values: ArrayLike<number | null>, [min, max]: Range): (number | null)[] {
  const span = max - min
  return Array.from(values, (value) => {
    if (value === null) return null
    if (!span) return 50
    // The sample held into the window can lie outside its span.
    return Math.min(100, Math.max(0, ((value - min) / span) * 100))
  })
}
