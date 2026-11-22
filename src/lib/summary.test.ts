import { describe, expect, it } from 'vitest'
import { loadExampleBytes } from '../test/fixtures.ts'
import { formatDuration } from './format.ts'
import { parseLogText } from './parseLog.ts'
import { summarise } from './summary.ts'

describe('summarise', () => {
  it('summarises the biggest example log', () => {
    const text = new TextDecoder().decode(loadExampleBytes('2026-10-25_09-33-22.csv'))
    const summary = summarise(parseLogText(text))

    expect(summary.rows).toBe(51_019)
    expect(summary.channels).toBe(11)
    expect(summary.duration).toBeCloseTo(1532.95, 3)
    expect(summary.interval).toBeCloseTo(0.03, 3)
  })

  it('uses the median, so one long pause does not move the interval', () => {
    const time = Float64Array.from([0, 1, 2, 3, 100])

    expect(summarise({ time, columns: [] }).interval).toBe(1)
  })

  it('has no interval for a single row', () => {
    expect(summarise({ time: Float64Array.from([4]), columns: [] })).toEqual({
      rows: 1,
      channels: 0,
      duration: 0,
      interval: undefined,
    })
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [59.6, '01:00'],
    [457.079, '07:37'],
    [1532.95, '25:33'],
    [3725, '62:05'],
  ])('formats %s s as %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text)
  })
})
