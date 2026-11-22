import { describe, expect, it } from 'vitest'
import { loadExampleBytes, loadFixtureText } from '../test/fixtures.ts'
import { LogParseError, parseLog, parseLogText } from './parseLog.ts'

const decode = (bytes: Uint8Array) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)

describe('parseLogText: shape', () => {
  it('returns a Float64Array time axis and one Float64Array per column, in header order', () => {
    const dataset = parseLogText('Time,"A","B"\n0.000,1,2\n0.030,3,4.5\n')

    expect(dataset.time).toBeInstanceOf(Float64Array)
    expect(Array.from(dataset.time)).toEqual([0, 0.03])
    expect(dataset.columns.map((column) => column.name)).toEqual(['A', 'B'])
    for (const column of dataset.columns) expect(column.values).toBeInstanceOf(Float64Array)
    expect(Array.from(dataset.columns[0]!.values)).toEqual([1, 3])
    expect(Array.from(dataset.columns[1]!.values)).toEqual([2, 4.5])
  })

  it('returns right-sized arrays (no spare capacity from the trailing newline)', () => {
    const dataset = parseLogText('Time,"A"\n0,1\n1,2\n2,3\n')

    expect(dataset.time.length).toBe(3)
    expect(dataset.time.buffer.byteLength).toBe(3 * 8)
    expect(dataset.columns[0]!.values.length).toBe(3)
  })

  it('does not assume any column set or order: it reads the header', () => {
    const dataset = parseLogText('Time,"Z last","A first"\n0,1,2\n')

    expect(dataset.columns.map((column) => column.name)).toEqual(['Z last', 'A first'])
    expect(Array.from(dataset.columns[1]!.values)).toEqual([2])
  })

  it('keeps irregular sampling as is', () => {
    const dataset = parseLogText('Time,"A"\n0.000,1\n0.031,2\n0.059,3\n0.095,4\n')

    expect(Array.from(dataset.time)).toEqual([0, 0.031, 0.059, 0.095])
  })

  it('returns zero rows (but the columns) for a header-only log', () => {
    const dataset = parseLogText(loadFixtureText('header-only.csv'))

    expect(dataset.time.length).toBe(0)
    expect(dataset.columns).toHaveLength(9)
    expect(dataset.columns.every((column) => column.values.length === 0)).toBe(true)
  })
})

describe('parseLogText: Time column', () => {
  it.each(['Time', 'time', 'TIME', ' Time ', '"Time"'])('accepts the header %j', (label) => {
    const dataset = parseLogText(`${label},"A"\n0,1\n`)

    expect(dataset.columns.map((column) => column.name)).toEqual(['A'])
  })

  it('rejects a log whose first column is not Time', () => {
    const attempt = () => parseLogText(loadFixtureText('missing-time.csv'))

    expect(attempt).toThrow(LogParseError)
    expect(attempt).toThrow(expect.objectContaining({ code: 'missing-time' }))
  })

  it('rejects Time when it is not the first column', () => {
    expect(() => parseLogText('"A",Time\n1,0\n')).toThrow(
      expect.objectContaining({ code: 'missing-time' }),
    )
  })

  it('rejects an empty file', () => {
    expect(() => parseLogText(loadFixtureText('empty.csv'))).toThrow(
      expect.objectContaining({ code: 'empty' }),
    )
    expect(() => parseLogText('\n\n')).toThrow(expect.objectContaining({ code: 'empty' }))
  })
})

describe('parseLogText: format tolerance', () => {
  it('handles quoted labels with commas, doubled quotes and surrounding spaces', () => {
    const dataset = parseLogText('Time,"Rail, abs.","Say ""hi""", "Padded" \n0,1,2,3\n')

    expect(dataset.columns.map((column) => column.name)).toEqual([
      'Rail, abs.',
      'Say "hi"',
      'Padded',
    ])
  })

  it('handles a UTF-8 BOM identically to the LF log without it', () => {
    const withBom = parseLogText(loadFixtureText('bom.csv'))
    const plain = parseLogText(loadFixtureText('crlf.csv'))

    expect(withBom.columns.map((column) => column.name)).toEqual(
      plain.columns.map((column) => column.name),
    )
    expect(withBom.time.length).toBe(20)
    expect(Array.from(withBom.time)).toEqual(Array.from(plain.time))
    expect(withBom.columns).toEqual(plain.columns)
  })

  it('handles CRLF line endings (including the last one) with the same result as LF', () => {
    const crlf = loadFixtureText('crlf.csv')
    expect(crlf).toContain('\r\n')
    const fromCrlf = parseLogText(crlf)
    const fromLf = parseLogText(crlf.replaceAll('\r\n', '\n'))

    expect(fromCrlf.time.length).toBe(20)
    expect(fromCrlf.columns).toHaveLength(9)
    expect(fromCrlf).toEqual(fromLf)
    expect(fromCrlf.columns[0]!.name).not.toMatch(/\r/)
  })

  it('parses a decimal point and exponent notation, not a decimal comma', () => {
    const dataset = parseLogText('Time,"A"\n0.5,-12.25\n1e0,1.5e1\n')

    expect(Array.from(dataset.time)).toEqual([0.5, 1])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([-12.25, 15])
  })

  it('accepts a log without a trailing newline and ignores blank lines', () => {
    const dataset = parseLogText('Time,"A"\n0,1\n\n1,2')

    expect(Array.from(dataset.time)).toEqual([0, 1])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([1, 2])
  })

  it('tolerates quoted data cells', () => {
    const dataset = parseLogText('Time,"A"\n"0.000","1.5"\n')

    expect(Array.from(dataset.time)).toEqual([0])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([1.5])
  })
})

