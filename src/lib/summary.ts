import type { LogDataset } from './parseLog.ts'

export interface LogSummary {
  rows: number
  channels: number
  /** Seconds from the first row to the last. */
  duration: number
  /** Median seconds between rows; undefined with fewer than two rows. */
  interval: number | undefined
}

export function summarise({ time, columns }: LogDataset): LogSummary {
  const rows = time.length
  const steps = new Float64Array(Math.max(0, rows - 1))
  for (let i = 0; i < steps.length; i++) steps[i] = time[i + 1]! - time[i]!
  steps.sort()
  const middle = steps.length >> 1
  const interval =
    steps.length === 0
      ? undefined
      : steps.length % 2
        ? steps[middle]
        : (steps[middle - 1]! + steps[middle]!) / 2

  return {
    rows,
    channels: columns.length,
    duration: rows ? time[rows - 1]! - time[0]! : 0,
    interval,
  }
}
