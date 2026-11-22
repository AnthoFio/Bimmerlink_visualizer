export interface TimeWindow {
  readonly min: number
  readonly max: number
}

/** Seconds; about three samples. */
export const MIN_SPAN = 0.1

export function logExtent(time: Float64Array): TimeWindow {
  const min = time[0] ?? 0
  return { min, max: Math.max(time[time.length - 1] ?? 0, min + MIN_SPAN) }
}

/** The same span, moved inside the log, and no wider than it. */
export function clampWindow(window: TimeWindow, extent: TimeWindow): TimeWindow {
  const full = extent.max - extent.min
  const span = Math.max(Math.min(MIN_SPAN, full), window.max - window.min)
  if (span >= full) return extent
  if (window.min < extent.min) return { min: extent.min, max: extent.min + span }
  if (window.min + span > extent.max) return { min: extent.max - span, max: extent.max }
  return { min: window.min, max: window.min + span }
}

/** The stored window in use: `null` is the full log. */
export function resolveWindow(window: TimeWindow | null, extent: TimeWindow): TimeWindow {
  return window ? clampWindow(window, extent) : extent
}

/** Scales the span by `factor`; the time `at` keeps its place on screen. */
export function zoomAround(
  window: TimeWindow,
  at: number,
  factor: number,
  extent: TimeWindow,
): TimeWindow {
  const span = window.max - window.min
  const next = Math.max(MIN_SPAN, span * factor)
  const min = at - ((at - window.min) * next) / span
  return clampWindow({ min, max: min + next }, extent)
}

export function panBy(window: TimeWindow, seconds: number, extent: TimeWindow): TimeWindow {
  return clampWindow({ min: window.min + seconds, max: window.max + seconds }, extent)
}
