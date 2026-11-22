import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Channel } from '../../lib/channels.ts'
import { isHiddenByDefault } from '../../lib/defaults.ts'
import { filterChannels, isFiltering, NO_FILTER } from '../../lib/filter.ts'
import { FilterBar } from './FilterBar.tsx'
import { ParameterRow } from './ParameterRow.tsx'
import { SelectedList } from './SelectedList.tsx'

interface Props {
  channels: readonly Channel[]
  selected: ReadonlySet<string>
  colours: ReadonlyMap<string, string>
  onSelect: (ids: string[], on: boolean) => void
  /** The panels, top to bottom; with only one there is nothing to assign. */
  panels?: readonly string[]
  panelOf?: (id: string) => string
  onAssign?: (id: string, panel: string) => void
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

const ONE_PANEL: readonly string[] = []
const ignore = () => undefined

export function ParameterList(props: Props) {
  const { channels, selected, colours, onSelect } = props
  const { panels = ONE_PANEL, panelOf, onAssign = ignore } = props
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState(NO_FILTER)

  const filtering = isFiltering(filter)
  const matching = useMemo(() => filterChannels(channels, filter), [channels, filter])
  const chosen = useMemo(
    () => channels.filter((channel) => selected.has(channel.id)),
    [channels, selected],
  )
  // A search reaches the hidden roles too, and a selected channel is never hidden.
  const listed =
    showAll || filtering
      ? matching
      : channels.filter((channel) => selected.has(channel.id) || !isHiddenByDefault(channel))
  const hidden = channels.length - listed.length
  const ids = listed.map((channel) => channel.id)

  return (
    <>
      <FilterBar
        channels={channels}
        filter={filter}
        matches={matching.length}
        onChange={setFilter}
      />
      <div className="list-actions">
        <button type="button" onClick={() => onSelect(ids, true)}>
          Select all
        </button>
        <button type="button" onClick={() => onSelect(ids, false)}>
          Clear
        </button>
        {!filtering && (showAll || hidden > 0) && (
          <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show all (${hidden} hidden)`}
          </button>
        )}
      </div>
      <SelectedList channels={chosen} colours={colours} onRemove={(id) => onSelect([id], false)} />
      <div className="parameter-groups" onKeyDown={moveFocus}>
        <ul className="parameter-list" aria-label="Parameters">
          {listed.map((channel) => (
            <ParameterRow
              key={channel.id}
              channel={channel}
              checked={selected.has(channel.id)}
              colour={colours.get(channel.id)}
              panel={panelOf?.(channel.id) ?? ''}
              panels={panels}
              onAssign={onAssign}
              onSelect={onSelect}
            />
          ))}
        </ul>
        {listed.length === 0 && <p className="hint">No parameter matches.</p>}
      </div>
    </>
  )
}
