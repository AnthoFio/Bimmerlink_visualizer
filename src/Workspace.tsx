import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemePicker } from './components/ThemePicker.tsx'
import { useTheme } from './components/useTheme.ts'
import { parameters } from './data/catalog.ts'
import { ChartPanels } from './features/charts/ChartPanels.tsx'
import { Minimap } from './features/charts/Minimap.tsx'
import { DataTable } from './features/charts/DataTable.tsx'
import { RangeStatistics } from './features/charts/RangeStatistics.tsx'
import { TimeWindowControl } from './features/charts/TimeWindowControl.tsx'
import { PresetPicker } from './features/selection/PresetPicker.tsx'
import { CsvExportButton } from './features/session/CsvExportButton.tsx'
import { ImageExport } from './features/session/ImageExport.tsx'
import { ViewFileActions } from './features/session/ViewFileActions.tsx'
import { ParameterList } from './features/selection/ParameterList.tsx'
import { FileHeader } from './features/upload/FileHeader.tsx'
import { RampUpToggle } from './features/upload/RampUpToggle.tsx'
import type { LoadedLog } from './features/upload/useLogLoader.ts'
import { describeChannels } from './lib/channels.ts'
import { defaultSelection } from './lib/defaults.ts'
import { extendSlots, preferredSlot, slotColour } from './lib/palette.ts'
import { trimLeadingRows } from './lib/rampUp.ts'
import { clampWindow, logExtent, resolveWindow } from './lib/timeWindow.ts'
import { summarise } from './lib/summary.ts'
import { plural } from './lib/format.ts'
import { usePersistedView } from './usePersistedView.ts'
import { createViewport, windowOf } from './lib/viewport.ts'
import { chartSvg, exportModel, logTitle } from './lib/chartSvg.ts'
import {
  assignPanel,
  defaultView,
  panelOf,
  selectOnly,
  setSelected,
  settingsOf,
} from './lib/view.ts'

