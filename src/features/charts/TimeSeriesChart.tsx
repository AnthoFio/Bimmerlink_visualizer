import { useMemo } from 'react'
import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { ChartPanel } from './ChartPanel.tsx'
import type { PlotSeries } from './ChartPanel.tsx'

const HEIGHT = 420

interface Props {
  dataset: LogDataset
  channels: readonly Channel[]
  selected: ReadonlySet<string>
  colours: ReadonlyMap<string, string>
  theme: Theme
}

export function TimeSeriesChart({ dataset, channels, selected, colours, theme }: Props) {
  const series = useMemo<PlotSeries[]>(
    () =>
      channels
        .filter((channel) => selected.has(channel.id))
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          values: dataset.columns[channel.column]!.values,
          colour: colours.get(channel.id) ?? 'gray',
        })),
    [dataset, channels, selected, colours],
  )

  return (
    <section aria-label="Chart" className="panel">
      <div className="plot">
        <ChartPanel time={dataset.time} series={series} theme={theme} height={HEIGHT} />
        {series.length === 0 && (
          <p className="plot-empty">
            Nothing to draw yet. Select one or more parameters to plot them against time.
          </p>
        )}
      </div>
    </section>
  )
}
