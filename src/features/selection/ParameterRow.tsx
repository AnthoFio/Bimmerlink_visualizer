import { memo } from 'react'
import { ParameterInfo } from '../../components/ParameterInfo.tsx'
import type { Channel } from '../../lib/channels.ts'
import { PARAMETER_DRAG_TYPE } from '../../lib/dragParameter.ts'
import { unitLabel } from '../../lib/units.ts'

interface Props {
  channel: Channel
  checked: boolean
  colour: string | undefined
  /** The panel of this parameter. */
  panel: string
  /** Panel ids, top to bottom. */
  panels: readonly string[]
  onSelect: (ids: string[], on: boolean) => void
  onAssign: (id: string, panel: string) => void
}

// Memoised: one toggle must not render the other 200 rows again.
export const ParameterRow = memo(function ParameterRow({
  channel,
  checked,
  colour,
  panel,
  panels,
  onSelect,
  onAssign,
}: Props) {
  return (
    <li
      className="parameter-row"
      draggable
      onDragStart={(event) => event.dataTransfer.setData(PARAMETER_DRAG_TYPE, channel.id)}
    >
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onSelect([channel.id], event.target.checked)}
        />
        <span className="swatch" aria-hidden="true" style={{ backgroundColor: colour }} />
        <span className="parameter-name">{channel.name}</span>
        <span className="unit">{unitLabel(channel.unit)}</span>
      </label>
      {checked && panels.length > 1 && (
        <select
          aria-label={`Panel for ${channel.name}`}
          value={panel}
          onChange={(event) => onAssign(channel.id, event.target.value)}
        >
          {panels.map((id, index) => (
            <option key={id} value={id}>
              {index + 1}
            </option>
          ))}
        </select>
      )}
      <ParameterInfo channel={channel} />
    </li>
  )
})