const EXPORT_WIDTH = 1200

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
  const [ids] = useState(() => channels.map((channel) => channel.id))
  const { view, setView, reset, restored } = usePersistedView(ids, initial, onUnsavedChange)
  const [viewport] = useState(createViewport)
  // Below 900 px the side panel is a drawer (index.css); wider, these have no effect.
  const sidebarId = useId()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerToggle = useRef<HTMLButtonElement>(null)
  const drawerClose = useRef<HTMLButtonElement>(null)
  // The drawer is only shown once React has rendered it open.
  useEffect(() => {
    if (drawerOpen) drawerClose.current?.focus()
  }, [drawerOpen])
  // While open: Escape closes it wherever the focus is, and so does a window that grows
  // past the drawer width, so that narrowing it again does not reopen it by itself.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDrawerOpen(false)
      drawerToggle.current?.focus()
    }
    const wide =
      typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 900px)') : null
    const onWide = () => {
      if (wide?.matches) setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    wide?.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      wide?.removeEventListener('change', onWide)
    }
  }, [drawerOpen])
  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => {
    setDrawerOpen(false)
    drawerToggle.current?.focus()
  }

  const dataset = useMemo(
    () => (view.trim ? trimLeadingRows(log.dataset, log.rampUp.rows) : log.dataset),
    [log, view.trim],
  )
  const summary = useMemo(() => summarise(dataset), [dataset])
  const extent = useMemo(() => logExtent(dataset.time), [dataset])
  const selected = useMemo(() => new Set(view.selected), [view.selected])
  const visible = useMemo(
    () =>
      channels.filter(
        (channel) => selected.has(channel.id) && !settingsOf(view, channel.id).hidden,
      ),
    [channels, selected, view],
  )
  // Colours stick to a series while it is shown; a newly shown one takes a free colour.
  const [slots, setSlots] = useState<ReadonlyMap<string, number>>(() => new Map())
  const shownIds = visible.map((channel) => channel.id)
  let currentSlots = slots
  if (shownIds.some((id) => !slots.has(id))) {
    currentSlots = extendSlots(slots, shownIds)
    setSlots(currentSlots)
  }
  const series = view.series
  const colours = useMemo(() => {
    const picked = (id: string) => (Object.hasOwn(series, id) ? series[id]!.colour : undefined)
    return new Map(
      channels.map(({ id }) => {
        const slot = currentSlots.get(id) ?? preferredSlot(id)
        return [id, picked(id) ?? slotColour(slot, theme)] as const
      }),
    )
  }, [channels, currentSlots, series, theme])
  const unmatched = channels.filter((channel) => !channel.matched).length

  // The selection before the last preset, while the selection is still the one it set.
  const [beforePreset, setBeforePreset] = useState<{ before: string[]; after: string[] }>()
  const applyPresetIds = (ids: string[]) => {
    const after = [...ids]
    setBeforePreset({ before: view.selected, after })
    // Not selectOnly, which copies: the identity of `after` tells that nothing changed since.
    setView((current) => ({ ...current, selected: after }))
  }
  const undoable = beforePreset?.after === view.selected ? beforePreset : undefined

  const select = useCallback(
    (ids: string[], on: boolean) => setView((current) => setSelected(current, ids, on)),
    [setView],
  )

  const assign = useCallback(
    (id: string, panel: string) => setView((current) => assignPanel(current, id, panel)),
    [setView],
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
      <FileHeader fileName={log.fileName} summary={summary} unmatched={unmatched} onFiles={onFiles}>
        <button
          ref={drawerToggle}
          type="button"
          className="drawer-toggle"
          aria-expanded={drawerOpen}
          aria-controls={sidebarId}
          onClick={() => (drawerOpen ? closeDrawer() : openDrawer())}
        >
          Parameters
        </button>
        <ThemePicker />
      </FileHeader>
      <div className="workspace-body">
        <aside
          id={sidebarId}
          className={drawerOpen ? 'sidebar is-open' : 'sidebar'}
          aria-label="Parameters"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && drawerOpen) {
              event.stopPropagation()
              closeDrawer()
            }
          }}
        >
          <button ref={drawerClose} type="button" className="drawer-close" onClick={closeDrawer}>
            Close parameters
          </button>
          <PresetPicker
            channels={channels}
            onApply={applyPresetIds}
            onUndo={
              undoable &&
              (() => {
                setBeforePreset(undefined)
                setView((current) => selectOnly(current, undoable.before))
              })
            }
          />
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
          {restored && (
            <div role="status" className="message restored">
              Restored the saved view of this column layout
              {restored.skipped.length > 0 &&
                `; ${plural(restored.skipped.length, 'parameter', 'parameters')} skipped (not in this log)`}
              .
            </div>
          )}
          <div className="view-actions">
            <button type="button" onClick={reset}>
              Reset view
            </button>
            <CsvExportButton
              fileName={log.fileName}
              dataset={dataset}
              channels={visible}
              window={() => resolveWindow(viewport.get().window, extent)}
            />
            <ImageExport
              fileName={log.fileName}
              svg={() => {
                const width = Math.round(
                  document.querySelector('.workspace-main')?.clientWidth ?? EXPORT_WIDTH,
                )
                const model = exportModel({
                  dataset,
                  channels,
                  colours,
                  view,
                  windowOf: (panel) => resolveWindow(windowOf(viewport.get(), panel), extent),
                })
                const text = chartSvg(model, { title: logTitle(log.fileName), theme, width })
                const height = Number(/height="(\d+)"/.exec(text)?.[1] ?? 0)
                return { text, width, height }
              }}
            />
            <ViewFileActions
              fileName={log.fileName}
              ids={ids}
              current={() => ({ view, window: viewport.get().window })}
              onImport={(imported, window) => {
                setView(imported)
                viewport.set({ window: window && clampWindow(window, extent) })
              }}
            />
          </div>
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
          <DataTable dataset={dataset} channels={visible} viewport={viewport} />
        </main>
      </div>
    </div>
  )
}
