import { useLayoutEffect, useRef } from 'react'

interface Props {
  category: string
  selected: number
  available: number
  open: boolean
  onToggleOpen: () => void
  onSelectAll: (on: boolean) => void
}

export function GroupHeader(props: Props) {
  const { category, selected, available, open, onToggleOpen, onSelectAll } = props
  const box = useRef<HTMLInputElement>(null)
  const all = available > 0 && selected === available

  // There is no attribute for the third state.
  useLayoutEffect(() => {
    if (box.current) box.current.indeterminate = selected > 0 && !all
  })

  return (
    <div className="group-header">
      <input
        ref={box}
        type="checkbox"
        aria-label={`All ${category}`}
        checked={all}
        // From the partial state a click selects all of the group.
        onChange={() => onSelectAll(!all)}
      />
      <button type="button" className="group-toggle" aria-expanded={open} onClick={onToggleOpen}>
        <span>{category}</span>{' '}
        <span className="unit">
          {selected} / {available}
        </span>
      </button>
    </div>
  )
}
