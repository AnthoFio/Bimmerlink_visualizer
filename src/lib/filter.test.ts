import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { describeChannels } from './channels.ts'
import { filterChannels, isFiltering, NO_FILTER } from './filter.ts'

const channels = describeChannels(
  [...parameters.map((parameter) => parameter.label), 'Target Rail Pressure'],
  parameters,
)
const find = (change: Partial<typeof NO_FILTER>) =>
  filterChannels(channels, { ...NO_FILTER, ...change })

describe('filterChannels', () => {
  it('searches the label, ignoring case', () => {
    const found = find({ query: 'eNgInE sPeEd' })

    expect(found.map((channel) => channel.key)).toContain('engine_speed')
    expect(found.every((channel) => /engine.speed/i.test(`${channel.name} ${channel.key}`))).toBe(
      true,
    )
  })

  it('searches the key', () => {
    expect(find({ query: 'actual_gear' }).map((channel) => channel.key)).toContain('actual_gear')
  })

  it('searches any substring, with surrounding spaces ignored', () => {
    expect(find({ query: ' knock ' }).length).toBeGreaterThan(5)
    expect(find({ query: 'no such channel' })).toEqual([])
  })

  it('filters by category, unit and role', () => {
    expect(find({ category: 'Boost' })).toHaveLength(9)
    expect(find({ unit: 'rpm' })).toHaveLength(7)
    expect(find({ role: 'core' })).toHaveLength(49)
    expect(find({ unit: 'unit unknown' }).map((c) => c.name)).toEqual(['Target Rail Pressure'])
  })

  it('combines the filters with AND', () => {
    const found = find({ category: 'Boost', unit: 'hPa', role: 'core', query: 'pressure' })

    expect(found.length).toBeGreaterThan(0)
    for (const channel of found) {
      expect(channel).toMatchObject({ category: 'Boost', unit: 'hPa', role: 'core' })
      expect(channel.name.toLowerCase()).toContain('pressure')
    }
    expect(find({ category: 'Boost', unit: 'rpm' })).toEqual([])
  })

  it('knows when it is filtering', () => {
    expect(isFiltering(NO_FILTER)).toBe(false)
    expect(isFiltering({ ...NO_FILTER, query: '  ' })).toBe(false)
    expect(isFiltering({ ...NO_FILTER, role: 'core' })).toBe(true)
  })
})
