// Parses a BimmerLink datalog (CSV) into a column-oriented dataset: one shared
// time axis plus one Float64Array per parameter column.
//
// Pure and worker-safe: no React, no DOM imports, plain values in and out
// (`Blob` is only used as a type and through `Blob.text()`, both available in workers).
//
// Why a purpose-built parser instead of PapaParse: the format is tiny and fixed
// (comma separated, `.` decimal point, optional BOM and CRLF, quoted header labels,
// numeric data), the output must be typed arrays rather than row objects, and a
// dependency would cost bundle size and an extra pass over 50k rows.
// This keeps the dependency list untouched; the 51k-row example log parses in about
// 0.2 s on a developer laptop (the budget is 1 s, measured by the performance story).
//
// Scope: structure only. Friendly messages, duplicate-name reporting, bad-cell
// counts and time monotonicity belong to the validation story; here a bad cell is
// `NaN`, duplicate names are kept as they are, and only a log that cannot be
// interpreted at all throws a `LogParseError`.
//
// Known limits, on purpose: the parser is line based, so a quoted cell cannot span
// lines (no BimmerLink label does), and a lone CR counts as a line break only when the
// file has no LF at all (classic Mac endings), not in a file that mixes both.

export interface LogColumn {
  /** Header label with the quotes removed, original casing kept. */
  name: string
  values: Float64Array
}

export interface LogDataset {
  /**
   * Seconds, taken from the `Time` column. Irregular sampling is kept as is.
   * Not validated here: a bad Time cell is `NaN`, and values may repeat or go backwards
   * (the validation story detects that), so consumers must not assume a finite,
   * increasing axis.
   */
  time: Float64Array
  /**
   * Every column after `Time`, in header order, exactly as the header lists them: an
   * empty label gives a column named `''`, a second `Time` column is a plain series, and a
   * header with only `Time` gives no columns. All arrays have `time.length` entries.
   */
  columns: LogColumn[]
}

export type LogParseErrorCode = 'empty' | 'missing-time'

export class LogParseError extends Error {
  readonly code: LogParseErrorCode

  constructor(code: LogParseErrorCode, message: string) {
    super(message)
    this.name = 'LogParseError'
    this.code = code
  }
}

const BOM = '\uFEFF'

// Plain decimal or exponent notation only: Number() would also accept 0x1A, 0b11, 0o7.
const NUMERIC = /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/

/** Splits one CSV line on commas, honouring double quotes and `""` escapes. */
function splitQuoted(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell)
  return cells
}

/** A cell as a number; anything that is not plain decimal notation (or overflows) is `NaN`. */
function toNumber(cell: string | undefined): number {
  if (cell === undefined || !NUMERIC.test(cell)) return NaN
  const value = Number(cell)
  return Number.isFinite(value) ? value : NaN
}

function countLines(text: string): number {
  let count = 1
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) count++
  return count
}

const PROGRESS_EVERY_ROWS = 4096

/**
 * Parses the text of a BimmerLink log. Throws `LogParseError` if there is no usable header.
 * `onProgress` gets the share of the text read so far (0 to 1) every few thousand rows.
 */
export function parseLogText(input: string, onProgress?: (share: number) => void): LogDataset {
  let text = input.startsWith(BOM) ? input.slice(BOM.length) : input
  if (!text.includes('\n') && text.includes('\r')) text = text.split('\r').join('\n')
  const capacity = countLines(text)

  let header: string[] | undefined
  let time = new Float64Array(0)
  let values: Float64Array[] = []
  let rows = 0

  let start = 0
  while (start <= text.length) {
    let end = text.indexOf('\n', start)
    if (end === -1) end = text.length
    const stop = end > start && text.charCodeAt(end - 1) === 13 ? end - 1 : end
    const line = text.slice(start, stop)
    start = end + 1
    if (line.trim() === '') continue

    const cells = line.includes('"') ? splitQuoted(line) : line.split(',')

    if (!header) {
      header = cells.map((cell) => cell.trim())
      if (header[0]?.toLowerCase() !== 'time') {
        throw new LogParseError(
          'missing-time',
          'The first column of the log must be "Time" (seconds).',
        )
      }
      time = new Float64Array(capacity)
      values = header.slice(1).map(() => new Float64Array(capacity))
      continue
    }

    time[rows] = toNumber(cells[0])
    for (let c = 0; c < values.length; c++) values[c]![rows] = toNumber(cells[c + 1])
    rows++
    if (onProgress && rows % PROGRESS_EVERY_ROWS === 0) onProgress(Math.min(1, start / text.length))
  }

  if (!header) throw new LogParseError('empty', 'The file is empty: no header row was found.')

  return {
    time: time.slice(0, rows),
    columns: header.slice(1).map((name, c) => ({ name, values: values[c]!.slice(0, rows) })),
  }
}

/** Parses a log given as text or as a `File`/`Blob` (decoded as UTF-8). */
export async function parseLog(input: string | Blob): Promise<LogDataset> {
  return parseLogText(typeof input === 'string' ? input : await input.text())
}
