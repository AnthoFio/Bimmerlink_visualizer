import { describe, expect, it } from 'vitest'
import { loadExampleBytes } from '../test/fixtures.ts'
import { downsample } from './downsample.ts'
import { parseLogText } from './parseLog.ts'
import { extent } from './yRange.ts'

const N = 50_000
const time = Float64Array.from({ length: N }, (_, i) => i * 0.03)
const all = { min: 0, max: time[N - 1]! }
const numbers = (values: ArrayLike<number | null>) =>
  Array.from(values).filter((value): value is number => value !== null)

describe('downsample', () => {
  it('keeps a spike of a single sample, up and down', () => {
    const values = new Float64Array(N).fill(5)
    values[20_011] = 99
    values[33_333] = -7
    const { x, ys } = downsample(time, [values], all, 800)

    expect(x.length).toBeLessThanOrEqual(2 * 802)
    expect(numbers(ys[0]!)).toContain(99)
    expect(numbers(ys[0]!)).toContain(-7)
  })

  it('keeps the extremes of every channel of the biggest example log', () => {
    const text = new TextDecoder().decode(loadExampleBytes('2026-10-25_09-33-22.csv'))
    const log = parseLogText(text)
    const window = { min: 0, max: log.time.at(-1)! }
    const columns = log.columns.map((column) => column.values)
    const { ys } = downsample(log.time, columns, window, 1000)

    columns.forEach((column, i) => {
      const kept = numbers(ys[i]!)
      expect([Math.min(...kept), Math.max(...kept)]).toEqual(extent(column))
    })
  })

  it('keeps the order of a minimum and a maximum within one bucket', () => {
    const t = Float64Array.from({ length: 100 }, (_, i) => i)
    const falling = Float64Array.from({ length: 100 }, (_, i) => 100 - i)
    const kept = numbers(downsample(t, [falling], { min: 0, max: 99 }, 10).ys[0]!)

    expect(kept).toEqual([...kept].sort((a, b) => b - a))
  })

  it('re-samples for the visible window: zoomed in, every sample is there', () => {
    const values = Float64Array.from({ length: N }, (_, i) => i % 17)
    const { x, ys } = downsample(time, [values], { min: 300, max: 330 }, 800)

    expect(x.length).toBeGreaterThanOrEqual(1000)
    expect(x.length).toBeLessThan(1010)
    expect(ys[0]![1]).toBe(values[Array.from(time).indexOf(x[1]!)])
  })

  it('adds one sample on each side, so that lines reach the edges', () => {
    const { x } = downsample(time, [], { min: 300.01, max: 600.01 }, 100)

    expect(x[0]).toBeLessThan(300.01)
    expect(x[x.length - 1]).toBeGreaterThan(600.01)
  })

  it('keeps x in order', () => {
    const { x } = downsample(time, [], { min: 12.3, max: 1234.5 }, 640)

    for (let i = 1; i < x.length; i++) expect(x[i]).toBeGreaterThanOrEqual(x[i - 1]!)
  })

  it('shows a run of gaps as a gap', () => {
    const values = new Float64Array(N).fill(1).fill(NaN, 10_000, 20_000)
    const { ys } = downsample(time, [values], all, 100)

    expect(Array.from<number | null>(ys[0]!)).toContain(null)
  })

  it('copes with a log of one row and a repeated time', () => {
    expect(
      Array.from(downsample(Float64Array.of(1), [Float64Array.of(2)], { min: 1, max: 2 }, 10).x),
    ).toEqual([1])
    expect(downsample(new Float64Array(100), [], { min: 0, max: 0.1 }, 10).x.length).toBeLessThan(3)
  })
})
