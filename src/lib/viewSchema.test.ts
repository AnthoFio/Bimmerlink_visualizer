import { describe, expect, it } from 'vitest'
import {
  addPanel,
  assignPanel,
  defaultView,
  PANEL_HEIGHT,
  setAxisRange,
  updatePanel,
  updateSeries,
} from './view.ts'
import { layoutKey, readView } from './viewSchema.ts'

const ids = ['engine speed', 'oil temperature', 'boost pressure']
const custom = (() => {
  let view = addPanel(defaultView(['engine speed']))
  const second = view.panels[1]!.id
  view = assignPanel(view, 'oil temperature', second)
  view = updatePanel(view, second, {
    lines: 'step',
    fit: 'all',
    normalise: 'window',
    synced: false,
  })
  view = updateSeries(view, 'engine speed', { colour: '#123456', axis: 'right', hidden: true })
  return setAxisRange(view, second, 'unit:°C', [20, 120])
})()

describe('readView', () => {
  it('reads back what it was given', () => {
    expect(readView(JSON.parse(JSON.stringify(custom)), ids)).toEqual({
      view: custom,
      skipped: [],
    })
  })

  it('restores only parameters present in the log and reports the others', () => {
    const { view, skipped } = readView(custom, ['engine speed'])!

    expect(view.selected).toEqual(['engine speed'])
    expect(Object.keys(view.series)).toEqual(['engine speed'])
    expect(skipped).toEqual(['oil temperature'])
  })

  it.each([null, 'view', [], {}, { trim: 'yes' }, { ...custom, panels: [] }])(
    'rejects %j',
    (value) => {
      expect(readView(value, ids)).toBeUndefined()
    },
  )

  it('drops what it does not understand and keeps the rest', () => {
    const odd = {
      ...custom,
      panels: [...custom.panels, { id: 7 }],
      series: { ...custom.series, 'boost pressure': { colour: 'red', axis: 'up', hidden: 1 } },
      axes: [...custom.axes, { panel: 'p1', key: 'k', min: 5, max: 1 }],
      extra: true,
    }
    const { view } = readView(odd, ids)!

    expect(view.panels).toEqual(custom.panels)
    expect(view.series['boost pressure']).toBeUndefined()
    expect(view.axes).toEqual(custom.axes)
    expect(view).not.toHaveProperty('extra')
  })

  it('clamps the panel height', () => {
    const tall = { ...custom, panels: [{ ...custom.panels[0]!, height: 99_999 }] }

    expect(readView(tall, ids)!.view.panels[0]!.height).toBe(900)
  })

  it('is not fooled by keys that are Object properties', () => {
    const tricky = JSON.parse('{"__proto__": {"colour": "#000000"}}') as unknown
    const { view } = readView({ ...custom, series: tricky }, [...ids, '__proto__'])!

    expect(Object.keys(view.series)).toEqual(['__proto__'])
    expect(({} as Record<string, unknown>).colour).toBeUndefined()
  })
})

describe('layoutKey', () => {
  it('depends on the set of columns, not their order', () => {
    expect(layoutKey(['b', 'a'])).toBe(layoutKey(['a', 'b']))
    expect(layoutKey(['a', 'b'])).not.toBe(layoutKey(['a', 'c']))
    expect(layoutKey(['a'])).toMatch(/^blv:view:v1:[0-9a-f]{8}$/)
  })
})

describe('panel height', () => {
  it.each([null, '', false, true, 'tall'])('uses the default height for %j', (height) => {
    const odd = { ...custom, panels: [{ ...custom.panels[0]!, height }] }

    expect(readView(odd, ids)!.view.panels[0]!.height).toBe(PANEL_HEIGHT.initial)
  })
})
