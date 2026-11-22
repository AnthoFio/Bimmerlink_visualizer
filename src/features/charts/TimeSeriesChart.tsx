import { useMemo } from 'react'
import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { unitLabel } from '../../lib/units.ts'
import { PANEL_HEIGHT } from '../../lib/view.ts'
import { ChartPanel } from './ChartPanel.tsx'
import type { PlotSeries } from './ChartPanel.tsx'
import { Legend } from './Legend.tsx'

interface Props {
  dataset: LogDataset
  channels: readonly Channel[]
  selected: ReadonlySet<string>
  colours: ReadonlyMap<string, string>
  theme: Theme
  height?: number
}

export function TimeSeriesChart({
  dataset,
  channels,
  selected,
  colours,
  theme,
  height = PANEL_HEIGHT.initial,
}: Props) {
  const items = useMemo(
    () =>
      channels
        .filter((channel) => selected.has(channel.id))
        .map((channel) => ({ channel, colour: colours.get(channel.id) ?? 'gray' })),
    [channels, selected, colours],
  )
  const series = useMemo<PlotSeries[]>(
    () =>
      items.map(({ channel, colour }) => ({
        id: channel.id,
        name: channel.name,
        values: dataset.columns[channel.column]!.values,
        colour,
      })),
    [dataset, items],
  )
  const axisTitle = [...new Set(items.map(({ channel }) => unitLabel(channel.unit)))].join(' / ')

  return (
    <>
      <div className="plot">
        <ChartPanel
          time={dataset.time}
          series={series}
          axisTitle={axisTitle}
          theme={theme}
          height={height}
        />
        {series.length === 0 && (
          <p className="plot-empty">
            Nothing to draw yet. Select one or more parameters to plot them against time.
          </p>
        )}
      </div>
      <Legend items={items} />
    </>
  )
}
