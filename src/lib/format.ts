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

const MINUTES_FROM_SECONDS = 120

/** A tick of the time axis: seconds, or mm:ss in a log longer than 120 s. */
export function formatAxisTime(seconds: number, duration: number, increment: number): string {
  const decimals = increment >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(increment) - 1e-9))
  if (duration <= MINUTES_FROM_SECONDS) return `${seconds.toFixed(decimals)} s`
  const scale = 10 ** decimals
  const rounded = Math.round(seconds * scale) / scale
  const minutes = Math.floor(rounded / 60)
  const rest = (rounded - minutes * 60).toFixed(decimals)
  return `${String(minutes).padStart(2, '0')}:${rest.padStart(decimals ? 3 + decimals : 2, '0')}`
}
