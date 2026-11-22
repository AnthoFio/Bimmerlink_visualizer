// @vitest-environment node
import { expect, it } from 'vitest'
import { loadExampleBytes } from '../test/fixtures.ts'
import { readLog } from './readLog.ts'

it('reads 50k rows x 13 columns in under 1 s', { timeout: 30_000 }, () => {
  // The biggest example has 11 channels, so its first two are repeated to reach 13.
  const text = new TextDecoder()
    .decode(loadExampleBytes('2026-10-25_09-33-22.csv'))
    .trimEnd()
    .split('\n')
    .map((line, row) => {
      if (row === 0) return `${line},"Extra A","Extra B"`
      const [, a, b] = line.split(',', 3)
      return `${line},${a},${b}`
    })
    .join('\n')

  // Best of five: the suite runs files in parallel, so a single run measures the neighbours too.
  let best = Infinity
  for (let run = 0; run < 5 && best >= 1000; run++) {
    const start = performance.now()
    const { dataset } = readLog(text)
    best = Math.min(best, performance.now() - start)
    expect(dataset.columns).toHaveLength(13)
    expect(dataset.time).toHaveLength(51_019)
  }
  expect(best).toBeLessThan(1000)
})
