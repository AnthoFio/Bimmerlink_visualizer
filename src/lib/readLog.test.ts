import { describe, expect, it } from 'vitest'
import { exampleLogNames, loadExampleBytes, loadFixtureText } from '../test/fixtures.ts'
import { describeLoadFailure, LogLoadError, readLog } from './readLog.ts'
import type { LoadErrorCode } from './readLog.ts'

const failure = (text: string) => {
  try {
    readLog(text)
  } catch (error) {
    return error as LogLoadError
  }
  throw new Error('expected readLog to fail')
}

const FAILURES: [LoadErrorCode, string, RegExp][] = [
  ['not-csv', 'hello world\nsecond line\n', /does not look like a CSV/],
  ['empty', '', /file is empty/],
  ['header-only', loadFixtureText('header-only.csv'), /header but no data rows/],
  ['missing-time', loadFixtureText('missing-time.csv'), /"Time" column/],
  ['no-channels', 'Time\n0.000\n', /no parameter columns/],
  ['no-numeric-data', 'Time,"A"\n0.000,abc\n0.030,\n', /no numeric data/],
]

describe('readLog errors', () => {
  it.each(FAILURES)('reports %s', (code, text, message) => {
    const error = failure(text)

    expect(error).toBeInstanceOf(LogLoadError)
    expect(error.code).toBe(code)
    expect(error.message).toMatch(message)
  })

  it('has a different message for every problem', () => {
    const messages = FAILURES.map(([, text]) => failure(text).message)

    expect(new Set(messages).size).toBe(FAILURES.length)
  })

  it.each([
    ['binary content', 'PK\u0003\u0004\u0000\u0000,\n'],
    ['HTML', '<!doctype html>\n<p>a, b</p>'],
    ['semicolon separators', 'Time;"A"\n0;1\n'],
  ])('calls %s not CSV', (_name, text) => {
    expect(failure(text).code).toBe('not-csv')
  })

  it('treats a blank file and a file without any valid time as unusable', () => {
    expect(failure('\n \n').code).toBe('empty')
    expect(failure('Time,"A"\nx,1\ny,2\n').code).toBe('no-numeric-data')
  })

  it('never shows a technical message for an unexpected failure', () => {
    expect(describeLoadFailure(new TypeError('x is undefined'))).toMatch(/could not be read/)
    expect(describeLoadFailure(failure(''))).toMatch(/empty/)
  })
})

describe('readLog warnings', () => {
  it('tolerates and counts a non-numeric cell', () => {
    const { dataset, warnings } = readLog(loadFixtureText('non-numeric-cell.csv'))

    expect(dataset.columns[0]?.values[2]).toBeNaN()
    expect(warnings).toEqual([
      { code: 'bad-cells', count: 1, message: expect.stringContaining('1 cell') },
    ])
  })

  it('counts blank cells and the cells of short rows', () => {
    const { warnings } = readLog('Time,"A","B"\n0,1,\n1,2\n2,3,4\n')

    expect(warnings[0]).toMatchObject({ code: 'bad-cells', count: 2 })
  })

  it('reports duplicate column names, ignoring case, and keeps every column', () => {
    const { dataset, warnings } = readLog(loadFixtureText('duplicate-columns.csv'))

    expect(dataset.columns).toHaveLength(4)
    expect(warnings[0]).toMatchObject({ code: 'duplicate-names', count: 2 })
    expect(warnings[0]?.message).toContain('Engine speed')
    expect(warnings[0]?.message).toContain('Oil Temperature')
  })

  it('reports time that goes backwards and sorts each row as a whole', () => {
    const { dataset, warnings } = readLog('Time,"A"\n0,10\n2,30\n1,20\n3,40\n')

    expect(warnings).toMatchObject([{ code: 'time-order', count: 1 }])
    expect(Array.from(dataset.time)).toEqual([0, 1, 2, 3])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([10, 20, 30, 40])
  })

  it('reports and leaves out rows without a valid time', () => {
    const { dataset, warnings } = readLog('Time,"A"\n0,10\nx,20\n2,30\n')

    expect(warnings).toMatchObject([{ code: 'bad-time', count: 1 }])
    expect(Array.from(dataset.time)).toEqual([0, 2])
    expect(Array.from(dataset.columns[0]!.values)).toEqual([10, 30])
  })

  it('allows a repeated time', () => {
    expect(readLog('Time,"A"\n0,1\n0,2\n1,3\n').warnings).toEqual([])
  })

  it.each(exampleLogNames)('accepts %s without a warning', (name) => {
    expect(readLog(new TextDecoder().decode(loadExampleBytes(name))).warnings).toEqual([])
  })
})
