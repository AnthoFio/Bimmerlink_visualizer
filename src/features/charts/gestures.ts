// The interaction layer of the charts (ADR 0001: ours, and in one place).
import { clampWindow, panBy, zoomAround } from '../../lib/timeWindow.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'

export interface GestureTarget {
  window: () => TimeWindow
  extent: () => TimeWindow
  setWindow: (window: TimeWindow) => void
  reset: () => void
  /** The time under the pointer; null when it left. */
  hover: (time: number | null) => void
  select: (range: TimeWindow) => void
}

const WHEEL_SPEED = 0.0015
const WHEEL_LINE_PX = 16
const MAX_WHEEL_STEP = 600
const KEY_ZOOM = 0.75
const KEY_PAN = 0.1
const MIN_PINCH_PX = 10

/** Mouse and touch on a plot area. Returns the function that detaches them. */
export function attachGestures(area: HTMLElement, target: GestureTarget): () => void {
  let endDrag: (() => void) | undefined
  let pinch: { start: TimeWindow; gap: number; time: number } | undefined

  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const { left, width } = area.getBoundingClientRect()
    if (!width) return
    const now = target.window()
    const span = now.max - now.min
    const unit = event.deltaMode === 1 ? WHEEL_LINE_PX : 1
    // A sideways swipe on a trackpad pans.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      target.setWindow(panBy(now, ((event.deltaX * unit) / width) * span, target.extent()))
      return
    }
    const step = Math.max(-MAX_WHEEL_STEP, Math.min(MAX_WHEEL_STEP, event.deltaY * unit))
    const at = now.min + ((event.clientX - left) / width) * span
    target.setWindow(zoomAround(now, at, Math.exp(step * WHEEL_SPEED), target.extent()))
  }

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return
    const { left, width } = area.getBoundingClientRect()
    if (!width) return
    event.preventDefault()
    // preventDefault also stops the focus, which the keyboard shortcuts need.
    area.closest<HTMLElement>('[tabindex]')?.focus({ preventScroll: true })
    endDrag?.()

    const from = event.clientX
    const start = target.window()
    const perPixel = (start.max - start.min) / width
    const pan = (moved: MouseEvent) =>
      target.setWindow(panBy(start, (from - moved.clientX) * perPixel, target.extent()))
    const timeAt = (clientX: number) =>
      start.min + Math.min(width, Math.max(0, clientX - left)) * perPixel
    const select = (moved: MouseEvent) => {
      const [a, b] = [timeAt(from), timeAt(moved.clientX)]
      if (a !== b) target.select({ min: Math.min(a, b), max: Math.max(a, b) })
    }
    const move = event.shiftKey ? select : pan
    const up = () => endDrag?.()
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    endDrag = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      endDrag = undefined
    }
  }

  const twoFingers = (event: TouchEvent) => {
    const { left, width } = area.getBoundingClientRect()
    const a = event.touches[0]!.clientX
    const b = event.touches[1]!.clientX
    return {
      gap: Math.max(MIN_PINCH_PX, Math.abs(a - b)),
      at: ((a + b) / 2 - left) / (width || 1),
    }
  }

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2) {
      pinch = undefined
      return
    }
    event.preventDefault()
    const { gap, at } = twoFingers(event)
    const start = target.window()
    pinch = { start, gap, time: start.min + at * (start.max - start.min) }
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!pinch || event.touches.length !== 2) return
    event.preventDefault()
    const { gap, at } = twoFingers(event)
    const { start, time } = pinch
    const span = (start.max - start.min) * (pinch.gap / gap)
    const min = time - at * span
    // The time under the fingers stays under them, so moving both of them pans.
    target.setWindow(clampWindow({ min, max: min + span }, target.extent()))
  }

  const onTouchEnd = () => {
    pinch = undefined
  }
  const onDoubleClick = () => target.reset()
  const onMouseMove = (event: MouseEvent) => {
    const { left, width } = area.getBoundingClientRect()
    if (!width) return
    const { min, max } = target.window()
    const share = Math.min(1, Math.max(0, (event.clientX - left) / width))
    target.hover(min + share * (max - min))
  }
  const onMouseLeave = () => target.hover(null)

  area.addEventListener('wheel', onWheel, { passive: false })
  area.addEventListener('mousedown', onMouseDown)
  area.addEventListener('dblclick', onDoubleClick)
  area.addEventListener('mousemove', onMouseMove)
  area.addEventListener('mouseleave', onMouseLeave)
  area.addEventListener('touchstart', onTouchStart, { passive: false })
  area.addEventListener('touchmove', onTouchMove, { passive: false })
  area.addEventListener('touchend', onTouchEnd)
  area.addEventListener('touchcancel', onTouchEnd)

  return () => {
    endDrag?.()
    area.removeEventListener('wheel', onWheel)
    area.removeEventListener('mousedown', onMouseDown)
    area.removeEventListener('dblclick', onDoubleClick)
    area.removeEventListener('mousemove', onMouseMove)
    area.removeEventListener('mouseleave', onMouseLeave)
    area.removeEventListener('touchstart', onTouchStart)
    area.removeEventListener('touchmove', onTouchMove)
    area.removeEventListener('touchend', onTouchEnd)
    area.removeEventListener('touchcancel', onTouchEnd)
  }
}

/** The window after a key press on a focused chart; undefined for a key that means nothing. */
export function handleChartKey(
  key: string,
  now: TimeWindow,
  extent: TimeWindow,
): TimeWindow | 'reset' | undefined {
  const span = now.max - now.min
  const middle = now.min + span / 2
  switch (key) {
    case '+':
    case '=':
      return zoomAround(now, middle, KEY_ZOOM, extent)
    case '-':
    case '_':
      return zoomAround(now, middle, 1 / KEY_ZOOM, extent)
    case 'ArrowLeft':
      return panBy(now, -span * KEY_PAN, extent)
    case 'ArrowRight':
      return panBy(now, span * KEY_PAN, extent)
    case '0':
      return 'reset'
    default:
      return undefined
  }
}
