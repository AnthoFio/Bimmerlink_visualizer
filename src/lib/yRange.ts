export type Range = readonly [min: number, max: number]

const PADDING = 0.05

/** Min and max of the values from `from` up to `to`, skipping gaps. */
export function extent(values: Float64Array, from = 0, to = values.length): Range | undefined {
  let min = Infinity
  let max = -Infinity
  for (let i = from; i < to; i++) {
    const value = values[i]!
    if (value < min) min = value
    if (value > max) max = value
  }
  return min <= max ? [min, max] : undefined
}

/** The automatic range of an axis: the extents of its series plus about 5% on both sides. */
export function autoRange(extents: readonly (Range | undefined)[]): Range {
  let min = Infinity
  let max = -Infinity
  for (const range of extents) {
    if (!range) continue
    min = Math.min(min, range[0])
    max = Math.max(max, range[1])
  }
  if (min > max) return [0, 1]
  if (min === max) {
    const around = Math.abs(min) * PADDING || 1
    return [min - around, max + around]
  }
  const pad = (max - min) * PADDING
  return [min - pad, max + pad]
}
