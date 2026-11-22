import { describe, expect, it } from 'vitest'
import { createStore } from './store.ts'
import { clampWindow, logExtent, MIN_SPAN, panBy, resolveWindow, zoomAround } from './timeWindow.ts'

const log = { min: 10, max: 110 }

describe('time window', () => {
  it('takes the extent from the time column', () => {
    expect(logExtent(Float64Array.from([0.3, 1, 9]))).toEqual({ min: 0.3, max: 9 })
  })

  it('gives a log of one row a width', () => {
    const { min, max } = logExtent(Float64Array.from([4]))

    expect(max).toBeGreaterThan(min)
  })

  it('zooms around a time, which stays where it is', () => {
    const zoomed = zoomAround(log, 35, 0.5, log)

    expect(zoomed).toEqual({ min: 22.5, max: 72.5 })
    expect((35 - zoomed.min) / 50).toBe((35 - log.min) / 100)
  })

  it('is bounded by the log', () => {
    expect(zoomAround(log, 60, 3, log)).toEqual(log)
    expect(zoomAround({ min: 12, max: 32 }, 32, 2, log)).toEqual({ min: 10, max: 50 })
    expect(panBy({ min: 20, max: 40 }, -100, log)).toEqual({ min: 10, max: 30 })
    expect(panBy({ min: 20, max: 40 }, 100, log)).toEqual({ min: 90, max: 110 })
  })

  it('has a smallest span', () => {
    const { min, max } = zoomAround(log, 50, 1e-9, log)

    expect(max - min).toBeCloseTo(MIN_SPAN)
    expect(clampWindow({ min: 109.99, max: 110 }, log).max).toBe(110)
  })

  it('reads "no window" as the full log', () => {
    expect(resolveWindow(null, log)).toBe(log)
    expect(resolveWindow({ min: 0, max: 20 }, log)).toEqual({ min: 10, max: 30 })
  })
})

describe('createStore', () => {
  it('tells subscribers about changes, until they unsubscribe', () => {
    const store = createStore({ n: 1, other: 'kept' })
    const seen: number[] = []
    const stop = store.subscribe(() => seen.push(store.get().n))

    store.set({ n: 2 })
    store.set({ n: 2 })
    stop()
    store.set({ n: 3 })

    expect(seen).toEqual([2])
    expect(store.get()).toEqual({ n: 3, other: 'kept' })
  })
})
