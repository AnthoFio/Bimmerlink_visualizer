import { describe, expect, it } from 'vitest'
import { loadFixtureText } from '../test/fixtures.ts'
import { exportCsv } from './csvExport.ts'
import { parseLogText } from './parseLog.ts'

const log = parseLogText(loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
const column = (name: string) => log.columns.find((candidate) => candidate.name === name)!

describe('exportCsv', () => {
  it('writes the BimmerLink format: Time, then quoted labels, LF', async () => {
    const parts = await exportCsv(log.time, [column('Engine Speed'), column('Oil Temperature')], {
      min: 1,
      max: 1.5,
    })
    const text = parts.join('')
    const [header, first] = text.split('\n')

    expect(header).toBe('Time,"Engine Speed","Oil Temperature"')
    expect(first).toMatch(/^1\.\d{3},[^,]*,[^,]*$/)
    expect(text.endsWith('\n')).toBe(true)
    expect(text).not.toContain('\r')
  })

  it('has only the selected columns and the visible window, and reads back the same', async () => {
    const window = { min: 2, max: 3 }
    const chosen = [column('Engine Speed'), column('Target Rail Pressure')]
    const back = parseLogText((await exportCsv(log.time, chosen, window)).join(''))

    const rows = Array.from(log.time.entries()).filter(([, t]) => t >= 2 && t <= 3)
    expect(Array.from(back.time)).toEqual(rows.map(([, t]) => t))
    expect(back.columns.map((c) => c.name)).toEqual(['Engine Speed', 'Target Rail Pressure'])
    expect(Array.from(back.columns[1]!.values)).toEqual(rows.map(([row]) => chosen[1]!.values[row]))
  })

  it('writes a gap as an empty cell and escapes quotes in labels', async () => {
    const time = Float64Array.of(0, 1)
    const values = Float64Array.of(NaN, 2)
    const text = (await exportCsv(time, [{ name: 'Say "hi"', values }], { min: 0, max: 1 })).join(
      '',
    )

    expect(text).toBe('Time,"Say ""hi"""\n0.000,\n1.000,2\n')
  })

  it('lets the page work between chunks of a large export', async () => {
    const n = 60_000
    const time = Float64Array.from({ length: n }, (_, i) => i * 0.03)
    const values = Float64Array.from({ length: n }, (_, i) => i)
    let ticks = 0
    const timer = setInterval(() => ticks++, 0)
    const parts = await exportCsv(time, [{ name: 'A', values }], { min: 0, max: n })
    clearInterval(timer)

    expect(ticks).toBeGreaterThan(3)
    expect(parts.join('').split('\n')).toHaveLength(n + 2)
  })
})
