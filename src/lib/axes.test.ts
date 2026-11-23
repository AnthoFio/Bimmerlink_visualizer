import { describe, expect, it } from 'vitest'
import { axisGutters, layoutAxes } from './axes.ts'
import type { AxisChoice } from './axes.ts'
import { autoRange, extent } from './yRange.ts'

const series = (...units: (string | undefined)[]) =>
  units.map((unit, i) => ({ id: `s${i}`, name: `Series ${i}`, unit, colour: `#00000${i}` }))

describe('layoutAxes', () => {
  it('lets series that share a unit share an axis', () => {
    const axes = layoutAxes(series('bar', 'rpm', 'bar'))

    expect(axes).toHaveLength(2)
    expect(axes[0]).toMatchObject({ title: 'bar', members: ['s0', 's2'] })
    expect(axes[1]).toMatchObject({ title: 'rpm', members: ['s1'] })
  })

  it('puts different units left and right, two per side, and stacks the rest', () => {
    const axes = layoutAxes(series('a', 'b', 'c', 'd', 'e', 'f'))

    expect(axes.map((axis) => [axis.side, axis.visible])).toEqual([
      ['left', true],
      ['right', true],
      ['left', true],
      ['right', true],
      ['left', false],
      ['right', false],
    ])
  })

  it('colours an axis like its series only when a single series uses it', () => {
    const [shared, single] = layoutAxes(series('bar', 'bar', 'rpm'))

    expect(shared!.colour).toBeUndefined()
    expect(single!.colour).toBe('#000002')
  })

  it('gives every channel of unknown unit an axis of its own', () => {
    const axes = layoutAxes(series(undefined, undefined))

    expect(axes.map((axis) => axis.title)).toEqual([
      'Series 0 (unit unknown)',
      'Series 1 (unit unknown)',
    ])
    expect(new Set(axes.map((axis) => axis.key)).size).toBe(2)
  })

  it('reserves the widest gutters of all panels, so their plot areas line up', () => {
    expect(axisGutters([layoutAxes(series('a')), layoutAxes(series('a', 'b', 'c'))])).toEqual({
      left: 2,
      right: 1,
    })
  })
})

describe('y range', () => {
  it('finds the extent and skips gaps', () => {
    expect(extent(Float64Array.from([NaN, 3, -1, NaN, 9, 4]))).toEqual([-1, 9])
    expect(extent(Float64Array.from([NaN]))).toBeUndefined()
  })

  it('covers all series of an axis with 5% padding', () => {
    const [min, max] = autoRange([
      [0, 50],
      [20, 100],
    ])

    expect(min).toBeCloseTo(-5)
    expect(max).toBeCloseTo(105)
  })

  it('opens up a flat or empty range', () => {
    expect(autoRange([])).toEqual([0, 1])
    expect(autoRange([[0, 0]])).toEqual([-1, 1])
    const [min, max] = autoRange([[200, 200]])
    expect(min).toBeLessThan(200)
    expect(max).toBeGreaterThan(200)
  })
})

describe('chosen axes', () => {
  const choose = (choices: (AxisChoice | undefined)[], ...units: string[]) =>
    layoutAxes(series(...units).map((member, i) => ({ ...member, choice: choices[i] })))

  it('joins the main left or right axis', () => {
    const [left, right] = choose([undefined, undefined, 'left'], 'bar', 'rpm', '%')
    expect(left).toMatchObject({ members: ['s0', 's2'], title: 'bar / %', side: 'left' })
    expect(right!.members).toEqual(['s1'])

    expect(choose([undefined, undefined, 'right'], 'bar', 'rpm', '%')[1]!.members).toEqual([
      's1',
      's2',
    ])
  })

  it('puts a lone series on the right', () => {
    const shown = choose(['right'], 'rpm').filter((axis) => axis.visible)

    expect(shown).toHaveLength(1)
    expect(shown[0]).toMatchObject({ side: 'right', members: ['s0'] })
  })

  it('opens a new axis', () => {
    const axes = choose([undefined, 'new'], 'rpm', 'rpm')

    expect(axes).toHaveLength(2)
    expect(axes[1]!.members).toEqual(['s1'])
  })
})
