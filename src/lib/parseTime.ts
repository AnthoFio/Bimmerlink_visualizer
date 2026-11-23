const SECONDS = /^(\d+(?:\.\d+)?)(?:\s*s)?$/
const MINUTES_SECONDS = /^(\d+):([0-5]?\d(?:\.\d+)?)$/

/** Seconds from `612.5`, `612.5 s` or `10:12.5`; undefined for anything else. */
export function parseTime(text: string): number | undefined {
  const value = text.trim()
  const minutes = MINUTES_SECONDS.exec(value)
  if (minutes) return Number(minutes[1]) * 60 + Number(minutes[2])
  const seconds = SECONDS.exec(value)
  return seconds ? Number(seconds[1]) : undefined
}
