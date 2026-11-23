import { describe, expect, it } from 'vitest'
import { addPanel, assignPanel, defaultView, setAxisRange, updateSeries } from './view.ts'
import { parseViewFile, VIEW_FILE_VERSION, viewFileText } from './viewFile.ts'

const ids = ['engine speed', 'oil temperature']
const view = (() => {
  let next = addPanel(defaultView(['engine speed']))
  next = assignPanel(next, 'oil temperature', next.panels[1]!.id)
  next = updateSeries(next, 'engine speed', { colour: '#336699' })
  return setAxisRange(next, next.panels[0]!.id, 'unit:rpm', [700, 1300])
})()
const window = { min: 612, max: 640 }

describe('view file', () => {
  it('is versioned JSON with panels, series, axes and the window', () => {
    const file = JSON.parse(viewFileText(view, window)) as Record<string, unknown>

    expect(file.version).toBe(VIEW_FILE_VERSION)
    for (const field of ['panels', 'series', 'axes', 'window', 'selected']) {
      expect(file).toHaveProperty(field)
    }
  })

  it('round-trips: export then import gives the same view state', () => {
    expect(parseViewFile(viewFileText(view, window), ids)).toEqual({
      view,
      window,
      skipped: [],
    })
    expect(parseViewFile(viewFileText(view, null), ids)).toMatchObject({ window: null })
  })

  it('reports unknown parameters', () => {
    const result = parseViewFile(viewFileText(view, window), ['engine speed'])

    expect(result).toMatchObject({ skipped: ['oil temperature'] })
  })

  it.each([
    ['not JSON', '{', /not a view file/],
    ['another kind of JSON', '[1, 2]', /not a view file/],
    ['a newer version', JSON.stringify({ ...view, version: 99 }), /version 99/],
    ['no version', JSON.stringify(view), /not a view file/],
    ['a broken view', JSON.stringify({ version: 1, panels: [] }), /not a view file/],
  ])('rejects %s', (_name, text, message) => {
    const result = parseViewFile(text, ids)

    expect(result).toHaveProperty('error')
    expect('error' in result && result.error).toMatch(message)
  })

  it('ignores a window that makes no sense', () => {
    const text = JSON.stringify({ ...JSON.parse(viewFileText(view, window)), window: [1, 2] })

    expect(parseViewFile(text, ids)).toMatchObject({ window: null })
  })
})
