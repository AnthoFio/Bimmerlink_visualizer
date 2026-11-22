/** `1 cell`, `1,204 cells`. */
export function plural(count: number, one: string, many: string): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`
}

export function formatCount(count: number): string {
  return count.toLocaleString('en-US')
}

/** mm:ss; the minutes keep counting past an hour. */
export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

export function formatInterval(seconds: number | undefined): string {
  if (!seconds) return 'unknown'
  const ms = Math.round(seconds * 10_000) / 10
  return `${ms} ms (${(1000 / ms).toFixed(1)} Hz)`
}
