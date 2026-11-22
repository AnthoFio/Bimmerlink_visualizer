import { useState } from 'react'
import { AXIS_CHOICES } from '../../lib/axes.ts'
import type { AxisChoice } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import { assignPanel, panelOf, settingsOf, updateSeries } from '../../lib/view.ts'
import type { View } from '../../lib/view.ts'

const AXIS_NAMES: Record<AxisChoice, string> = { left: 'Left', right: 'Right', new: 'New axis' }

interface Props {
  channel: Channel
  view: View
  /** The colour in use. */
  colour: string
  onChange: (update: (view: View) => View) => void
}

export function SeriesMenu({ channel: { id, name }, view, colour, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-label={`Options for ${name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="series-menu">
          <label>
            Axis{' '}
            <select
              aria-label={`Axis of ${name}`}
              value={settingsOf(view, id).axis ?? ''}
              onChange={(event) => {
                const axis = AXIS_CHOICES.find((choice) => choice === event.target.value)
                onChange((current) => updateSeries(current, id, { axis }))
              }}
            >
              <option value="">Automatic</option>
              {AXIS_CHOICES.map((choice) => (
                <option key={choice} value={choice}>
                  {AXIS_NAMES[choice]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Panel{' '}
            <select
              aria-label={`Panel of ${name}`}
              value={panelOf(view, id)}
              onChange={(event) => {
                const panel = event.target.value
                onChange((current) => assignPanel(current, id, panel))
              }}
            >
              {view.panels.map((panel, i) => (
                <option key={panel.id} value={panel.id}>
                  Panel {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Colour{' '}
            <input
              type="color"
              aria-label={`Colour of ${name}`}
              value={colour}
              onChange={(event) => {
                const picked = event.target.value
                onChange((current) => updateSeries(current, id, { colour: picked }))
              }}
            />
          </label>
          <button
            type="button"
            aria-label={`Reset ${name} to automatic`}
            onClick={() =>
              onChange((current) =>
                updateSeries(current, id, { axis: undefined, panel: undefined, colour: undefined }),
              )
            }
          >
            Reset
          </button>
        </div>
      )}
    </>
  )
}
