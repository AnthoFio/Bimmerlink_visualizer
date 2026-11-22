import { FIT_MODES, LINE_STYLES, PANEL_HEIGHT } from '../../lib/view.ts'
import type { FitMode, LineStyle, Panel } from '../../lib/view.ts'

const FIT_MODE_NAMES: Record<FitMode, string> = { visible: 'Visible window', all: 'All data' }

const LINE_STYLE_NAMES: Record<LineStyle, string> = {
  auto: 'Automatic',
  linear: 'Linear',
  step: 'Step',
}

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
      <label>
        Lines{' '}
        <select
          aria-label={`Lines in panel ${number}`}
          value={panel.lines}
          onChange={(event) => onUpdate({ lines: event.target.value as LineStyle })}
        >
          {LINE_STYLES.map((style) => (
            <option key={style} value={style}>
              {LINE_STYLE_NAMES[style]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          aria-label={`Sync panel ${number} with the others`}
          checked={panel.synced}
          onChange={(event) => onUpdate({ synced: event.target.checked })}
        />{' '}
        Sync
      </label>
      <label>
        Fit{' '}
        <select
          aria-label={`Fit panel ${number}`}
          value={panel.fit}
          onChange={(event) => onUpdate({ fit: event.target.value as FitMode })}
        >
          {FIT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {FIT_MODE_NAMES[mode]}
            </option>
          ))}
        </select>
      </label>
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
