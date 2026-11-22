import { useSyncExternalStore } from 'react'
import { ParameterInfo } from '../../components/ParameterInfo.tsx'
import { formatValue } from '../../lib/format.ts'
import type { PanelItem } from '../../lib/panelContent.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { nearestIndex } from '../../lib/search.ts'
import { unitLabel } from '../../lib/units.ts'
import type { CursorSource } from './ChartPanel.tsx'

interface Props {
  dataset: LogDataset
  items: readonly PanelItem[]
  /** Where the values are read; it outlives the hover, so that the list can be scrolled. */
  cursor: CursorSource
}

/** The legend, and docked in it the values at the cursor: it never covers the chart. */
export function Legend({ dataset, items, cursor }: Props) {
  const at = useSyncExternalStore(cursor.subscribe, cursor.get)
  const index = at === null ? undefined : nearestIndex(dataset.time, at)

  return (
    <div className="readout">
      <p className="readout-time">
        {index === undefined ? (
          'Point at the chart to read values.'
        ) : (
          <>
            At <span>{dataset.time[index]!.toFixed(3)} s</span>
          </>
        )}
      </p>
      <ul className="legend" aria-label="Legend" tabIndex={0}>
        {items.map(({ channel, colour }) => (
          <li key={channel.id}>
            <span className="swatch" aria-hidden="true" style={{ backgroundColor: colour }} />
            <span className="legend-name">{channel.name}</span>
            <span className="value">
              {index === undefined
                ? ''
                : formatValue(dataset.columns[channel.column]!.values[index])}
            </span>
            <span className="unit">{unitLabel(channel.unit)}</span>
            <ParameterInfo channel={channel} />
          </li>
        ))}
      </ul>
    </div>
  )
}
