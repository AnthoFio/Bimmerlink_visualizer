import { memo } from 'react'
import type { Channel } from '../../lib/channels.ts'

interface Props {
  channel: Channel
  checked: boolean
  colour: string | undefined
  onSelect: (ids: string[], on: boolean) => void
}

// Memoised: one toggle must not render the other 200 rows again.
export const ParameterRow = memo(function ParameterRow({
  channel,
  checked,
  colour,
  onSelect,
}: Props) {
  return (
    <li className="parameter-row">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onSelect([channel.id], event.target.checked)}
        />
        <span className="swatch" aria-hidden="true" style={{ backgroundColor: colour }} />
        <span className="parameter-name">{channel.name}</span>
        <span className="unit">{channel.unit ?? 'unit unknown'}</span>
      </label>
    </li>
  )
})
