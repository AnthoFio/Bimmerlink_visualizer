// Min/max downsampling of the visible window (ADR 0001): a peak of one sample, such as a knock
// event or a misfire, survives any zoom level.
//
// All series share one x. A bucket is a slice of time about one pixel wide, anchored at time 0
// so that peaks do not flicker while panning; it gives the x of its first and last sample, and
// per series the minimum and maximum in the order in which they occurred.
import { withGaps } from './gaps.ts'
import { indexAfter, indexAtOrAfter } from './search.ts'
import type { TimeWindow } from './timeWindow.ts'

type Y = Float64Array | (number | null)[]

export interface Sampled {
  x: Float64Array
  ys: Y[]
}

export function downsample(
  time: Float64Array,
  columns: readonly Float64Array[],
  window: TimeWindow,
  buckets: number,
): Sampled {
  // One sample beyond each edge, so that lines reach the edges.
  const from = Math.max(0, indexAtOrAfter(time, window.min) - 1)
  const to = Math.min(time.length, indexAfter(time, window.max) + 1)
  if (to - from <= buckets * 2) {
    return {
      x: time.subarray(from, to),
      ys: columns.map((values) => withGaps(values.subarray(from, to))),
    }
  }

  const size = (window.max - window.min) / buckets
  const starts: number[] = []
  const xs: number[] = []
  let current = NaN
  for (let i = from; i < to; i++) {
    const bucket = Math.floor(time[i]! / size)
    if (bucket === current) continue
    if (starts.length && i - 1 > starts[starts.length - 1]!) xs.push(time[i - 1]!)
    current = bucket
    starts.push(i)
    xs.push(time[i]!)
  }
  if (to - 1 > starts[starts.length - 1]!) xs.push(time[to - 1]!)
  starts.push(to)

  const ys = columns.map((values) => {
    const out = new Float64Array(xs.length)
    let at = 0
    for (let b = 0; b < starts.length - 1; b++) {
      const start = starts[b]!
      const end = starts[b + 1]!
      if (end - start === 1) {
        out[at++] = values[start]!
        continue
      }
      let low = Infinity
      let high = -Infinity
      let lowAt = start
      let highAt = start
      for (let i = start; i < end; i++) {
        const value = values[i]!
        if (value < low) {
          low = value
          lowAt = i
        }
        if (value > high) {
          high = value
          highAt = i
        }
      }
      if (low > high) {
        // Nothing but gaps.
        out[at++] = NaN
        out[at++] = NaN
      } else {
        out[at++] = lowAt <= highAt ? low : high
        out[at++] = lowAt <= highAt ? high : low
      }
    }
    return withGaps(out)
  })

  return { x: Float64Array.from(xs), ys }
}
