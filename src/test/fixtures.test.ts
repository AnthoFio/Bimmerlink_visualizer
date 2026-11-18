// @vitest-environment node
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  exampleDir,
  fixturesDir,
  loadExampleBytes,
  loadFixtureBytes,
  loadFixtureText,
} from './fixtures'

const MAX_ROWS = 200
const CR = 0x0d
const LF = 0x0a
const BOM = [0xef, 0xbb, 0xbf]
const DUPLICATE = '2026-10-24_12-29-08 2.csv'

/** [example log, trimmed fixture, number of parameter columns (without Time)]. */
const trimmed = [
  ['2026-09-06_09-23-14.csv', 'trimmed_2026-09-06_09-23-14.csv', 12],
  ['2026-09-06_10-09-49.csv', 'trimmed_2026-09-06_10-09-49.csv', 12],
  ['2026-10-24_12-29-08.csv', 'trimmed_2026-10-24_12-29-08.csv', 9],
  ['2026-10-25_09-33-22.csv', 'trimmed_2026-10-25_09-33-22.csv', 11],
  ['2026-11-14_10-12-17.csv', 'trimmed_2026-11-14_10-12-17.csv', 13],
] as const

const edgeCases = [
  'empty.csv',
  'header-only.csv',
  'missing-time.csv',
  'non-numeric-cell.csv',
  'duplicate-columns.csv',
  'crlf.csv',
  'bom.csv',
]

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const count = (bytes: Uint8Array, byte: number) => bytes.filter((b) => b === byte).length
const startsWith = (bytes: Uint8Array, prefix: ArrayLike<number>) =>
  prefix.length <= bytes.length && Array.from(prefix).every((b, i) => bytes[i] === b)
const utf8 = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

/** Non-empty lines of an LF/CRLF text. */
const linesOf = (text: string) => text.split(/\r?\n/).filter((l) => l !== '')
const dataRowCount = (text: string) => Math.max(linesOf(text).length - 1, 0)
/** Naive comma split: no fixture label contains a comma. */
const columnsOf = (text: string) => (linesOf(text.replace(/^\uFEFF/, ''))[0] ?? '').split(',')
const unquote = (s: string) => s.replace(/^"|"$/g, '')

describe('fixture directory', () => {
  it('contains exactly the documented files plus the README', () => {
    const documented = [...trimmed.map(([, f]) => f), ...edgeCases, 'README.md'].sort()
    expect(readdirSync(fixturesDir).sort()).toEqual(documented)
  })

  it('mentions every fixture and the duplicate log in the README', () => {
    const readme = loadFixtureText('README.md')
    for (const name of [...trimmed.map(([, f]) => f), ...edgeCases, DUPLICATE]) {
      expect(readme, `README must mention ${name}`).toContain(name)
    }
  })
})

describe('trimmed fixtures from the example logs', () => {
  it.each(trimmed)('%s -> %s is a byte-exact prefix cut on a line boundary', (example, fixture) => {
    const bytes = loadFixtureBytes(fixture)
    expect(startsWith(loadExampleBytes(example), bytes)).toBe(true)
    expect(bytes.at(-1)).toBe(LF)
  })

  it.each(trimmed)(
    '%s -> %s: <= 200 rows, real header, LF only, no BOM',
    (_ex, fixture, params) => {
      const bytes = loadFixtureBytes(fixture)
      const text = loadFixtureText(fixture)
      const rows = dataRowCount(text)
      expect(rows).toBeGreaterThan(100)
      expect(rows).toBeLessThanOrEqual(MAX_ROWS)

      const columns = columnsOf(text)
      expect(columns[0]).toBe('Time')
      expect(columns).toHaveLength(params + 1)
      expect(columns.slice(1).every((c) => /^".+"$/.test(c))).toBe(true)

      expect(count(bytes, CR)).toBe(0)
      expect(startsWith(bytes, BOM)).toBe(false)
      for (const line of linesOf(text)) expect(line.split(',')).toHaveLength(params + 1)
    },
  )

  it.each(trimmed)(
    '%s -> %s keeps the ramp-up (time starts at 0, some channels start at 0, more are active at the end)',
    (_ex, fixture) => {
      const rows = linesOf(loadFixtureText(fixture))
        .slice(1)
        .map((l) => l.split(',').map(Number))
      const nonZero = (row: number[]) => row.slice(1).filter((v) => v !== 0).length
      const first = rows[0] ?? []
      const last = rows.at(-1) ?? []
      expect(first[0]).toBe(0) // Time starts at 0.000
      expect(first.slice(1).some((v) => v === 0)).toBe(true)
      expect(nonZero(last)).toBeGreaterThan(nonZero(first))
    },
  )

  it('preserves the label casing difference between logs', () => {
    const labels = (f: string) => columnsOf(loadFixtureText(f)).map(unquote)
    expect(labels('trimmed_2026-09-06_09-23-14.csv')).toContain('Engine speed')
    expect(labels('trimmed_2026-10-25_09-33-22.csv')).toContain('Engine Speed')
  })
})

