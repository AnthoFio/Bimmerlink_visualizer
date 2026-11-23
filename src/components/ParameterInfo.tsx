import { useEffect, useId, useRef, useState } from 'react'
import type { Channel } from '../lib/channels.ts'
import { unitLabel } from '../lib/units.ts'

const WIDTH = 288
const CLOSE_DELAY_MS = 300
const MARGIN = 8

interface Position {
  left: number
  top?: number
  bottom?: number
}

/** Beside the button, inside the viewport: the parameter list would clip an absolute tooltip. */
function place(button: HTMLElement): Position {
  const box = button.getBoundingClientRect()
  const left = Math.max(MARGIN, Math.min(box.left, window.innerWidth - WIDTH - MARGIN))
  return box.bottom > window.innerHeight / 2
    ? { left, bottom: window.innerHeight - box.top + MARGIN }
    : { left, top: box.bottom + MARGIN }
}

export function ParameterInfo({ channel }: { channel: Channel }) {
  const id = useId()
  const [position, setPosition] = useState<Position>()
  const leaving = useRef<number>(undefined)
  const close = () => {
    window.clearTimeout(leaving.current)
    setPosition(undefined)
  }
  // Leaving the button closes it a moment later, so the pointer can move onto the tooltip.
  const closeSoon = () => {
    window.clearTimeout(leaving.current)
    leaving.current = window.setTimeout(() => setPosition(undefined), CLOSE_DELAY_MS)
  }
  const stay = () => window.clearTimeout(leaving.current)

  // A fixed tooltip would float away from its button when anything scrolls.
  const open = position !== undefined
  useEffect(() => {
    if (!open) return
    const onScroll = () => setPosition(undefined)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true })
  }, [open])
  useEffect(() => () => window.clearTimeout(leaving.current), [])

  return (
    <>
      <button
        type="button"
        className="info-button"
        aria-label={`About ${channel.name}`}
        aria-describedby={position ? id : undefined}
        onFocus={(event) => setPosition(place(event.currentTarget))}
        onPointerEnter={(event) => {
          stay()
          setPosition(place(event.currentTarget))
        }}
        onClick={(event) => setPosition(place(event.currentTarget))}
        onPointerLeave={closeSoon}
        onBlur={close}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
      >
        {channel.confidence === 'low' ? '!' : 'i'}
      </button>
      {position && (
        <span
          id={id}
          role="tooltip"
          className="tooltip"
          style={position}
          onPointerEnter={stay}
          onPointerLeave={closeSoon}
        >
          <span>{channel.description ?? 'Not in the parameter catalog.'}</span>
          <span className="tooltip-facts">
            {channel.category}
            {channel.role && ` · ${channel.role}`} · {unitLabel(channel.unit)}
          </span>
          {channel.confidence && (
            <span className={`badge badge-${channel.confidence}`}>
              {channel.confidence} confidence
              {channel.confidence === 'low' && ': this reading may be wrong'}
            </span>
          )}
        </span>
      )}
    </>
  )
}
