// The selected columns over the visible window, as a CSV in the BimmerLink format: Time with
// three decimals, then the quoted labels; comma separated, LF line endings.
import { indexAfter, indexAtOrAfter } from './search.ts'
import type { TimeWindow } from './timeWindow.ts'

const ROWS_PER_CHUNK = 5000

interface ExportColumn {
  name: string
  values: Float64Array
}

const quote = (label: string) => `"${label.replaceAll('"', '""')}"`
const cell = (value: number) => (Number.isNaN(value) ? '' : String(value))
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** The file in parts; it yields to the page between chunks, so a large export never freezes it. */
export async function exportCsv(
  time: Float64Array,
  columns: readonly ExportColumn[],
  window: TimeWindow,
): Promise<string[]> {
  const parts = [`${['Time', ...columns.map((column) => quote(column.name))].join(',')}\n`]
  const to = indexAfter(time, window.max)
  for (let start = indexAtOrAfter(time, window.min); start < to; start += ROWS_PER_CHUNK) {
    const lines: string[] = []
    for (let row = start; row < Math.min(to, start + ROWS_PER_CHUNK); row++) {
      let line = time[row]!.toFixed(3)
      for (const { values } of columns) line += `,${cell(values[row]!)}`
      lines.push(line)
    }
    parts.push(`${lines.join('\n')}\n`)
    await nextTask()
  }
  return parts
}
