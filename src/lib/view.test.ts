import { describe, expect, it } from 'vitest'
import {
  addPanel,
  assignPanel,
  defaultView,
  movePanel,
  panelOf,
  removePanel,
  selectOnly,
  setSelected,
  updatePanel,
  viewsEqual,
} from './view.ts'

const view = { ...defaultView(['a', 'b', 'c']), selected: ['a'] }

describe('view', () => {
  it('selects and unselects without changing the view it was given', () => {
    const more = setSelected(view, ['b', 'c'], true)

    expect(more.selected).toEqual(['a', 'b', 'c'])
    expect(setSelected(more, ['a', 'c'], false).selected).toEqual(['b'])
    expect(view.selected).toEqual(['a'])
  })

  it('does not select twice', () => {
    expect(setSelected(view, ['a', 'a'], true).selected).toEqual(['a'])
  })

  it('replaces the selection', () => {
    expect(selectOnly(view, ['c']).selected).toEqual(['c'])
  })

  it('compares views regardless of the order of the selection', () => {
    expect(viewsEqual({ ...view, selected: ['a', 'b'] }, { ...view, selected: ['b', 'a'] })).toBe(
      true,
    )
    expect(viewsEqual(view, { ...view, trim: false })).toBe(false)
  })
})

describe('panels', () => {
  it('always has at least one', () => {
    expect(view.panels).toHaveLength(1)
    expect(removePanel(view, view.panels[0]!.id)).toBe(view)
  })

  it('adds, reorders and resizes', () => {
    const two = addPanel(view)
    const [first, second] = two.panels
    expect(second!.id).not.toBe(first!.id)

    expect(movePanel(two, second!.id, -1).panels.map((panel) => panel.id)).toEqual([
      second!.id,
      first!.id,
    ])
    expect(movePanel(two, first!.id, -1)).toBe(two)
    expect(updatePanel(two, first!.id, { height: 500 }).panels[0]!.height).toBe(500)
  })

  it('puts a parameter on a panel, selecting it', () => {
    const two = addPanel(view)
    const target = two.panels[1]!.id
    const assigned = assignPanel(two, 'b', target)

    expect(panelOf(assigned, 'b')).toBe(target)
    expect(assigned.selected).toContain('b')
    expect(panelOf(assigned, 'a')).toBe(two.panels[0]!.id)
  })

  it('hands the parameters of a removed panel to the first one left', () => {
    const two = addPanel(view)
    const removed = two.panels[1]!.id
    const after = removePanel(assignPanel(two, 'a', removed), removed)

    expect(panelOf(after, 'a')).toBe(after.panels[0]!.id)
    // A panel added later must not take them back.
    expect(panelOf(addPanel(after), 'a')).toBe(after.panels[0]!.id)
  })

  it('is safe for ids that are names of Object properties', () => {
    const two = addPanel(view)

    expect(panelOf(two, 'constructor')).toBe(two.panels[0]!.id)
    expect(panelOf(assignPanel(two, '__proto__', two.panels[1]!.id), '__proto__')).toBe(
      two.panels[1]!.id,
    )
  })
})
