import { useId, useState } from 'react'
import type { Range } from '../../lib/yRange.ts'

const show = (value: number) => String(Number(value.toPrecision(6)))
const read = (text: string) => (text.trim() === '' ? NaN : Number(text))

interface Props {
  /** Names the axis in the accessible names. */
  label: string
  title: string
  range: Range
  manual: boolean
  onRange: (range: Range | null) => void
}

export function AxisRangeForm({ label, title, range, manual, onRange }: Props) {
  const id = useId()
  const [edited, setEdited] = useState<{ min: string; max: string }>()
  const [problem, setProblem] = useState<string>()
  const fields = edited ?? { min: show(range[0]), max: show(range[1]) }

  const done = () => {
    setEdited(undefined)
    setProblem(undefined)
  }
  const submit = () => {
    const min = read(fields.min)
    const max = read(fields.max)
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      setProblem('Min must be a number below max.')
      return
    }
    done()
    onRange([min, max])
  }

  return (
    <form
      className="axis-range"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <span className="axis-title">{title}</span>
      <label>
        <input
          type="checkbox"
          aria-label={`Auto range of ${label}`}
          checked={!manual}
          onChange={(event) => {
            done()
            // Leaving Auto pins the range that is on screen.
            onRange(event.target.checked ? null : range)
          }}
        />{' '}
        Auto
      </label>
      {(['min', 'max'] as const).map((end) => (
        <label key={end}>
          {end === 'min' ? 'Min' : 'Max'}{' '}
          <input
            size={8}
            aria-label={`${end === 'min' ? 'Min' : 'Max'} of ${label}`}
            aria-invalid={problem !== undefined}
            aria-describedby={problem ? id : undefined}
            value={fields[end]}
            onChange={(event) => setEdited({ ...fields, [end]: event.target.value })}
          />
        </label>
      ))}
      <button type="submit" aria-label={`Set range of ${label}`}>
        Set
      </button>
      {problem && (
        <span id={id} role="alert" className="inline-error">
          {problem}
        </span>
      )}
    </form>
  )
}
