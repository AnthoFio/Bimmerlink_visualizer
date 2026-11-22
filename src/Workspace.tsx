import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from './components/useTheme.ts'
import { parameters } from './data/catalog.ts'
import { TimeSeriesChart } from './features/charts/TimeSeriesChart.tsx'
import { ParameterList } from './features/selection/ParameterList.tsx'
import { FileHeader } from './features/upload/FileHeader.tsx'
import { RampUpToggle } from './features/upload/RampUpToggle.tsx'
import type { LoadedLog } from './features/upload/useLogLoader.ts'
import { describeChannels } from './lib/channels.ts'
import { slotColour } from './lib/palette.ts'
import { trimLeadingRows } from './lib/rampUp.ts'
import { summarise } from './lib/summary.ts'
import { defaultView, setSelected, viewsEqual } from './lib/view.ts'

/** Drawn on load, until the role-aware defaults decide. */
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
  const theme = useTheme()
  const channels = useMemo(
    () =>
      describeChannels(
        log.dataset.columns.map((column) => column.name),
        parameters,
      ),
    [log],
  )
  const [initial] = useState(() =>
    defaultView(channels.slice(0, INITIAL_SERIES).map((channel) => channel.id)),
  )
  const [view, setView] = useState(initial)

  const dataset = useMemo(
    () => (view.trim ? trimLeadingRows(log.dataset, log.rampUp.rows) : log.dataset),
    [log, view.trim],
  )
  const summary = useMemo(() => summarise(dataset), [dataset])
  const selected = useMemo(() => new Set(view.selected), [view.selected])
  const colours = useMemo(
    () => new Map(channels.map((channel) => [channel.id, slotColour(channel.column, theme)])),
    [channels, theme],
  )
  const unmatched = channels.filter((channel) => !channel.matched).length

  const select = useCallback(
    (ids: string[], on: boolean) => setView((current) => setSelected(current, ids, on)),
    [],
  )

  const unsaved = !viewsEqual(view, initial)
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
      <div className="workspace-body">
        <aside className="sidebar" aria-label="Parameters">
          <ParameterList
            channels={channels}
            selected={selected}
            colours={colours}
            onSelect={select}
          />
        </aside>
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
            checked={view.trim}
            onChange={(trim) => setView((current) => ({ ...current, trim }))}
          />
          <TimeSeriesChart
            dataset={dataset}
            channels={channels}
            selected={selected}
            colours={colours}
            theme={theme}
          />
        </main>
      </div>
    </div>
  )
}