describe('edge-case fixtures', () => {
  it('empty.csv is 0 bytes', () => {
    expect(loadFixtureBytes('empty.csv')).toHaveLength(0)
  })

  it('header-only.csv is the real header plus a line break and no data rows', () => {
    const text = loadFixtureText('header-only.csv')
    expect(text.endsWith('\n')).toBe(true)
    expect(text.split('\n')).toHaveLength(2)
    expect(dataRowCount(text)).toBe(0)
    expect(columnsOf(text)[0]).toBe('Time')
    expect(columnsOf(text)).toHaveLength(10)
  })

  it('missing-time.csv has no Time column but has data rows', () => {
    const text = loadFixtureText('missing-time.csv')
    const columns = columnsOf(text).map((c) => unquote(c).toLowerCase())
    expect(columns).not.toContain('time')
    expect(dataRowCount(text)).toBeGreaterThan(0)
  })

  it('non-numeric-cell.csv has exactly one non-numeric data cell', () => {
    const rows = linesOf(loadFixtureText('non-numeric-cell.csv'))
      .slice(1)
      .map((l) => l.split(','))
    expect(rows.flat().filter((c) => Number.isNaN(Number(c)))).toEqual(['abc'])
  })

  it('duplicate-columns.csv has an exact and a case-insensitive duplicate label', () => {
    const columns = columnsOf(loadFixtureText('duplicate-columns.csv')).map(unquote)
    expect(columns.filter((c) => c === 'Oil Temperature')).toHaveLength(2)
    expect(columns).toContain('Engine speed')
    expect(columns).toContain('Engine Speed')
    expect(columns.filter((c) => c.toLowerCase() === 'engine speed')).toHaveLength(2)
  })

  it('crlf.csv uses CRLF for every line break and has no bare LF or CR', () => {
    const bytes = loadFixtureBytes('crlf.csv')
    const crs = count(bytes, CR)
    expect(crs).toBeGreaterThan(1)
    expect(count(bytes, LF)).toBe(crs)
    bytes.forEach((b, i) => {
      if (b === LF) expect(bytes[i - 1]).toBe(CR)
      if (b === CR) expect(bytes[i + 1]).toBe(LF)
    })
    expect(startsWith(bytes, BOM)).toBe(false)
  })

  it('crlf.csv carries the same content as the LF log it was derived from', () => {
    const lf = utf8(loadExampleBytes('2026-10-24_12-29-08.csv'))
    expect(lf.startsWith(loadFixtureText('crlf.csv').replaceAll('\r\n', '\n'))).toBe(true)
  })

  it('bom.csv is EF BB BF followed by an LF-only slice of a real log', () => {
    const bytes = loadFixtureBytes('bom.csv')
    expect(startsWith(bytes, BOM)).toBe(true)
    expect(count(bytes, CR)).toBe(0)
    expect(loadFixtureText('bom.csv').startsWith('\uFEFFTime,')).toBe(true)
    expect(startsWith(loadExampleBytes('2026-10-24_12-29-08.csv'), bytes.slice(3))).toBe(true)
  })

  it('all other edge cases are LF-only and BOM-free', () => {
    for (const name of edgeCases.filter((n) => n !== 'crlf.csv' && n !== 'bom.csv')) {
      const bytes = loadFixtureBytes(name)
      expect(count(bytes, CR), name).toBe(0)
      expect(startsWith(bytes, BOM), name).toBe(false)
    }
  })
})

describe('full Example/ logs', () => {
  const files = readdirSync(exampleDir)
    .filter((f) => f.endsWith('.csv'))
    .sort()

  it('are all present', () => {
    expect(files).toEqual([
      '2026-09-06_09-23-14.csv',
      '2026-09-06_10-09-49.csv',
      '2026-10-24_12-29-08 2.csv',
      '2026-10-24_12-29-08.csv',
      '2026-10-25_09-33-22.csv',
      '2026-11-14_10-12-17.csv',
    ])
  })

  it('are full-size (14k+ rows) so they stay usable for e2e and perf tests', () => {
    for (const [example] of trimmed) {
      expect(dataRowCount(utf8(loadExampleBytes(example)))).toBeGreaterThan(14_000)
    }
  })

  it(`"${DUPLICATE}" is a byte-identical duplicate of "2026-10-24_12-29-08.csv"`, () => {
    const original = loadExampleBytes('2026-10-24_12-29-08.csv')
    const duplicate = loadExampleBytes(DUPLICATE)
    expect(duplicate.length).toBe(original.length)
    expect(sha256(duplicate)).toBe(sha256(original))
  })

  it('every other log is distinct', () => {
    const hashes = files.filter((f) => f !== DUPLICATE).map((f) => sha256(loadExampleBytes(f)))
    expect(new Set(hashes).size).toBe(5)
  })
})
