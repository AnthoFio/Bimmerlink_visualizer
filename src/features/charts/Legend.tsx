import { ParameterInfo } from '../../components/ParameterInfo.tsx'
import type { Channel } from '../../lib/channels.ts'
import { unitLabel } from '../../lib/units.ts'

interface Props {
  items: readonly { channel: Channel; colour: string }[]
}

export function Legend({ items }: Props) {
  return (
    <ul className="legend" aria-label="Legend">
      {items.map(({ channel, colour }) => (
        <li key={channel.id}>
          <span className="swatch" aria-hidden="true" style={{ backgroundColor: colour }} />
          <span>{channel.name}</span>
          <span className="unit">{unitLabel(channel.unit)}</span>
          <ParameterInfo channel={channel} />
        </li>
      ))}
    </ul>
  )
}
