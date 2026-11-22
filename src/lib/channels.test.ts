import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { loadExampleBytes } from '../test/fixtures.ts'
import { describeChannels, normaliseLabel } from './channels.ts'
import { parseLogText } from './parseLog.ts'

// Literal on purpose: this is the documented split of docs/catalog-matching.md.
const EXPECTED: [file: string, matched: number, unmatched: string[]][] = [
  ['2026-09-06_09-23-14.csv', 12, []],
  ['2026-09-06_10-09-49.csv', 12, []],
  ['2026-10-24_12-29-08 2.csv', 8, ['Target Rail Pressure']],
  ['2026-10-24_12-29-08.csv', 8, ['Target Rail Pressure']],
  ['2026-10-25_09-33-22.csv', 10, ['Target Rail Pressure']],
  ['2026-11-14_10-12-17.csv', 12, ['Target Rail Pressure']],
]

const describeNames = (...names: string[]) => describeChannels(names, parameters)

describe('normaliseLabel', () => {
  it('ignores case, whitespace and punctuation', () => {
    expect(normaliseLabel('Engine speed')).toBe(normaliseLabel('Engine Speed'))
    expect(normaliseLabel(' Boost   pressure\t')).toBe('boost pressure')
    expect(normaliseLabel('Rail-pressure (abs.)')).toBe('rail pressure abs')
  })

  it('keeps letters that are not ASCII', () => {
    expect(normaliseLabel('Öltemperatur')).toBe('öltemperatur')
    expect(normaliseLabel('λ')).not.toBe(normaliseLabel('µ'))
  })
})

describe('describeChannels', () => {
  it.each(EXPECTED)('splits %s into %i matched and %j', (file, matched, unmatched) => {
    const names = parseLogText(new TextDecoder().decode(loadExampleBytes(file))).columns.map(
      (column) => column.name,
    )
    const channels = describeNames(...names)

    expect(channels.filter((channel) => channel.matched)).toHaveLength(matched)
    expect(channels.filter((channel) => !channel.matched).map((c) => c.name)).toEqual(unmatched)
  })

  it('gives a match its unit, category, description, role and confidence', () => {
    expect(describeNames('ENGINE  SPEED')[0]).toMatchObject({
      name: 'ENGINE  SPEED',
      matched: true,
      key: 'engine_speed',
      unit: 'rpm',
      category: 'Engine status',
      role: 'core',
    })
  })

  it('gives an unmatched column the category Other and no unit', () => {
    expect(describeNames('Target Rail Pressure')[0]).toMatchObject({
      matched: false,
      category: 'Other',
      unit: undefined,
      role: undefined,
      presets: [],
    })
  })

  it('matches by label, not by position', () => {
    const forwards = describeNames('Engine speed', 'Oil temperature')
    const backwards = describeNames('Oil temperature', 'Engine speed')

    expect(backwards.map((channel) => channel.key)).toEqual(
      forwards.map((channel) => channel.key).reverse(),
    )
    expect(backwards.map((channel) => channel.id)).toEqual(
      forwards.map((channel) => channel.id).reverse(),
    )
  })

  it('gives the two copies of a duplicated catalog label their own entries', () => {
    const label = 'Number of dense EVAP systems recognized by diagnosis'

    expect(describeNames(label, label).map((channel) => channel.key)).toEqual([
      'number_of_dense_evap_systems_recognized_by_diagnosis',
      'number_of_dense_evap_systems_recognized_by_diagnosis_2',
    ])
  })

  it('prefers the exact label where two labels differ only in punctuation', () => {
    const [channel] = describeNames('Target value for throttle valve angle, based on lower stop')

    expect(channel?.role).toBe('standard')
  })

  it('gives duplicate and empty labels distinct ids and names', () => {
    const channels = describeNames('Oil Temperature', 'oil temperature', '', '')

    expect(channels.map((channel) => channel.name)).toEqual([
      'Oil Temperature',
      'oil temperature (2)',
      'Unnamed column',
      'Unnamed column (2)',
    ])
    expect(new Set(channels.map((channel) => channel.id)).size).toBe(4)
  })

  it('never repeats an id, even when a label looks like a numbered copy', () => {
    const ids = describeNames('A', 'A (2)', 'A', '__proto__', 'constructor').map((c) => c.id)

    expect(new Set(ids).size).toBe(5)
  })

  it('keeps the id when only the casing of a label changes', () => {
    expect(describeNames('Engine Speed')[0]?.id).toBe(describeNames('Engine speed')[0]?.id)
  })

  it('handles every label of the catalog', () => {
    const channels = describeNames(...parameters.map((parameter) => parameter.label))

    expect(channels.map((channel) => channel.key)).toEqual(parameters.map((p) => p.key))
  })
})
