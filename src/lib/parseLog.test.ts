import { describe, expect, it } from 'vitest'
import { loadExampleBytes, loadFixtureText } from '../test/fixtures.ts'
import { LogParseError, parseLogText } from './parseLog.ts'

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

  it('handles a UTF-8 BOM: the bom.csv fixture equals its LF slice', () => {
    const text = loadFixtureText('bom.csv')
    expect(text.charCodeAt(0)).toBe(0xfeff)

    const withBom = parseLogText(text)
    const plain = parseLogText(text.slice(1))

    expect(withBom.time.length).toBe(20)
    expect(withBom.columns).toHaveLength(9)
    expect(withBom).toEqual(plain)
    expect(withBom.columns[0]!.name.includes(String.fromCharCode(0xfeff))).toBe(false)
  })

  it('strips a BOM prepended to any log, so it never ends up in the first label', () => {
    const text = loadFixtureText('crlf.csv')

    expect(parseLogText('\uFEFF' + text)).toEqual(parseLogText(text))
  })

  it('reads a file with lone CR line endings (no LF anywhere) like the LF file', () => {
    const lf = 'Time,"A","B"\n0.000,1,2\n0.030,3,4\n'

    expect(parseLogText(lf.split('\n').join('\r'))).toEqual(parseLogText(lf))
  })

  it('does not support a quoted cell that spans lines (documented limit, no label does)', () => {
    const dataset = parseLogText('Time,"A\nB"\n0,1\n')

    expect(dataset.columns.map((column) => column.name)).not.toEqual(['A\nB'])
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

  it('maps non-finite cells to NaN: Infinity, -Infinity, an overflowing exponent and NaN', () => {
    const dataset = parseLogText('Time,"A"\n0,Infinity\n1,-Infinity\n2,1e999\n3,NaN\n')
    const values = dataset.columns[0]!.values

    expect(values).toHaveLength(4)
    expect(Array.from(values).every(Number.isNaN)).toBe(true)
  })

  it('maps hex, binary, octal and other non-decimal notations to NaN, not to a number', () => {
    const dataset = parseLogText('Time,"A"\n0,0x10\n1,0b11\n2,0o7\n3,1_0\n4,12abc\n5,--1\n')

    expect(Array.from(dataset.columns[0]!.values).every(Number.isNaN)).toBe(true)
  })

  it('still reads padded and signed decimals and exponents', () => {
    const dataset = parseLogText('Time,"A"\n0, 5 \n1,+2.5\n2,-.5\n3,7.\n4,1E2\n')

    expect(Array.from(dataset.columns[0]!.values)).toEqual([5, 2.5, -0.5, 7, 100])
  })
})

describe('parseLogText: the dataset contract at its edges', () => {
  it('passes NaN, repeated and backwards Time values through unvalidated', () => {
    const dataset = parseLogText('Time,"A"\nx,1\n5,2\n1,3\n1,4\n')

    expect(dataset.time[0]).toBeNaN()
    expect(Array.from(dataset.time.slice(1))).toEqual([5, 1, 1])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([1, 2, 3, 4])
  })

  it('keeps an empty header label as a column named empty string', () => {
    const dataset = parseLogText('Time,"A",\n0,1,2\n')

    expect(dataset.columns.map((column) => column.name)).toEqual(['A', ''])
    expect(Array.from(dataset.columns[1]!.values)).toEqual([2])
  })

  it('gives no columns but all the rows for a header with only Time', () => {
    const dataset = parseLogText('Time\n0\n1\n')

    expect(dataset.columns).toEqual([])
    expect(Array.from(dataset.time)).toEqual([0, 1])
  })

  it('keeps a second Time column as a plain series', () => {
    const dataset = parseLogText('Time,"A",Time\n0,1,2\n')

    expect(dataset.columns.map((column) => column.name)).toEqual(['A', 'Time'])
    expect(Array.from(dataset.columns[1]!.values)).toEqual([2])
  })

  it('keeps the error code read-only', () => {
    const error = new LogParseError('empty', 'x')

    expect(() => {
      // @ts-expect-error code is readonly
      error.code = 'missing-time'
    }).not.toThrow()
    expect(error.name).toBe('LogParseError')
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
    const column = dataset.columns.find(
      (candidate) => candidate.name === 'Factor from lambda control adaptation for bank 1',
    )

    expect(column?.values[0]).toBe(1.03)
  })

  it('keeps non-zero first samples: Target Rail Pressure is 90.50 in row 0', () => {
    const dataset = parseLogText(loadFixtureText('trimmed_2026-10-24_12-29-08.csv'))
    const column = dataset.columns.find((candidate) => candidate.name === 'Target Rail Pressure')

    expect(column?.values[0]).toBe(90.5)
  })
})

describe('every log in Example/', () => {
  // Data rows and parameter columns of each log, counted from the files themselves
  // (line count minus the header; header labels minus Time), not derived by the parser.
  const expected: [name: string, rows: number, columns: number][] = [
    ['2026-09-06_09-23-14.csv', 29244, 12],
    ['2026-09-06_10-09-49.csv', 15128, 12],
    ['2026-10-24_12-29-08 2.csv', 23112, 9],
    ['2026-10-24_12-29-08.csv', 23112, 9],
    ['2026-10-25_09-33-22.csv', 51019, 11],
    ['2026-11-14_10-12-17.csv', 14570, 13],
  ]

  it.each(expected)(
    '%s parses to %i rows and %i parameter columns, all finite',
    (name, rows, count) => {
      const dataset = parseLogText(decode(loadExampleBytes(name)))

      expect(dataset.time.length).toBe(rows)
      expect(dataset.columns).toHaveLength(count)
      expect(dataset.time[0]).toBe(0)
      expect(dataset.time.at(-1)).toBeGreaterThan(0)
      for (const column of dataset.columns) {
        expect(column.values.length).toBe(rows)
        expect(column.values.every(Number.isFinite), column.name).toBe(true)
      }
    },
  )

  it('treats the byte-identical duplicate log identically', () => {
    const a = parseLogText(decode(loadExampleBytes('2026-10-24_12-29-08.csv')))
    const b = parseLogText(decode(loadExampleBytes('2026-10-24_12-29-08 2.csv')))

    expect(b).toEqual(a)
  })
})
