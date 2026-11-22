import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { describeChannels } from './channels.ts'
import { applyPreset, PRESETS } from './presets.ts'

const preset = (name: string) => PRESETS.find((candidate) => candidate.name === name)!
const channels = describeChannels(
  [
    'Engine speed',
    'Oil Temperature',
    'Misfire Detection Counter Cylinder 1',
    'Target Rail Pressure',
  ],
  parameters,
)

describe('presets', () => {
  it('come from the catalog presets field and from categories and roles', () => {
    expect(PRESETS.map((candidate) => candidate.name)).toEqual([
      'Log preset 1',
      'Log preset 1b',
      'Log preset 2',
      'Log preset 3',
      'Log preset 4',
      'Log preset 5',
      'Log preset 6',
      'Core only',
      'Knock',
      'Misfire',
      'Fuel & lambda',
    ])
    expect(preset('Core only').keys).toHaveLength(49)
    expect(preset('Misfire').keys).toHaveLength(13)
    expect(preset('Log preset 1').keys).toEqual(
      parameters.filter((p) => p.presets.includes('1')).map((p) => p.key),
    )
  })

  it('apply only the parameters that are in the log, and count the missing ones', () => {
    const result = applyPreset(preset('Misfire'), channels)

    expect(result.ids).toEqual([channels[2]!.id])
    expect(result).toMatchObject({ found: 1, missing: 12 })
  })

  it('ignore columns that are not in the catalog', () => {
    expect(applyPreset(preset('Core only'), channels).ids).not.toContain(channels[3]!.id)
  })
})
