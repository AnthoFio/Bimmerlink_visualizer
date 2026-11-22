// The staggered start of a BimmerLink log, see docs/ramp-up.md.
//
// This looks at the text, not at the numbers: a channel without a sample yet is written as
// a bare `0`, while a sampled zero is written `0.00`, and both parse to the same number.
import type { LogDataset } from './parseLog.ts'

export interface RampUp {
  /** Per channel, the number of leading placeholder rows. */
  channelRows: number[]
  /** Rows before the first one in which every channel has reported. */
  rows: number
}

export const NO_RAMP_UP: RampUp = { channelRows: [], rows: 0 }

const PLACEHOLDER = '0'

/**
 * One channel reports per row, so a ramp-up lasts about as many rows as there are channels.
 * A channel still at `0` after two such rounds really is zero.
 */
const searchWindow = (channels: number) => channels * 2 + 2

function* dataRows(text: string): Generator<string[]> {
  const lineBreak = text.includes('\n') ? '\n' : '\r'
  let header = true
  let start = 0
  while (start < text.length) {
    let end = text.indexOf(lineBreak, start)
    if (end === -1) end = text.length
    const line = text.slice(start, end).trim()
    start = end + 1
    if (line === '') continue
    if (header) header = false
    else yield line.split(',')
  }
}

export function detectRampUp(text: string, channels: number): RampUp {
  const reportedAt = new Array<number | undefined>(channels).fill(undefined)
  const limit = searchWindow(channels)
  let row = 0
  let waiting = channels
  for (const cells of dataRows(text)) {
    for (let channel = 0; channel < channels; channel++) {
      if (reportedAt[channel] !== undefined) continue
      const cell = cells[channel + 1]?.trim() ?? ''
      if (cell === PLACEHOLDER || cell === '') continue
      reportedAt[channel] = row
      waiting--
    }
    row++
    if (waiting === 0 || row >= limit) break
  }
  const channelRows = reportedAt.map((value) => value ?? 0)
  return { channelRows, rows: channelRows.reduce((most, value) => Math.max(most, value), 0) }
}

/** A view of the log without its first `rows` rows; the arrays share the log's memory. */
export function trimLeadingRows(dataset: LogDataset, rows: number): LogDataset {
  if (rows <= 0 || rows >= dataset.time.length) return dataset
  return {
    time: dataset.time.subarray(rows),
    columns: dataset.columns.map(({ name, values }) => ({ name, values: values.subarray(rows) })),
  }
}
