/** An SVG path through the points; a null value starts a new run. */
export function linePath(
  x: Float64Array,
  y: ArrayLike<number | null>,
  toX: (time: number) => number,
  toY: (value: number) => number,
  stepped = false,
): string {
  // Two decimals are below a pixel and keep the path short.
  const round = (value: number) => Math.round(value * 100) / 100
  const parts: string[] = []
  let previous: number | undefined
  for (let i = 0; i < x.length; i++) {
    const value = y[i]
    if (value === null || value === undefined) {
      previous = undefined
      continue
    }
    const px = round(toX(x[i]!))
    const py = round(toY(value))
    if (previous === undefined) parts.push(`M${px},${py}`)
    else if (stepped) parts.push(`L${px},${previous}L${px},${py}`)
    else parts.push(`L${px},${py}`)
    previous = py
  }
  return parts.join('')
}
