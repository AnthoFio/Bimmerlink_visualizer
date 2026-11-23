import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { exampleLogNames, loadExampleBytes } from '../test/fixtures.ts'
import { describeChannels } from './channels.ts'
import { defaultSelection, isHiddenByDefault } from './defaults.ts'
import { parseLogText } from './parseLog.ts'

const channelsOf = (labels: string[]) => describeChannels(labels, parameters)
const exampleChannels = (file: string) =>
  channelsOf(
    parseLogText(new TextDecoder().decode(loadExampleBytes(file))).columns.map((c) => c.name),
  )

describe('defaultSelection', () => {
  it.each(exampleLogNames)('pre-selects at most 6 core channels of %s', (file) => {
    const channels = exampleChannels(file)
    const selected = defaultSelection(channels)

    const core = channels.filter((channel) => channel.role === 'core')
    expect(selected).toHaveLength(Math.min(6, core.length))
    for (const id of selected) {
      expect(core.map((channel) => channel.id)).toContain(id)
    }
  })

  // The exact picks of three logs, so that a change of the rule is a visible decision.
  it.each([
    [
      '2026-09-06_09-23-14.csv',
      [
        'engine speed',
        'actual ignition angle',
        'intake air temperature',
        'boost pressure',
        'normalized accelerator pedal angle',
        'target ignition angle from torque intervention',
      ],
    ],
    [
      '2026-10-24_12-29-08.csv',
      [
        'misfire detection counter cylinder 1',
        'filtered rail pressure actual value (absolute pressure)',
        'oil temperature',
        'misfire detection counter cylinder 2',
        'misfire detection counter cylinder 3',
        'misfire detection counter cylinder 4',
      ],
    ],
    [
      '2026-10-25_09-33-22.csv',
      [
        'misfire detection counter cylinder 1',
        'filtered rail pressure actual value (absolute pressure)',
        'oil temperature',
        'engine speed',
        'misfire detection counter cylinder 2',
        'normalized accelerator pedal angle',
      ],
    ],
  ])('spreads the picks of %s over the categories', (file, expected) => {
    expect([...defaultSelection(exampleChannels(file))].sort()).toEqual([...expected].sort())
  })

  it('falls back to the first 6 columns when none is core', () => {
    const channels = channelsOf(['A', 'B', 'C', 'D', 'E', 'F', 'G'])

    expect(defaultSelection(channels)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })
})

describe('isHiddenByDefault', () => {
  it('hides exactly the redundant, static and broken channels', () => {
    const hidden = new Set(
      channelsOf(parameters.map((parameter) => parameter.label))
        .filter(isHiddenByDefault)
        .map((channel) => channel.role),
    )

    expect([...hidden].sort()).toEqual(['broken', 'redundant', 'static'])
    expect(isHiddenByDefault(channelsOf(['Unknown label'])[0]!)).toBe(false)
  })
})
