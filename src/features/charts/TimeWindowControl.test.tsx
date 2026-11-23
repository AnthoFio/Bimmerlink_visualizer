import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseTime } from '../../lib/parseTime.ts'
import { createViewport } from '../../lib/viewport.ts'
import { TimeWindowControl } from './TimeWindowControl.tsx'

const extent = { min: 0.3, max: 1532.95 }

function setup() {
  const viewport = createViewport()
  render(<TimeWindowControl extent={extent} viewport={viewport} />)
  const start = screen.getByRole<HTMLInputElement>('textbox', { name: 'Start' })
  const end = screen.getByRole<HTMLInputElement>('textbox', { name: 'End' })
  const type = (input: HTMLInputElement, value: string) =>
    fireEvent.change(input, { target: { value } })
  const apply = () => fireEvent.click(screen.getByRole('button', { name: 'Apply window' }))
  return { viewport, start, end, type, apply }
}

describe('parseTime', () => {
  it.each([
    ['612', 612],
    [' 612.5 s ', 612.5],
    ['10:12', 612],
    ['10:12.5', 612.5],
    ['0:05', 5],
    ['95:00', 5700],
  ])('reads %j as %s s', (text, seconds) => {
    expect(parseTime(text)).toBe(seconds)
  })

  it.each(['', 'abc', '10:75', '1:2:3', '-4', '1e3', 'Infinity'])('rejects %j', (text) => {
    expect(parseTime(text)).toBeUndefined()
  })
})

describe('TimeWindowControl', () => {
  it('sets the window from seconds or mm:ss', () => {
    const { viewport, start, end, type, apply } = setup()

    type(start, '612')
    type(end, '10:40')
    apply()
    expect(viewport.get().window).toEqual({ min: 612, max: 640 })
  })

  it('clamps to the log', () => {
    const { viewport, start, end, type, apply } = setup()

    type(start, '0')
    type(end, '30:00')
    apply()
    expect(viewport.get().window).toEqual(extent)
  })

  it('rejects text that is no time and a start after the end', () => {
    const { viewport, start, end, type, apply } = setup()

    type(start, 'soon')
    apply()
    expect(screen.getByRole('alert')).toHaveTextContent('seconds or mm:ss')

    type(start, '700')
    type(end, '600')
    apply()
    expect(screen.getByRole('alert')).toHaveTextContent('before the end')
    expect(viewport.get().window).toBeNull()
  })

  it('follows zoom and pan, also over a half-typed value', () => {
    const { viewport, start, end, type } = setup()

    type(start, '1')
    act(() => viewport.set({ window: { min: 100, max: 200.5 } }))
    expect(start.value).toBe('100')
    expect(end.value).toBe('200.5')
  })

  it('resets to the full log', () => {
    const { viewport, start } = setup()
    act(() => viewport.set({ window: { min: 100, max: 200 } }))

    fireEvent.click(screen.getByRole('button', { name: 'Full log' }))
    expect(viewport.get().window).toBeNull()
    expect(start.value).toBe('0.3')
  })
})
