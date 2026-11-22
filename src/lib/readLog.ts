// From the text of a file to a dataset that is safe to show: parse, then validate.
// A file that cannot be used throws a LogLoadError with a message meant for the user;
// anything that can be tolerated becomes a warning.
import { LogParseError, parseLogText } from './parseLog.ts'
import type { LogDataset } from './parseLog.ts'
import { plural } from './format.ts'

const ERROR_MESSAGES = {
  'not-csv':
    'This file does not look like a CSV log. Export the log from BimmerLink as a comma-separated CSV and open that file.',
  empty: 'The file is empty. Export the log from BimmerLink again and open the new file.',
  'header-only':
    'The log has a header but no data rows. The recording was probably stopped at once: record again.',
  'missing-time':
    'The first column must be the "Time" column that BimmerLink writes. Open the original export, without edited or moved columns.',
  'no-channels':
    'The log has a Time column but no parameter columns. Select parameters in BimmerLink and record again.',
  'no-numeric-data':
    'The log has no numeric data to plot. Open the original BimmerLink export, not an edited copy.',
}

export type LoadErrorCode = keyof typeof ERROR_MESSAGES

export class LogLoadError extends Error {
  readonly code: LoadErrorCode

  constructor(code: LoadErrorCode) {
    super(ERROR_MESSAGES[code])
    this.name = 'LogLoadError'
    this.code = code
  }
}

export function describeLoadFailure(error: unknown): string {
  return error instanceof LogLoadError
    ? error.message
    : 'The file could not be read. Try again, or choose another log.'
}

export interface LogWarning {
  code: 'duplicate-names' | 'bad-time' | 'time-order' | 'bad-cells'
  count: number
  message: string
}

export interface ReadResult {
  /** `time` is finite and never decreases. */
  dataset: LogDataset
  warnings: LogWarning[]
}

function looksLikeCsv(text: string): boolean {
  if (text.slice(0, 4096).includes('\0')) return false
  const first = text.trimStart().split(/\r|\n/, 1)[0]?.trim() ?? ''
  if (first === '') return true
  if (first.startsWith('<')) return false
  return first.includes(',') || first.replaceAll('"', '').toLowerCase() === 'time'
}

function duplicateNames(dataset: LogDataset): string[] {
  const seen = new Map<string, { name: string; count: number }>()
  for (const { name } of dataset.columns) {
    const key = name.toLowerCase()
    const entry = seen.get(key)
    if (entry) entry.count++
    else seen.set(key, { name, count: 1 })
  }
  return [...seen.values()].filter((entry) => entry.count > 1).map((entry) => entry.name)
}

function takeRows({ time, columns }: LogDataset, rows: readonly number[]): LogDataset {
  const take = (values: Float64Array) => Float64Array.from(rows, (row) => values[row]!)
  return {
    time: take(time),
    columns: columns.map(({ name, values }) => ({ name, values: take(values) })),
  }
}

/** Parses and validates the text of a log. */
export function readLog(text: string): ReadResult {
  if (!looksLikeCsv(text)) throw new LogLoadError('not-csv')

  let dataset: LogDataset
  try {
    dataset = parseLogText(text)
  } catch (error) {
    if (error instanceof LogParseError) throw new LogLoadError(error.code)
    throw error
  }
  if (dataset.columns.length === 0) throw new LogLoadError('no-channels')
  if (dataset.time.length === 0) throw new LogLoadError('header-only')

  const warnings: LogWarning[] = []

  const duplicates = duplicateNames(dataset)
  if (duplicates.length) {
    warnings.push({
      code: 'duplicate-names',
      count: duplicates.length,
      message: `Duplicate column names: ${duplicates.join(', ')}. Every copy is kept and numbered.`,
    })
  }

  const timedRows: number[] = []
  let backwards = 0
  let previous = -Infinity
  for (let row = 0; row < dataset.time.length; row++) {
    const time = dataset.time[row]!
    if (Number.isNaN(time)) continue
    if (time < previous) backwards++
    previous = time
    timedRows.push(row)
  }
  if (timedRows.length === 0) throw new LogLoadError('no-numeric-data')

  const untimed = dataset.time.length - timedRows.length
  if (untimed) {
    warnings.push({
      code: 'bad-time',
      count: untimed,
      message: `${plural(untimed, 'row has', 'rows have')} no valid time and ${untimed === 1 ? 'was' : 'were'} left out.`,
    })
  }
  if (backwards) {
    const { time } = dataset
    timedRows.sort((a, b) => time[a]! - time[b]!)
    warnings.push({
      code: 'time-order',
      count: backwards,
      message: `Time goes backwards ${plural(backwards, 'time', 'times')}. The rows were sorted by time.`,
    })
  }
  if (untimed || backwards) dataset = takeRows(dataset, timedRows)

  let bad = 0
  for (const { values } of dataset.columns) {
    for (let i = 0; i < values.length; i++) if (Number.isNaN(values[i])) bad++
  }
  if (bad === dataset.time.length * dataset.columns.length) {
    throw new LogLoadError('no-numeric-data')
  }
  if (bad) {
    warnings.push({
      code: 'bad-cells',
      count: bad,
      message: `${plural(bad, 'cell is', 'cells are')} blank or not a number, shown as gaps.`,
    })
  }

  return { dataset, warnings }
}
