import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TimeSeriesChart } from './features/charts/TimeSeriesChart.tsx'
import { FileHeader } from './features/upload/FileHeader.tsx'
import { RampUpToggle } from './features/upload/RampUpToggle.tsx'
import type { LoadedLog } from './features/upload/useLogLoader.ts'
import { parameters } from './data/catalog.ts'
import { describeChannels } from './lib/channels.ts'
import { trimLeadingRows } from './lib/rampUp.ts'
import { summarise } from './lib/summary.ts'

/** Drawn on load, until the parameter list and its defaults decide. */
const INITIAL_SERIES = 6

interface Props {
  log: LoadedLog
  onFiles: (files: File[]) => void
  /** Whether replacing the log would lose changes to the view. */
  onUnsavedChange: (unsaved: boolean) => void
  /** Status of the app: loading, errors, questions. */
  children?: ReactNode
}

/** Everything that belongs to one loaded log. Mounted anew for every load. */
export function Workspace({ log, onFiles, onUnsavedChange, children }: Props) {
  const [trim, setTrim] = useState(true)
  const dataset = useMemo(
    () => (trim ? trimLeadingRows(log.dataset, log.rampUp.rows) : log.dataset),
    [log, trim],
  )
  const summary = useMemo(() => summarise(dataset), [dataset])
  const channels = useMemo(
    () =>
      describeChannels(
        log.dataset.columns.map((column) => column.name),
        parameters,
      ),
    [log],
  )
  const unmatched = channels.filter((channel) => !channel.matched).length
  const selected = useMemo(
    () => new Set(channels.slice(0, INITIAL_SERIES).map((channel) => channel.id)),
    [channels],
  )

  const unsaved = !trim
  useEffect(() => onUnsavedChange(unsaved), [onUnsavedChange, unsaved])

  return (
    <div
      className="workspace"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return
        event.preventDefault()
        onFiles(Array.from(event.dataTransfer.files))
      }}
    >
      <FileHeader
        fileName={log.fileName}
        summary={summary}
        unmatched={unmatched}
        onFiles={onFiles}
      />
      <main className="workspace-main">
        {children}
        {log.warnings.map((warning) => (
          <p key={warning.code} role="status" className="message message-warning">
            {warning.message}
          </p>
        ))}
        <RampUpToggle
          rows={log.dataset.time.length - dataset.time.length}
          seconds={dataset.time[0]! - log.dataset.time[0]!}
          checked={trim}
          onChange={setTrim}
        />
        <TimeSeriesChart dataset={dataset} channels={channels} selected={selected} />
      </main>
    </div>
  )
}
