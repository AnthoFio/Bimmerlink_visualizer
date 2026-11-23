import { useState } from 'react'
import type { Channel } from '../../lib/channels.ts'
import { applyPreset, PRESETS } from '../../lib/presets.ts'

interface Props {
  channels: readonly Channel[]
  /** Replaces the selection. */
  onApply: (ids: string[]) => void
  /** Present while the last preset can be undone. */
  onUndo?: () => void
}

export function PresetPicker({ channels, onApply, onUndo }: Props) {
  const [name, setName] = useState(PRESETS[0]!.name)
  const [report, setReport] = useState<string>()

  const apply = () => {
    const preset = PRESETS.find((candidate) => candidate.name === name)!
    const { ids, found, missing } = applyPreset(preset, channels)
    const total = found + missing
    if (found === 0) {
      setReport(`None of the ${total} parameters of ${name} is in this log.`)
      return
    }
    onApply(ids)
    setReport(missing ? `${missing} of ${total} not in this log.` : `All ${total} applied.`)
  }

  return (
    <div className="presets">
      <select aria-label="Preset" value={name} onChange={(event) => setName(event.target.value)}>
        {PRESETS.map((preset) => (
          <option key={preset.name}>{preset.name}</option>
        ))}
      </select>
      <button type="button" onClick={apply}>
        Apply preset
      </button>
      {onUndo && (
        <button
          type="button"
          onClick={() => {
            setReport(undefined)
            onUndo()
          }}
        >
          Undo preset
        </button>
      )}
      <span role="status" aria-label="Preset result" className="hint">
        {report}
      </span>
    </div>
  )
}
