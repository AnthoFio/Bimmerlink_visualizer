import { useMemo } from 'react'
import { useStore } from '../../components/useStore.ts'
import type { Channel } from '../../lib/channels.ts'
import { formatCount, formatValue } from '../../lib/format.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { rangeStats } from '../../lib/stats.ts'
import { clampWindow, logExtent, resolveWindow } from '../../lib/timeWindow.ts'
import { unitLabel } from '../../lib/units.ts'
import type { ViewportStore } from '../../lib/viewport.ts'

interface Props {
  dataset: LogDataset
  /** The visible series. */
  channels: readonly Channel[]
  viewport: ViewportStore
}

export function RangeStatistics({ dataset, channels, viewport }: Props) {
  const selection = useStore(viewport, (state) => state.selection)
  const extent = useMemo(() => logExtent(dataset.time), [dataset.time])
  const rows = useMemo(
    () =>
      selection &&
      channels.map((channel) => ({
        channel,
        stats: rangeStats(dataset.time, dataset.columns[channel.column]!.values, selection),
      })),
    [dataset, channels, selection],
  )

  const selectVisible = () =>
    viewport.set({ selection: resolveWindow(viewport.get().window, extent) })

  return (
    <section className="range-statistics" aria-label="Range statistics">
      <div className="range-actions">
        <button type="button" onClick={selectVisible}>
          Select visible range
        </button>
        {selection ? (
          <>
            <button
              type="button"
              onClick={() => viewport.set({ window: clampWindow(selection, extent) })}
            >
              Zoom to selection
            </button>
            <button type="button" onClick={() => viewport.set({ selection: null })}>
              Clear selection
            </button>
          </>
        ) : (
          <span className="hint">Shift-drag on a chart to measure a range.</span>
        )}
      </div>
      {selection && rows && (
        <div className="table-scroll" tabIndex={0} role="group" aria-label="Statistics table">
          <table>
            <caption>
              Statistics from {selection.min.toFixed(3)} s to {selection.max.toFixed(3)} s
            </caption>
            <thead>
              <tr>
                {['Series', 'Min', 'Max', 'Mean', 'Delta', 'Samples'].map((head) => (
                  <th key={head} scope="col">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ channel, stats }) => (
                <tr key={channel.id}>
                  <th scope="row">
                    {channel.name} <span className="unit">{unitLabel(channel.unit)}</span>
                  </th>
                  <td>{formatValue(stats.min)}</td>
                  <td>{formatValue(stats.max)}</td>
                  <td>{formatValue(stats.mean)}</td>
                  <td>{formatValue(stats.delta)}</td>
                  <td>{formatCount(stats.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
