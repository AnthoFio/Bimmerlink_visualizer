import type { Channel } from '../../lib/channels.ts'

interface Props {
  channels: readonly Channel[]
  colours: ReadonlyMap<string, string>
  onRemove: (id: string) => void
}

/** The selection, whatever the filters hide. */
export function SelectedList({ channels, colours, onRemove }: Props) {
  return (
    <section className="selected" aria-label="Selected">
      <h3>Selected ({channels.length})</h3>
      <ul className="parameter-list" aria-label="Selected parameters">
        {channels.map(({ id, name }) => (
          <li key={id} className="parameter-row">
            <span
              className="swatch"
              aria-hidden="true"
              style={{ backgroundColor: colours.get(id) }}
            />
            <span className="parameter-name">{name}</span>
            <button
              type="button"
              className="menu-button"
              aria-label={`Unselect ${name}`}
              onClick={() => onRemove(id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
