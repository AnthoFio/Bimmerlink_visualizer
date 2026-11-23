import { useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useStore } from '../../components/useStore.ts'
import { downsample } from '../../lib/downsample.ts'
import { linePath } from '../../lib/linePath.ts'
import { clampWindow, logExtent, MIN_SPAN, resolveWindow } from '../../lib/timeWindow.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import type { ViewportStore } from '../../lib/viewport.ts'
import { autoRange, extent } from '../../lib/yRange.ts'

const WIDTH = 1000
const HEIGHT = 100
const KEY_STEP = 0.01

type Part = 'start' | 'end' | 'body'
const EDGES = ['start', 'end'] as const

interface Props {
  time: Float64Array
  series: { name: string; values: Float64Array; colour: string } | undefined
  viewport: ViewportStore
}

export function Minimap({ time, series, viewport }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const endDrag = useRef<() => void>(null)
  const bounds = useMemo(() => logExtent(time), [time])
  const stored = useStore(viewport, (state) => state.window)
  const shown = resolveWindow(stored, bounds)
  const total = bounds.max - bounds.min
  const values = series?.values

  // The line only depends on the data: the window moves on every frame.
  const path = useMemo(() => {
    if (!values) return ''
    const { x, ys } = downsample(time, [values], bounds, WIDTH / 2)
    const [low, high] = autoRange([extent(values)])
    return linePath(
      x,
      ys[0]!,
      (t) => ((t - bounds.min) / (bounds.max - bounds.min)) * WIDTH,
      (v) => HEIGHT - ((v - low) / (high - low)) * HEIGHT,
    )
  }, [time, values, bounds])

  useEffect(() => () => endDrag.current?.(), [])

  const moved = (part: Part, start: TimeWindow, by: number): TimeWindow => {
    if (part === 'body') return clampWindow({ min: start.min + by, max: start.max + by }, bounds)
    if (part === 'start') {
      const min = Math.min(start.max - MIN_SPAN, Math.max(bounds.min, start.min + by))
      return { min, max: start.max }
    }
    const max = Math.max(start.min + MIN_SPAN, Math.min(bounds.max, start.max + by))
    return { min: start.min, max }
  }

  const beginDrag = (part: Part) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.focus()
    const { width } = track.current!.getBoundingClientRect()
    if (!width) return
    endDrag.current?.()

    const from = event.clientX
    const move = (next: PointerEvent) =>
      viewport.set({ window: moved(part, shown, ((next.clientX - from) / width) * total) })
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      endDrag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    endDrag.current = stop
  }

  const onKey = (part: Part) => (event: KeyboardEvent<HTMLElement>) => {
    const direction = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key]
    if (direction === undefined) return
    event.preventDefault()
    event.stopPropagation()
    viewport.set({ window: moved(part, shown, direction * KEY_STEP * total) })
  }

  const percent = (t: number) => ((t - bounds.min) / total) * 100
  const left = percent(shown.min)
  const right = percent(shown.max)

  const slider = (part: Part, label: string, value: number) => ({
    role: 'slider',
    tabIndex: 0,
    'aria-label': label,
    'aria-valuemin': Math.round(bounds.min),
    'aria-valuemax': Math.round(bounds.max),
    'aria-valuenow': Math.round(value),
    'aria-valuetext': `${value.toFixed(2)} seconds`,
    onPointerDown: beginDrag(part),
    onKeyDown: onKey(part),
  })

  return (
    <section className="minimap" aria-label="Overview">
      <div
        ref={track}
        className="minimap-track"
        onPointerDown={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          if (!box.width) return
          const at = bounds.min + ((event.clientX - box.left) / box.width) * total
          const half = (shown.max - shown.min) / 2
          viewport.set({ window: clampWindow({ min: at - half, max: at + half }, bounds) })
        }}
      >
        {series && (
          <svg
            role="img"
            aria-label={`${series.name} over the whole log`}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
          >
            <path d={path} fill="none" stroke={series.colour} vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        <div
          className="brush"
          style={{ left: `${left}%`, width: `${right - left}%` }}
          {...slider('body', 'Window position', shown.min)}
        />
        {EDGES.map((edge) => (
          <div
            key={edge}
            className={`brush-edge brush-${edge}`}
            style={{ left: `${edge === 'start' ? left : right}%` }}
            {...slider(
              edge,
              edge === 'start' ? 'Window start' : 'Window end',
              edge === 'start' ? shown.min : shown.max,
            )}
          />
        ))}
      </div>
    </section>
  )
}
