import { useRef } from 'react'
import type { ReactNode } from 'react'
import { CSV_ACCEPT } from '../../lib/fileType.ts'
import { formatCount, formatDuration, formatInterval } from '../../lib/format.ts'
import type { LogSummary } from '../../lib/summary.ts'

interface Props {
  fileName: string
  summary: LogSummary
  /** Columns without a catalog entry. */
  unmatched: number
  onFiles: (files: File[]) => void
  /** Further facts and actions. */
  children?: ReactNode
}

export function FileHeader({ fileName, summary, unmatched, onFiles, children }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const facts = [
    ['Duration', formatDuration(summary.duration)],
    ['Rows', formatCount(summary.rows)],
    ['Median sample', formatInterval(summary.interval)],
    ['Channels', formatCount(summary.channels)],
    ['Not in catalog', formatCount(unmatched)],
  ]

  return (
    <header className="file-header">
      <div className="file-title">
        <h1>BimmerLink Log Visualizer</h1>
        <h2>{fileName}</h2>
      </div>
      <dl className="facts">
        {facts.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="header-actions">
        {children}
        <button type="button" onClick={() => input.current?.click()}>
          Open another file
        </button>
        <input
          ref={input}
          hidden
          type="file"
          accept={CSV_ACCEPT}
          aria-label="BimmerLink CSV file"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            if (files.length) onFiles(files)
          }}
        />
      </div>
    </header>
  )
}
