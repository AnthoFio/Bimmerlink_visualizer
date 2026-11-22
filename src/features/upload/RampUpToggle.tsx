import { plural } from '../../lib/format.ts'

interface Props {
  /** Rows and seconds that the trim removes. */
  rows: number
  seconds: number
  checked: boolean
  onChange: (checked: boolean) => void
}

export function RampUpToggle({ rows, seconds, checked, onChange }: Props) {
  const trimmed = rows
    ? `${plural(rows, 'row', 'rows')} (${seconds.toFixed(2)} s) trimmed`
    : 'nothing to trim'

  return (
    <div className="ramp-up">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />{' '}
        Trim to first complete row
      </label>
      {checked && <span>{trimmed}</span>}
    </div>
  )
}
