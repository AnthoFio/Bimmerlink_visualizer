import { useMemo, useState } from 'react'
import { useStore } from '../../components/useStore.ts'
import { axisGutters } from '../../lib/axes.ts'
import type { Gutters } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import { panelContent } from '../../lib/panelContent.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { logExtent, resolveWindow } from '../../lib/timeWindow.ts'
import { PANEL_HEIGHT } from '../../lib/view.ts'
import { createViewport } from '../../lib/viewport.ts'
import type { ViewportStore } from '../../lib/viewport.ts'
import { autoRange, extent } from '../../lib/yRange.ts'
import { ChartPanel } from './ChartPanel.tsx'
import type { PlotSeries } from './ChartPanel.tsx'
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
  height?: number
  /** Shared by all panels; left out, the chart only makes room for its own axes. */
  gutters?: Gutters
  /** Shared by all panels; left out, the chart has a window of its own. */
  viewport?: ViewportStore
}

export function TimeSeriesChart(props: Props) {
  const { dataset, channels, selected, colours, theme, gutters } = props
  const { height = PANEL_HEIGHT.initial } = props
  const [ownViewport] = useState(createViewport)
  const viewport = props.viewport ?? ownViewport

  const bounds = useMemo(() => logExtent(dataset.time), [dataset.time])
  const stored = useStore(viewport, (state) => state.window)
  const shown = useMemo(() => resolveWindow(stored, bounds), [stored, bounds])
  // Reads the store, not the last render: several events can arrive within one frame.
  const gestures = useMemo<GestureTarget>(
    () => ({
      window: () => resolveWindow(viewport.get().window, bounds),
      extent: () => bounds,
      setWindow: (window) => viewport.set({ window }),
      reset: () => viewport.set({ window: null }),
    }),
    [viewport, bounds],
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
      })),
    [dataset, items],
  )
  const ranges = useMemo(() => {
    const extents = series.map((line) => extent(line.values))
    return axes.map((_, axis) => autoRange(extents.filter((_, i) => series[i]!.axis === axis)))
  }, [axes, series])
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
          series={series}
          axes={axes}
          ranges={ranges}
          gutters={gutters ?? own}
          capacity={channels.length}
          theme={theme}
          height={height}
        />
        {series.length === 0 && (
          <p className="plot-empty">
            Nothing to draw yet. Select one or more parameters to plot them against time.
          </p>
        )}
      </div>
      <FurtherAxes axes={axes} ranges={ranges} />
      <Legend items={items} />
    </>
  )
}
