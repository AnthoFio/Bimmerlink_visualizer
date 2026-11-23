/** A bad cell is `NaN` in the dataset; the chart engine wants `null` to leave a gap. */
export function withGaps(values: Float64Array): Float64Array | (number | null)[] {
  for (let i = 0; i < values.length; i++) {
    if (Number.isNaN(values[i])) {
      return Array.from(values, (value) => (Number.isNaN(value) ? null : value))
    }
  }
  return values
}
