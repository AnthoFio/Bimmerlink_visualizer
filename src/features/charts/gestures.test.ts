import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import { attachGestures, handleChartKey } from './gestures.ts'

const extent = { min: 0, max: 100 }
let area: HTMLDivElement
let current: TimeWindow
let detach: () => void
const reset = vi.fn()

// The plot area is 1000 px wide and starts at x = 100.
beforeEach(() => {
  area = document.createElement('div')
  area.getBoundingClientRect = () => ({ left: 100, width: 1000 }) as DOMRect
  document.body.append(area)
  current = { ...extent }
  reset.mockClear()
  detach = attachGestures(area, {
    window: () => current,
    extent: () => extent,
    setWindow: (next) => {
      current = next
    },
    reset,
    hover: vi.fn(),
  })
})

afterEach(() => {
  detach()
  area.remove()
})

const mouse = (target: EventTarget, type: string, init: MouseEventInit) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }))

const touch = (type: string, ...xs: number[]) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: xs.map((clientX) => ({ clientX })) })
  area.dispatchEvent(event)
  return event
}

describe('mouse', () => {
  it('zooms with the wheel, centred on the cursor', () => {
    const event = new WheelEvent('wheel', { deltaY: -200, clientX: 350, cancelable: true })
    area.dispatchEvent(event)

    const span = current.max - current.min
    expect(span).toBeLessThan(100)
    expect(current.min + 0.25 * span).toBeCloseTo(25)
    expect(event.defaultPrevented).toBe(true)
  })

  it('pans by dragging', () => {
    current = { min: 40, max: 60 }
    mouse(area, 'mousedown', { clientX: 600 })
    mouse(window, 'mousemove', { clientX: 700 })
    expect(current).toEqual({ min: 38, max: 58 })

    mouse(window, 'mouseup', {})
    mouse(window, 'mousemove', { clientX: 900 })
    expect(current).toEqual({ min: 38, max: 58 })
  })

  it('leaves Shift-drag alone', () => {
    current = { min: 40, max: 60 }
    mouse(area, 'mousedown', { clientX: 600, shiftKey: true })
    mouse(window, 'mousemove', { clientX: 700 })

    expect(current).toEqual({ min: 40, max: 60 })
  })

  it('resets with a double click', () => {
    mouse(area, 'dblclick', {})

    expect(reset).toHaveBeenCalledOnce()
  })
})

describe('touch', () => {
  it('zooms in when two fingers spread', () => {
    touch('touchstart', 500, 700)
    const move = touch('touchmove', 400, 800)

    expect(current.max - current.min).toBeCloseTo(50)
    expect(current.min + current.max).toBeCloseTo(100)
    expect(move.defaultPrevented).toBe(true)
  })

  it('pans with two fingers', () => {
    current = { min: 40, max: 60 }
    touch('touchstart', 500, 700)
    touch('touchmove', 600, 800)

    expect(current.min).toBeCloseTo(38)
    expect(current.max).toBeCloseTo(58)
  })

  it('leaves one finger to scroll the page', () => {
    touch('touchstart', 500)

    expect(touch('touchmove', 600).defaultPrevented).toBe(false)
    expect(current).toEqual(extent)
  })
})

describe('keyboard', () => {
  const press = (key: string, from = { min: 40, max: 60 }) => handleChartKey(key, from, extent)

  it('zooms with + and -', () => {
    expect(press('+')).toEqual({ min: 42.5, max: 57.5 })
    const out = press('-') as TimeWindow
    expect(out.max - out.min).toBeGreaterThan(20)
  })

  it('pans with the arrows', () => {
    expect(press('ArrowRight')).toEqual({ min: 42, max: 62 })
    expect(press('ArrowLeft')).toEqual({ min: 38, max: 58 })
  })

  it('resets with 0 and ignores other keys', () => {
    expect(press('0')).toBe('reset')
    expect(press('a')).toBeUndefined()
  })
})
