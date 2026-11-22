import { describe, expect, it } from 'vitest'
import { defaultView, selectOnly, setSelected, viewsEqual } from './view.ts'

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
