import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from './components/useTheme.ts'
import { parameters } from './data/catalog.ts'
import { ChartPanels } from './features/charts/ChartPanels.tsx'
import { Minimap } from './features/charts/Minimap.tsx'
import { RangeStatistics } from './features/charts/RangeStatistics.tsx'
import { TimeWindowControl } from './features/charts/TimeWindowControl.tsx'
import { ParameterList } from './features/selection/ParameterList.tsx'
import { FileHeader } from './features/upload/FileHeader.tsx'
import { RampUpToggle } from './features/upload/RampUpToggle.tsx'
import type { LoadedLog } from './features/upload/useLogLoader.ts'
import { describeChannels } from './lib/channels.ts'
import { defaultSelection } from './lib/defaults.ts'
import { slotColour } from './lib/palette.ts'
import { trimLeadingRows } from './lib/rampUp.ts'
import { logExtent } from './lib/timeWindow.ts'
import { summarise } from './lib/summary.ts'
import { createViewport } from './lib/viewport.ts'
import { assignPanel, defaultView, panelOf, setSelected, viewsEqual } from './lib/view.ts'

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
  const [initial] = useState(() => defaultView(defaultSelection(channels)))
  const [view, setView] = useState(initial)
  const [viewport] = useState(createViewport)

  const dataset = useMemo(
    () => (view.trim ? trimLeadingRows(log.dataset, log.rampUp.rows) : log.dataset),
    [log, view.trim],
  )
  const summary = useMemo(() => summarise(dataset), [dataset])
  const extent = useMemo(() => logExtent(dataset.time), [dataset])
  const selected = useMemo(() => new Set(view.selected), [view.selected])
  const colours = useMemo(
    () => new Map(channels.map((channel) => [channel.id, slotColour(channel.column, theme)])),
    [channels, theme],
  )
  const unmatched = channels.filter((channel) => !channel.matched).length
  const visible = useMemo(
    () => channels.filter((channel) => selected.has(channel.id)),
    [channels, selected],
  )

  const select = useCallback(
    (ids: string[], on: boolean) => setView((current) => setSelected(current, ids, on)),
    [],
  )

  const assign = useCallback(
    (id: string, panel: string) => setView((current) => assignPanel(current, id, panel)),
    [],
  )
  const panelIds = useMemo(() => view.panels.map((panel) => panel.id), [view.panels])

  const overview = useMemo(() => {
    const first = visible[0]
    return (
      first && {
        name: first.name,
        values: dataset.columns[first.column]!.values,
        colour: colours.get(first.id)!,
      }
    )
  }, [visible, dataset, colours])

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
            panels={panelIds}
            panelOf={(id) => panelOf(view, id)}
            onAssign={assign}
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
          <TimeWindowControl extent={extent} viewport={viewport} />
          <Minimap time={dataset.time} series={overview} viewport={viewport} />
          <ChartPanels
            dataset={dataset}
            channels={channels}
            view={view}
            viewport={viewport}
            onChange={setView}
            colours={colours}
            theme={theme}
          />
          <RangeStatistics dataset={dataset} channels={visible} viewport={viewport} />
        </main>
      </div>
    </div>
  )
}
