import { useMemo, useState } from 'react'
import { useStore } from '../../components/useStore.ts'
import { axisGutters } from '../../lib/axes.ts'
import type { Gutters } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import { isStepped } from '../../lib/lineStyle.ts'
import type { Range } from '../../lib/yRange.ts'
import type { Theme } from '../../lib/palette.ts'
import { panelContent } from '../../lib/panelContent.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { nearestIndex } from '../../lib/search.ts'
import { logExtent, resolveWindow } from '../../lib/timeWindow.ts'
import { createPanel, PANEL_HEIGHT } from '../../lib/view.ts'
import type { Panel } from '../../lib/view.ts'
import {
  createViewport,
  cursorTimeOf,
  readoutTimeOf,
  setWindowOf,
  windowOf,
} from '../../lib/viewport.ts'
import type { ViewportStore } from '../../lib/viewport.ts'
import { panelRanges } from '../../lib/panelRanges.ts'
import { AxisControls } from './AxisControls.tsx'
import { ChartPanel } from './ChartPanel.tsx'
import type { CursorSource, PlotSeries } from './ChartPanel.tsx'
import { FurtherAxes } from './FurtherAxes.tsx'
import { handleChartKey } from './gestures.ts'
import type { GestureTarget } from './gestures.ts'
import { Legend } from './Legend.tsx'

interface Props {
  dataset: LogDataset
  channels: readonly Channel[]
  selected: ReadonlySet<string>
  colours: ReadonlyMap<string, string>
  theme: Theme
  /** The settings of the panel. */
  panel?: Panel
  /** Shared by all panels; left out, the chart only makes room for its own axes. */
  gutters?: Gutters
  /** The manual range of an axis, if it has one. */
  rangeOf?: (key: string) => Range | undefined
  onRange?: (key: string, range: Range | null) => void
  /** Position of the panel, from 1. */
  number?: number
  /** Shared by all panels; left out, the chart has a window of its own. */
  viewport?: ViewportStore
}

const DEFAULT_PANEL = createPanel('p1', PANEL_HEIGHT.initial)
const automatic = () => undefined
const ignore = () => undefined

export function TimeSeriesChart(props: Props) {
  const { dataset, channels, selected, colours, theme, gutters } = props
  const { panel = DEFAULT_PANEL, rangeOf = automatic, onRange = ignore, number = 1 } = props
  const [ownViewport] = useState(createViewport)
  const viewport = props.viewport ?? ownViewport

  const bounds = useMemo(() => logExtent(dataset.time), [dataset.time])
  const sync = useMemo(() => ({ id: panel.id, synced: panel.synced }), [panel.id, panel.synced])
  const stored = useStore(viewport, (state) => windowOf(state, sync))
  const shown = useMemo(() => resolveWindow(stored, bounds), [stored, bounds])
  const selection = useStore(viewport, (state) => state.selection)
  // Reads the store, not the last render: several events can arrive within one frame.
  const gestures = useMemo<GestureTarget>(
    () => ({
      window: () => resolveWindow(windowOf(viewport.get(), sync), bounds),
      extent: () => bounds,
      setWindow: (window) => setWindowOf(viewport, sync, window),
      reset: () => setWindowOf(viewport, sync, null),
      select: (selection) => viewport.set({ selection }),
      hover: (time) => {
        if (time === null) {
          const last = viewport.get().cursor
          if (last) viewport.set({ cursor: { ...last, hovering: false } })
          return
        }
        const snapped = dataset.time[nearestIndex(dataset.time, time)]!
        viewport.set({
          cursor: { time: snapped, panel: sync.id, synced: sync.synced, hovering: true },
        })
      },
    }),
    [viewport, bounds, sync, dataset.time],
  )

  const cursor = useMemo<CursorSource>(
    () => ({ get: () => cursorTimeOf(viewport.get(), sync), subscribe: viewport.subscribe }),
    [viewport, sync],
  )

  const readout = useMemo<CursorSource>(
    () => ({ get: () => readoutTimeOf(viewport.get(), sync), subscribe: viewport.subscribe }),
    [viewport, sync],
  )

  const { items, axes } = useMemo(
    () => panelContent(channels, selected, colours),
    [channels, selected, colours],
  )
  const series = useMemo<PlotSeries[]>(
    () =>
      items.map(({ channel, colour, axis }) => ({
        id: channel.id,
        name: channel.name,
        values: dataset.columns[channel.column]!.values,
        colour,
        axis,
        stepped: isStepped(channel, panel.lines),
      })),
    [dataset, items, panel.lines],
  )
  // Fitting all data does not depend on the window, so panning need not compute it again.
  const fitted = panel.fit === 'visible' ? shown : bounds
  const fittedRanges = useMemo(
    () => panelRanges(dataset.time, series, axes.length, panel.fit, fitted),
    [dataset.time, series, axes, panel.fit, fitted],
  )
  const ranges = useMemo(
    () => axes.map((axis, i) => rangeOf(axis.key) ?? fittedRanges[i]!),
    [axes, fittedRanges, rangeOf],
  )
  const own = useMemo(() => axisGutters([axes]), [axes])

  return (
    <>
      <div
        className="plot"
        role="group"
        tabIndex={0}
        aria-label={
          `Time-series chart from ${shown.min.toFixed(3)} s to ${shown.max.toFixed(3)} s. ` +
          'Plus and minus zoom, the arrow keys pan, 0 shows the full log.'
        }
        onKeyDown={(event) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return
          const next = handleChartKey(event.key, gestures.window(), bounds)
          if (!next) return
          event.preventDefault()
          if (next === 'reset') gestures.reset()
          else gestures.setWindow(next)
        }}
      >
        <ChartPanel
          time={dataset.time}
          window={shown}
          gestures={gestures}
          cursor={cursor}
          selection={selection}
          series={series}
          axes={axes}
          ranges={ranges}
          onRange={onRange}
          gutters={gutters ?? own}
          capacity={channels.length}
          theme={theme}
          height={panel.height}
        />
        {series.length === 0 && (
          <p className="plot-empty">
            Nothing to draw yet. Select one or more parameters to plot them against time.
          </p>
        )}
      </div>
      <FurtherAxes axes={axes} ranges={ranges} />
      <AxisControls
        number={number}
        axes={axes}
        ranges={ranges}
        isManual={(key) => rangeOf(key) !== undefined}
        onRange={onRange}
      />
      <Legend dataset={dataset} items={items} cursor={readout} />
    </>
  )
}
