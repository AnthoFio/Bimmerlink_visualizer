import { PANEL_HEIGHT } from '../../lib/view.ts'
import type { Panel } from '../../lib/view.ts'

interface Props {
  panel: Panel
  /** Position, from 1. */
  number: number
  count: number
  onUpdate: (change: Partial<Panel>) => void
  onMove: (by: -1 | 1) => void
  onRemove: () => void
}

export function PanelToolbar({ panel, number, count, onUpdate, onMove, onRemove }: Props) {
  return (
    <div className="panel-toolbar">
      <h3>Panel {number}</h3>
      <div className="panel-actions">
        <label>
          Height{' '}
          <input
            type="range"
            aria-label={`Height of panel ${number}`}
            min={PANEL_HEIGHT.min}
            max={PANEL_HEIGHT.max}
            step={PANEL_HEIGHT.step}
            value={panel.height}
            onChange={(event) => onUpdate({ height: Number(event.target.value) })}
          />
        </label>
        <button
          type="button"
          aria-label={`Move panel ${number} up`}
          disabled={number === 1}
          onClick={() => onMove(-1)}
        >
          Up
        </button>
        <button
          type="button"
          aria-label={`Move panel ${number} down`}
          disabled={number === count}
          onClick={() => onMove(1)}
        >
          Down
        </button>
        <button
          type="button"
          aria-label={`Remove panel ${number}`}
          disabled={count === 1}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
