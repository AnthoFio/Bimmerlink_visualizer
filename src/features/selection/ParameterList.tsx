import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Channel } from '../../lib/channels.ts'
import { isHiddenByDefault } from '../../lib/defaults.ts'
import { ParameterRow } from './ParameterRow.tsx'

interface Props {
  channels: readonly Channel[]
  selected: ReadonlySet<string>
  colours: ReadonlyMap<string, string>
  onSelect: (ids: string[], on: boolean) => void
}

/** Arrow keys, Home and End move between the checkboxes of the list. */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') return
  const boxes = [...event.currentTarget.querySelectorAll<HTMLInputElement>('input[type=checkbox]')]
  const at = boxes.indexOf(event.target)
  const to = {
    ArrowDown: Math.min(at + 1, boxes.length - 1),
    ArrowUp: Math.max(at - 1, 0),
    Home: 0,
    End: boxes.length - 1,
  }[event.key]
  if (to === undefined) return
  event.preventDefault()
  boxes[to]?.focus()
}

export function ParameterList({ channels, selected, colours, onSelect }: Props) {
  const [showAll, setShowAll] = useState(false)
  // A selected channel is always listed, or it could not be switched off.
  const listed = showAll
    ? channels
    : channels.filter((channel) => selected.has(channel.id) || !isHiddenByDefault(channel))
  const hidden = channels.length - listed.length
  const ids = listed.map((channel) => channel.id)

  return (
    <>
      <div className="list-actions">
        <button type="button" onClick={() => onSelect(ids, true)}>
          Select all
        </button>
        <button type="button" onClick={() => onSelect(ids, false)}>
          Clear
        </button>
        {(showAll || hidden > 0) && (
          <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show all (${hidden} hidden)`}
          </button>
        )}
      </div>
      <div className="parameter-groups" onKeyDown={moveFocus}>
        <ul className="parameter-list">
          {listed.map((channel) => (
            <ParameterRow
              key={channel.id}
              channel={channel}
              checked={selected.has(channel.id)}
              colour={colours.get(channel.id)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </>
  )
}
