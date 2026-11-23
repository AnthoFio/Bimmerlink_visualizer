// Binary searches on a non-decreasing time column.

/** The first index whose time is at or after `value`. */
export function indexAtOrAfter(time: Float64Array, value: number): number {
  let low = 0
  let high = time.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (time[middle]! < value) low = middle + 1
    else high = middle
  }
  return low
}

/** The first index whose time is after `value`. */
export function indexAfter(time: Float64Array, value: number): number {
  let low = 0
  let high = time.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (time[middle]! <= value) low = middle + 1
    else high = middle
  }
  return low
}

/** The index of the sample nearest to `value`. */
export function nearestIndex(time: Float64Array, value: number): number {
  const after = indexAtOrAfter(time, value)
  if (after === 0) return 0
  if (after === time.length) return time.length - 1
  return value - time[after - 1]! <= time[after]! - value ? after - 1 : after
}