describe('parseLogText: bad cells become NaN, never throw', () => {
  it('maps a non-numeric cell to NaN and keeps the neighbours', () => {
    const dataset = parseLogText(loadFixtureText('non-numeric-cell.csv'))
    const engine = dataset.columns[0]!.values

    expect(dataset.time.length).toBe(4)
    expect(Array.from(engine.slice(0, 2))).toEqual([0, 812])
    expect(engine[2]).toBeNaN()
    expect(engine[3]).toBe(820)
    expect(Array.from(dataset.columns[1]!.values)).toEqual([0, 77, 77, 77.5])
  })

  it('maps blank and missing cells to NaN, ignores extra cells', () => {
    const dataset = parseLogText('Time,"A","B"\n0,1,\n1,2\n2,3,4,99\n')

    expect(dataset.columns[1]!.values[0]).toBeNaN()
    expect(dataset.columns[1]!.values[1]).toBeNaN()
    expect(dataset.columns[1]!.values[2]).toBe(4)
    expect(dataset.columns).toHaveLength(2)
  })

  it('maps a bad Time cell to NaN', () => {
    expect(parseLogText('Time,"A"\nx,1\n').time[0]).toBeNaN()
  })
})

describe('parseLogText: duplicate column names', () => {
  it('keeps every column and its original name (reporting is a validation concern)', () => {
    const dataset = parseLogText(loadFixtureText('duplicate-columns.csv'))

    expect(dataset.columns.map((column) => column.name)).toEqual([
      'Engine speed',
      'Oil Temperature',
      'Oil Temperature',
      'Engine Speed',
    ])
    expect(Array.from(dataset.columns[1]!.values)).toEqual([0, 77, 77.5])
    expect(Array.from(dataset.columns[2]!.values)).toEqual([0, 77.25, 77.5])
  })
})

describe('parseLogText: trimmed real logs', () => {
  it.each([
    ['trimmed_2026-09-06_09-23-14.csv', 12],
    ['trimmed_2026-09-06_10-09-49.csv', 12],
    ['trimmed_2026-10-24_12-29-08.csv', 9],
    ['trimmed_2026-10-25_09-33-22.csv', 11],
    ['trimmed_2026-11-14_10-12-17.csv', 13],
  ])('%s has 150 rows and %i parameter columns, all finite', (name, count) => {
    const dataset = parseLogText(loadFixtureText(name))

    expect(dataset.time.length).toBe(150)
    expect(dataset.time[0]).toBe(0)
    expect(dataset.columns).toHaveLength(count)
    for (const column of dataset.columns) {
      expect(column.values.length).toBe(150)
      expect(column.values.every(Number.isFinite), column.name).toBe(true)
    }
  })

  it('keeps non-zero first samples: the lambda adaptation factor is 1.03 in row 0', () => {
    const dataset = parseLogText(loadFixtureText('trimmed_2026-09-06_10-09-49.csv'))
    const firstRow = dataset.columns.map((column) => column.values[0])

    expect(firstRow).toContain(1.03)
  })
})

describe('parseLog: text or File', () => {
  it('resolves the same dataset from a string and from a File', async () => {
    const text = loadFixtureText('crlf.csv')
    const fromText = await parseLog(text)
    const fromFile = await parseLog(new File([text], 'log.csv', { type: 'text/csv' }))

    expect(fromFile).toEqual(fromText)
    expect(fromFile).toEqual(parseLogText(text))
  })

  it('rejects with a LogParseError for an empty File', async () => {
    await expect(parseLog(new File([], 'empty.csv'))).rejects.toMatchObject({ code: 'empty' })
  })
})

describe('every log in Example/', () => {
  const names = [
    '2026-09-06_09-23-14.csv',
    '2026-09-06_10-09-49.csv',
    '2026-10-24_12-29-08 2.csv',
    '2026-10-24_12-29-08.csv',
    '2026-10-25_09-33-22.csv',
    '2026-11-14_10-12-17.csv',
  ]

  it.each(names)('%s parses with the header-driven columns and every row', (name) => {
    const text = decode(loadExampleBytes(name))
    const lines = text.split('\n').filter((line) => line.length > 0)
    const headerCount = lines[0]!.split('","').length

    const dataset = parseLogText(text)

    expect(dataset.time.length).toBe(lines.length - 1)
    expect(dataset.columns).toHaveLength(headerCount)
    expect(dataset.time[0]).toBe(0)
    expect(dataset.time.at(-1)).toBeGreaterThan(60)
    for (const column of dataset.columns) {
      expect(column.values.length).toBe(dataset.time.length)
      expect(column.values.every(Number.isFinite), column.name).toBe(true)
    }
  })

  it('parses the 51k-row log (2026-10-25_09-33-22.csv) with 11 columns', () => {
    const dataset = parseLogText(decode(loadExampleBytes('2026-10-25_09-33-22.csv')))

    expect(dataset.time.length).toBe(51019)
    expect(dataset.columns).toHaveLength(11)
  })

  it('treats the byte-identical duplicate log identically', () => {
    const a = parseLogText(decode(loadExampleBytes('2026-10-24_12-29-08.csv')))
    const b = parseLogText(decode(loadExampleBytes('2026-10-24_12-29-08 2.csv')))

    expect(b).toEqual(a)
  })
})
