import { useState } from 'react'
import type { Axis } from '../../lib/axes.ts'
import type { Range } from '../../lib/yRange.ts'
import { AxisRangeForm } from './AxisRangeForm.tsx'

interface Props {
  /** Position of the panel, from 1. */
  number: number
  axes: readonly Axis[]
  /** The ranges in use. */
  ranges: readonly Range[]
  isManual: (key: string) => boolean
  onRange: (key: string, range: Range | null) => void
}

export function AxisControls({ number, axes, ranges, isManual, onRange }: Props) {
  // The forms render only while open: the ranges change on every frame of a pan.
  const [open, setOpen] = useState(false)
  if (axes.length === 0) return null

  return (
    <div className="axis-controls">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Axes of panel {number}
      </button>
      {open &&
        axes.map((axis, i) => (
          <AxisRangeForm
            key={axis.key}
            label={`${axis.title} in panel ${number}`}
            title={axis.title}
            range={ranges[i]!}
            manual={isManual(axis.key)}
            onRange={(range) => onRange(axis.key, range)}
          />
        ))}
    </div>
  )
}
