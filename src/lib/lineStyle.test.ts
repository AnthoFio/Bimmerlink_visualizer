import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { describeChannels } from './channels.ts'
import { isStepped } from './lineStyle.ts'

const channels = describeChannels(
  parameters.map((parameter) => parameter.label),
  parameters,
)
const byKey = (key: string) => channels.find((channel) => channel.key === key)!

describe('isStepped', () => {
  it('steps flags and counters by default', () => {
    const discrete = channels.filter((c) => c.role === 'flag' || c.role === 'counter')

    expect(discrete).toHaveLength(19)
    expect(discrete.every((channel) => isStepped(channel, 'auto'))).toBe(true)
  })

  it('steps the gear, and only the gear, of the other roles', () => {
    const stepped = channels
      .filter((c) => c.role !== 'flag' && c.role !== 'counter' && isStepped(c, 'auto'))
      .map((channel) => channel.key)

    expect(stepped).toEqual(
      expect.arrayContaining(['actual_gear', 'actual_gear_information_from_the_gear_sensor']),
    )
    expect(stepped).toHaveLength(2)
  })

  it('draws the rest, unknown columns included, as lines', () => {
    expect(isStepped(byKey('engine_speed'), 'auto')).toBe(false)
    expect(isStepped(describeChannels(['Anything'], parameters)[0]!, 'auto')).toBe(false)
  })

  it('follows the choice of the chart', () => {
    expect(isStepped(byKey('engine_speed'), 'step')).toBe(true)
    expect(isStepped(byKey('actual_gear'), 'linear')).toBe(false)
  })
})
