import { useMemo } from 'react'
import { useStore } from '../../components/useStore.ts'
import type { Channel } from '../../lib/channels.ts'
import { formatValue } from '../../lib/format.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { indexAfter, indexAtOrAfter } from '../../lib/search.ts'
import { rangeStats } from '../../lib/stats.ts'
import { logExtent, resolveWindow } from '../../lib/timeWindow.ts'
import { unitLabel } from '../../lib/units.ts'
import type { ViewportStore } from '../../lib/viewport.ts'

const MAX_ROWS = 50

interface Props {
  dataset: LogDataset
  /** The visible series. */
  channels: readonly Channel[]
  viewport: ViewportStore
}

/**
 * The text alternative of the canvas charts: a summary and a table of samples, over the
 * selected range, or over the visible window when nothing is selected.
 */
export function DataTable({ dataset, channels, viewport }: Props) {
  const selection = useStore(viewport, (state) => state.selection)
  const window = useStore(viewport, (state) => state.window)
  const range = selection ?? resolveWindow(window, logExtent(dataset.time))

  const rows = useMemo(() => {
    const from = indexAtOrAfter(dataset.time, range.min)
    const to = indexAfter(dataset.time, range.max)
    const count = to - from
    const step = Math.max(1, count / MAX_ROWS)
    const picked: number[] = []
    for (let i = 0; i < Math.min(count, MAX_ROWS); i++) picked.push(from + Math.floor(i * step))
    return picked
  }, [dataset.time, range.min, range.max])

  const scope = selection ? 'the selected range' : 'the visible window'

  return (
    <details className="data-table">
      <summary>Data table</summary>
      <p>
        {channels.length === 0
          ? 'No series is visible.'
          : `${channels.length} series over ${scope}, ${range.min.toFixed(3)} s to ${range.max.toFixed(3)} s. `}
        {channels
          .map((channel) => {
            const stats = rangeStats(dataset.time, dataset.columns[channel.column]!.values, range)
            return `${channel.name}: ${formatValue(stats.min)} to ${formatValue(stats.max)} ${unitLabel(channel.unit)}, mean ${formatValue(stats.mean)}.`
          })
          .join(' ')}
      </p>
      {channels.length > 0 && (
        <div className="table-scroll" tabIndex={0} role="group" aria-label="Samples">
          <table>
            <caption>
              {rows.length} samples, evenly spread over {scope}
            </caption>
            <thead>
              <tr>
                <th scope="col">Time (s)</th>
                {channels.map((channel) => (
                  <th key={channel.id} scope="col">
                    {channel.name} ({unitLabel(channel.unit)})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <th scope="row">{dataset.time[row]!.toFixed(3)}</th>
                  {channels.map((channel) => (
                    <td key={channel.id}>
                      {formatValue(dataset.columns[channel.column]!.values[row])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  )
}
