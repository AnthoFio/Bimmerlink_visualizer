import { describe, expect, it } from 'vitest'
import { normalisationSpans, toPercent } from './normalise.ts'

const time = Float64Array.from({ length: 11 }, (_, i) => i)
const values = Float64Array.from({ length: 11 }, (_, i) => i * i)

describe('normalise', () => {
  it('maps the own min and max to 0 and 100%', () => {
    expect(Array.from(toPercent([10, 15, 20], [10, 20]))).toEqual([0, 50, 100])
  })

  it('keeps gaps and puts a flat series in the middle', () => {
    expect(Array.from(toPercent([null, 4], [4, 4]))).toEqual([null, 50])
  })

  it('spans the full log or the visible window', () => {
    const window = { min: 4, max: 6 }

    expect(normalisationSpans(time, [values], 'log', window)).toEqual([[0, 100]])
    expect(normalisationSpans(time, [values], 'window', window)).toEqual([[9, 36]])
  })
})
