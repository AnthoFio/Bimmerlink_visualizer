import { useMemo } from 'react'
import { axisGutters } from '../../lib/axes.ts'
import type { Gutters } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import { panelContent } from '../../lib/panelContent.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { PANEL_HEIGHT } from '../../lib/view.ts'
import { autoRange, extent } from '../../lib/yRange.ts'
import { ChartPanel } from './ChartPanel.tsx'
import type { PlotSeries } from './ChartPanel.tsx'
import { FurtherAxes } from './FurtherAxes.tsx'
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
}

export function TimeSeriesChart({
  dataset,
  channels,
  selected,
  colours,
  theme,
  height = PANEL_HEIGHT.initial,
  gutters,
}: Props) {
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
      <div className="plot">
        <ChartPanel
          time={dataset.time}
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
