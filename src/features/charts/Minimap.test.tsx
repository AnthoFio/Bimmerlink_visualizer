import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createViewport } from '../../lib/viewport.ts'
import { Minimap } from './Minimap.tsx'

// 0 to 1000 s on a track of 1000 px, so a pixel is a second.
const time = Float64Array.from({ length: 1001 }, (_, i) => i)
const values = Float64Array.from({ length: 1001 }, (_, i) => Math.sin(i / 50))
const series = { name: 'Engine Speed', values, colour: '#1f6fd0' }

function setup(window?: { min: number; max: number }) {
  const viewport = createViewport()
  if (window) viewport.set({ window })
  render(<Minimap time={time} series={series} viewport={viewport} />)
  const track = screen
    .getByRole('region', { name: 'Overview' })
    .querySelector<HTMLElement>('.minimap-track')!
  track.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
  const slider = (name: string) => screen.getByRole('slider', { name })
  const drag = (from: HTMLElement, startX: number, endX: number) =>
    act(() => {
      fireEvent.pointerDown(from, { clientX: startX, button: 0 })
      fireEvent.pointerMove(globalThis.window, { clientX: endX })
      fireEvent.pointerUp(globalThis.window)
    })
  return { viewport, track, slider, drag }
}

describe('Minimap', () => {
  it('draws the first selected series over the whole log', () => {
    setup()
    const line = screen.getByRole('img', { name: 'Engine Speed over the whole log' })

    expect(line.querySelector('path')?.getAttribute('d')).toMatch(/^M0/)
  })

  it('follows the charts', () => {
    const { viewport, slider } = setup()

    act(() => viewport.set({ window: { min: 250, max: 500 } }))
    const brush = slider('Window position')
    expect(brush.style.left).toBe('25%')
    expect(brush.style.width).toBe('25%')
  })

  it('moves the charts when the window is dragged', () => {
    const { viewport, slider, drag } = setup({ min: 200, max: 300 })

    drag(slider('Window position'), 250, 450)
    expect(viewport.get().window).toEqual({ min: 400, max: 500 })
  })

  it('resizes the window from both edges', () => {
    const { viewport, slider, drag } = setup({ min: 200, max: 300 })

    drag(slider('Window start'), 200, 100)
    expect(viewport.get().window).toEqual({ min: 100, max: 300 })

    drag(slider('Window end'), 300, 700)
    expect(viewport.get().window).toEqual({ min: 100, max: 700 })
  })

  it('does not let the edges cross', () => {
    const { viewport, slider, drag } = setup({ min: 200, max: 300 })

    drag(slider('Window start'), 200, 900)
    const { min, max } = viewport.get().window!
    expect(max).toBe(300)
    expect(min).toBeLessThan(300)
  })

  it('works with the keyboard', () => {
    const { viewport, slider } = setup({ min: 200, max: 300 })

    act(() => void fireEvent.keyDown(slider('Window position'), { key: 'ArrowRight' }))
    expect(viewport.get().window).toEqual({ min: 210, max: 310 })
  })

  it('jumps to a click outside the window', () => {
    const { viewport, track } = setup({ min: 200, max: 300 })

    act(() => void fireEvent.pointerDown(track, { clientX: 800, button: 0 }))
    expect(viewport.get().window).toEqual({ min: 750, max: 850 })
  })
})
