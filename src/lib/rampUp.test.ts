import { describe, expect, it } from 'vitest'
import { exampleLogNames, loadExampleBytes } from '../test/fixtures.ts'
import { parseLogText } from './parseLog.ts'
import { detectRampUp, trimLeadingRows } from './rampUp.ts'
import { readLog } from './readLog.ts'

const example = (name: string) => new TextDecoder().decode(loadExampleBytes(name))

describe('detectRampUp', () => {
  it('finds the leading zero region of every channel of 2026-10-25_09-33-22.csv', () => {
    const text = example('2026-10-25_09-33-22.csv')

    // One channel reports per row: misfire 4 first (0.00), then misfire 5, 6, rail pressure...
    expect(detectRampUp(text, 11)).toEqual({
      channelRows: [8, 9, 10, 0, 1, 2, 3, 4, 5, 6, 7],
      rows: 10,
    })
    expect(parseLogText(text).time[10]).toBe(0.3)
  })

  it.each(exampleLogNames)('ends when the last channel has reported in %s', (name) => {
    const text = example(name)
    const channels = parseLogText(text).columns.length

    expect(detectRampUp(text, channels).rows).toBe(channels - 1)
  })

  it('does not call a channel that really stays at 0 an artefact', () => {
    const rows = Array.from({ length: 200 }, (_, i) => `${i},${i < 100 ? '0' : '7'},${i + 1}`)

    expect(detectRampUp(`Time,"A","B"\n${rows.join('\n')}`, 2)).toEqual({
      channelRows: [0, 0],
      rows: 0,
    })
  })

  it('tells a reported zero (0.00) from the placeholder (0)', () => {
    expect(detectRampUp('Time,"A","B"\n0,0.00,0\n1,0.00,0.00\n2,0.00,5\n', 2)).toEqual({
      channelRows: [0, 1],
      rows: 1,
    })
  })

  it('copes with CRLF, a lone CR, a BOM and blank lines', () => {
    for (const eol of ['\r\n', '\r']) {
      const text = `\uFEFF${['', 'Time,"A, b","C"', '0,0.00,0', '', '1,0.00,4.00'].join(eol)}`

      expect(detectRampUp(text, 2).rows).toBe(1)
    }
  })
})

describe('trimLeadingRows', () => {
  it('drops the rows without copying or changing the log', () => {
    const { dataset, rampUp } = readLog(example('2026-10-25_09-33-22.csv'))
    const trimmed = trimLeadingRows(dataset, rampUp.rows)

    expect(trimmed.time).toHaveLength(51_009)
    expect(trimmed.time[0]).toBe(0.3)
    expect(trimmed.time.buffer).toBe(dataset.time.buffer)
    expect(trimmed.columns.every((column) => column.values.length === 51_009)).toBe(true)
    expect(dataset.time).toHaveLength(51_019)
  })

  it('never empties a log', () => {
    const { dataset } = readLog('Time,"A"\n0,0\n')

    expect(trimLeadingRows(dataset, 1)).toBe(dataset)
  })
})

describe('readLog', () => {
  it('does not trim by row number when it had to reorder the rows', () => {
    const { rampUp } = readLog('Time,"A","B"\n2,1.00,0\n1,1.00,3.00\n')

    expect(rampUp.rows).toBe(0)
  })
})
