import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { ParameterInfo } from '../../components/ParameterInfo.tsx'
import type { Channel } from '../../lib/channels.ts'
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
  renderOptions?: (channel: Channel) => ReactNode
  hiddenOf: (id: string) => boolean
  onToggle: (id: string) => void
  onFocus: (id: string | null) => void
}

/** The legend, and docked in it the values at the cursor: it never covers the chart. */
export function Legend(props: Props) {
  const { dataset, items, cursor, renderOptions, hiddenOf, onToggle, onFocus } = props
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
        {items.map(({ channel, colour, dash }) => (
          <li key={channel.id} className={hiddenOf(channel.id) ? 'is-hidden' : undefined}>
            <svg className="line-sample" aria-hidden="true" viewBox="0 0 24 10">
              <line
                x1="0"
                y1="5"
                x2="24"
                y2="5"
                stroke={colour}
                strokeWidth="3"
                strokeDasharray={dash?.length ? dash.join(' ') : undefined}
              />
            </svg>
            <button
              type="button"
              className="legend-name"
              aria-pressed={!hiddenOf(channel.id)}
              title="Show or hide; point at it to highlight"
              onClick={() => onToggle(channel.id)}
              onMouseEnter={() => onFocus(channel.id)}
              onMouseLeave={() => onFocus(null)}
              onFocus={() => onFocus(channel.id)}
              onBlur={() => onFocus(null)}
            >
              {channel.name}
            </button>
            <span className="value">
              {index === undefined
                ? ''
                : formatValue(dataset.columns[channel.column]!.values[index])}
            </span>
            <span className="unit">{unitLabel(channel.unit)}</span>
            <ParameterInfo channel={channel} />
            {renderOptions?.(channel)}
          </li>
        ))}
      </ul>
    </div>
  )
}
