import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PARAMETER_DRAG_TYPE } from './lib/dragParameter.ts'
import { formatValue } from './lib/format.ts'
import { readLog } from './lib/readLog.ts'
import { defaultView } from './lib/view.ts'
import { layoutKey } from './lib/viewSchema.ts'
import { loadFixtureText } from './test/fixtures.ts'

// These tests render the whole app. On their own they take 0.2 to 0.4 s; when the full suite
// runs about 11 jsdom workers in parallel, contention stretched single tests to 3 to 9 s
// (measured 2026-11-23), past the default 5 s. They are slow there, not hanging.
vi.setConfig({ testTimeout: 20_000 })
import { FakeUplot } from './test/fakeUplot.ts'
import { Workspace } from './Workspace.tsx'

const result = readLog(loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))

function setup() {
  render(
    <Workspace
      log={{ ...result, id: 1, fileName: 'log.csv' }}
      onFiles={vi.fn()}
      onUnsavedChange={vi.fn()}
    />,
  )
}

const panel = (n: number) => screen.getByRole('region', { name: `Panel ${n}` })
const legendOf = (n: number) =>
  within(within(panel(n)).getByRole('list', { name: 'Legend' })).queryAllByRole('listitem')
const click = (element: HTMLElement) => act(() => void fireEvent.click(element))

beforeEach(() => {
  FakeUplot.reset()
  localStorage.clear()
  sessionStorage.clear()
})

describe('chart panels', () => {
  it('adds and removes panels, keeping at least one', () => {
    setup()
    expect(within(panel(1)).getByRole('button', { name: 'Remove panel 1' })).toBeDisabled()

    click(screen.getByRole('button', { name: 'Add panel' }))
    expect(panel(2)).toBeVisible()

    click(within(panel(2)).getByRole('button', { name: 'Remove panel 2' }))
    expect(screen.queryByRole('region', { name: 'Panel 2' })).toBeNull()
  })

  it('assigns a parameter from the list', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))

    fireEvent.change(screen.getByRole('combobox', { name: 'Panel for Engine Speed' }), {
      target: { value: screen.getAllByRole<HTMLOptionElement>('option', { name: '2' })[0]!.value },
    })

    expect(legendOf(2)).toHaveLength(1)
    expect(legendOf(2)[0]).toHaveTextContent('Engine Speed')
    expect(legendOf(1)).toHaveLength(5)
  })

  it('assigns a parameter by drag and drop', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))

    const store = new Map<string, string>()
    const dataTransfer = {
      files: [],
      get types() {
        return [...store.keys()]
      },
      setData: (type: string, value: string) => store.set(type, value),
      getData: (type: string) => store.get(type) ?? '',
    }
    const row = screen.getByRole('checkbox', { name: /Target Rail Pressure/ }).closest('li')!
    fireEvent.dragStart(row, { dataTransfer })
    expect(store.has(PARAMETER_DRAG_TYPE)).toBe(true)
    fireEvent.drop(panel(2), { dataTransfer })

    expect(legendOf(2)[0]).toHaveTextContent('Target Rail Pressure')
  })

  it('reorders panels', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))
    expect(legendOf(1)).toHaveLength(6)

    click(within(panel(2)).getByRole('button', { name: 'Move panel 2 up' }))
    expect(legendOf(1)).toHaveLength(0)
    expect(legendOf(2)).toHaveLength(6)
  })

  it('changes the height of a panel', () => {
    setup()

    fireEvent.change(within(panel(1)).getByRole('slider', { name: 'Height of panel 1' }), {
      target: { value: '560' },
    })
    expect(FakeUplot.last.height).toBe(560)
  })
})

describe('line style', () => {
  it('is a toggle per chart', () => {
    setup()
    const stepped = () => FakeUplot.last.series.slice(1).map((series) => series.paths !== undefined)
    expect(stepped()).not.toContain(true)

    fireEvent.change(within(panel(1)).getByRole('combobox', { name: 'Lines in panel 1' }), {
      target: { value: 'step' },
    })
    expect(stepped()).not.toContain(false)
  })
})

describe('synchronised panels', () => {
  function twoPanels() {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))
    const [first, second] = FakeUplot.instances
    for (const plot of [first!, second!]) {
      plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    }
    return { first: first!, second: second! }
  }
  const wheelOn = (plot: FakeUplot) =>
    act(() => void fireEvent.wheel(plot.over, { deltaY: -300, clientX: 500 }))
  const hover = (plot: FakeUplot, clientX: number) =>
    act(() => void fireEvent.mouseMove(plot.over, { clientX }))
  const lineOf = (plot: FakeUplot) => plot.over.querySelector<HTMLElement>('.cursor-line')!
  const unsync = (n: number) =>
    click(within(panel(n)).getByRole('checkbox', { name: `Sync panel ${n} with the others` }))

  it('applies zoom and pan in one panel to all', () => {
    const { first, second } = twoPanels()
    const full = { ...second.x! }

    wheelOn(first)
    expect(second.x).toEqual(first.x)
    expect(second.x).not.toEqual(full)
  })

  it('shows the cursor line in every panel', () => {
    const { first, second } = twoPanels()

    hover(first, 250)
    expect(lineOf(second)).toBeVisible()
    expect(parseFloat(lineOf(second).style.left)).toBeCloseTo(25, 0)
    expect(lineOf(first).style.left).toBe(lineOf(second).style.left)

    act(() => void fireEvent.mouseLeave(first.over))
    expect(lineOf(second)).not.toBeVisible()
  })

  it('can be switched off per panel', () => {
    const { first, second } = twoPanels()
    wheelOn(first)
    const before = { ...second.x! }

    unsync(2)
    // It keeps the window it was showing.
    expect(second.x).toEqual(before)

    wheelOn(first)
    expect(second.x).toEqual(before)
    hover(first, 250)
    expect(lineOf(second)).not.toBeVisible()

    wheelOn(second)
    expect(second.x).not.toEqual(before)

    unsync(2)
    expect(second.x).toEqual(first.x)
  })
})

describe('cursor readout', () => {
  function hoverAt(share: number) {
    const plot = FakeUplot.last
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    act(() => void fireEvent.mouseMove(plot.over, { clientX: share * 1000 }))
    return plot
  }

  it('shows the time and the name, value, unit and colour of each visible series', () => {
    setup()
    hoverAt(1)

    const last = result.dataset.time.length - 1
    const readout = within(panel(1)).getByRole('list', { name: 'Legend' })
    expect(within(panel(1)).getByText(`${result.dataset.time[last]!.toFixed(3)} s`)).toBeVisible()
    const speed = within(readout).getByText('Engine Speed').closest('li')!
    const value = result.dataset.columns.find((c) => c.name === 'Engine Speed')!.values[last]!
    expect(within(speed).getByText(formatValue(value))).toBeVisible()
    expect(speed).toHaveTextContent('rpm')
    expect(speed.querySelector('.line-sample line')).toHaveAttribute('stroke')
  })

  it('snaps to the nearest sample', () => {
    setup()
    const plot = hoverAt(0.5004)

    const { time } = result.dataset
    const start = time[result.rampUp.rows]!
    const at = start + 0.5004 * (time.at(-1)! - start)
    const nearest = [...time].reduce((a, b) => (Math.abs(b - at) < Math.abs(a - at) ? b : a))
    expect(within(panel(1)).getByText(`${nearest.toFixed(3)} s`)).toBeVisible()
    const line = plot.over.querySelector<HTMLElement>('.cursor-line')!
    expect(parseFloat(line.style.left)).toBeCloseTo(
      ((nearest - start) / (time.at(-1)! - start)) * 100,
      6,
    )
  })

  it('is docked under the chart and keeps the values when the pointer moves to it', () => {
    setup()
    click(screen.getByRole('button', { name: 'Select all' }))
    const plot = hoverAt(0.5)
    act(() => void fireEvent.mouseLeave(plot.over))

    const readout = within(panel(1)).getByRole('list', { name: 'Legend' })
    expect(plot.root).not.toContainElement(readout)
    expect(readout.closest('.plot')).toBeNull()
    expect(readout.querySelectorAll('.value:not(:empty)')).toHaveLength(11)
  })
})

describe('range selection', () => {
  function shiftDrag(from = 200, to = 600) {
    const plot = FakeUplot.last
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    const window0 = { ...plot.x! }
    act(() => {
      fireEvent.mouseDown(plot.over, { clientX: from, shiftKey: true })
      fireEvent.mouseMove(window, { clientX: to })
      fireEvent.mouseUp(window)
    })
    return { plot, window0, band: plot.over.querySelector<HTMLElement>('.selection-band')! }
  }

  it('selects with Shift-drag, without panning, and stays highlighted', () => {
    setup()
    const { plot, window0, band } = shiftDrag()

    expect(plot.x).toEqual(window0)
    expect(band).toBeVisible()
    expect(parseFloat(band.style.left)).toBeCloseTo(20)
    expect(parseFloat(band.style.width)).toBeCloseTo(40)

    act(() => void fireEvent.mouseLeave(plot.over))
    expect(band).toBeVisible()
  })

  it('lists min, max, mean, delta and sample count per visible series', () => {
    setup()
    shiftDrag()

    const table = screen.getByRole('table', { name: /Statistics from/ })
    const heads = within(table).getAllByRole('columnheader')
    expect(heads.map((head) => head.textContent)).toEqual([
      'Series',
      'Min',
      'Max',
      'Mean',
      'Delta',
      'Samples',
    ])
    expect(within(table).getAllByRole('rowheader')).toHaveLength(6)
  })

  it('zooms to the selection and clears it', () => {
    setup()
    const { plot, window0, band } = shiftDrag()
    const span = window0.max - window0.min

    click(screen.getByRole('button', { name: 'Zoom to selection' }))
    expect(plot.x!.min).toBeCloseTo(window0.min + 0.2 * span)
    expect(plot.x!.max).toBeCloseTo(window0.min + 0.6 * span)

    click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByRole('table', { name: /Statistics from/ })).toBeNull()
    expect(band).not.toBeVisible()
  })

  it('can select without a mouse', () => {
    setup()
    click(screen.getByRole('button', { name: 'Select visible range' }))

    expect(screen.getByRole('table', { name: /Statistics from/ })).toBeVisible()
  })
})

describe('auto-fit', () => {
  it('fits the visible window by default, and all data when switched', () => {
    setup()
    const select = within(panel(1)).getByRole('combobox', { name: 'Fit panel 1' })
    expect(select).toHaveValue('visible')

    const rangeOfFirstAxis = () => {
      const range = FakeUplot.last.opts.scales!.a0!.range as (...args: unknown[]) => number[]
      return range()
    }
    // The pedal is the channel that moves within these 4 seconds, and not at their start.
    click(screen.getByRole('button', { name: 'Clear' }))
    click(screen.getByRole('checkbox', { name: /Normalized Accelerator Pedal Angle/ }))

    const plot = FakeUplot.last
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    const full = rangeOfFirstAxis()
    act(() => void fireEvent.wheel(plot.over, { deltaY: -900, clientX: 10 }))
    expect(rangeOfFirstAxis()).not.toEqual(full)

    fireEvent.change(select, { target: { value: 'all' } })
    expect(rangeOfFirstAxis()).toEqual(full)
  })
})

describe('manual Y ranges', () => {
  // The plot of panel 1: later instances can belong to panels that were removed.
  const rangeOfAxis = (slot: number) =>
    (FakeUplot.instances[0]!.opts.scales![`a${slot}`]!.range as (...args: unknown[]) => number[])()
  const field = (name: string) => screen.getByRole<HTMLInputElement>('textbox', { name })
  const type = (name: string, value: string) => fireEvent.change(field(name), { target: { value } })
  const set = () => click(screen.getByRole('button', { name: 'Set range of rpm in panel 1' }))

  function onlyEngineSpeed() {
    setup()
    click(screen.getByRole('button', { name: 'Clear' }))
    click(screen.getByRole('checkbox', { name: /Engine Speed/ }))
    click(screen.getByText('Axes of panel 1'))
  }

  it('sets min and max, and goes back to auto', () => {
    onlyEngineSpeed()
    const auto = rangeOfAxis(0)

    type('Min of rpm in panel 1', '700')
    type('Max of rpm in panel 1', '1300')
    set()
    expect(rangeOfAxis(0)).toEqual([700, 1300])

    const toggle = screen.getByRole('checkbox', { name: 'Auto range of rpm in panel 1' })
    expect(toggle).not.toBeChecked()
    click(toggle)
    expect(rangeOfAxis(0)).toEqual(auto)
  })

  it.each([
    ['5', '5'],
    ['9', '2'],
    ['abc', '2'],
    ['', '2'],
  ])('rejects min %j with max %j inline', (min, max) => {
    onlyEngineSpeed()
    const before = rangeOfAxis(0)

    type('Min of rpm in panel 1', min)
    type('Max of rpm in panel 1', max)
    set()
    expect(screen.getByRole('alert')).toHaveTextContent('Min must be a number below max')
    expect(rangeOfAxis(0)).toEqual(before)
  })

  it('keeps the range while the selection and the panels change', () => {
    onlyEngineSpeed()
    type('Min of rpm in panel 1', '700')
    type('Max of rpm in panel 1', '1300')
    set()

    const box = () => screen.getByRole('checkbox', { name: /^Engine Speed/ })
    click(box())
    click(box())
    click(screen.getByRole('button', { name: 'Add panel' }))
    click(screen.getByRole('button', { name: 'Remove panel 2' }))
    expect(rangeOfAxis(0)).toEqual([700, 1300])
  })

  it('zooms by dragging the axis, and a double click resets it', () => {
    onlyEngineSpeed()
    const auto = rangeOfAxis(0)
    const strip = FakeUplot.last.root.querySelector<HTMLElement>('.axis-drag')!

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    act(() => {
      fireEvent.pointerDown(strip, { clientY: 200, button: 0 })
      fireEvent.pointerMove(window, { clientY: 160 })
      fireEvent.pointerMove(window, { clientY: 120 })
    })
    // While dragging, the chart follows, but the view is neither changed nor saved.
    const [dragMin, dragMax] = rangeOfAxis(0)
    expect(dragMax! - dragMin!).toBeLessThan(auto[1]! - auto[0]!)
    expect(setItem).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Auto range of rpm in panel 1' })).toBeChecked()

    act(() => void fireEvent.pointerUp(window))
    expect(setItem).toHaveBeenCalledOnce()
    setItem.mockRestore()
    const [min, max] = rangeOfAxis(0)
    expect([min, max]).toEqual([dragMin, dragMax])

    act(() => void fireEvent.dblClick(strip))
    expect(rangeOfAxis(0)).toEqual(auto)
  })
})

describe('normalised overlay', () => {
  const normalise = (value: string) =>
    fireEvent.change(screen.getByRole('combobox', { name: 'Normalise panel 1' }), {
      target: { value },
    })

  it('puts the series of the panel on one axis of "% of range"', () => {
    setup()
    normalise('log')

    const plot = FakeUplot.last
    expect(plot.axes[1]!.label).toBe('% of range')
    expect(new Set(plot.series.slice(1).map((series) => series.scale)).size).toBe(1)
    for (const column of plot.data.slice(1)) {
      for (const value of Array.from(column as ArrayLike<number | null>)) {
        if (value === null) continue
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }
    }
  })

  it('still reads the real values and units', () => {
    setup()
    normalise('window')
    const plot = FakeUplot.last
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    act(() => void fireEvent.mouseMove(plot.over, { clientX: 1000 }))

    const speed = within(screen.getByRole('list', { name: 'Legend' }))
      .getByText('Engine Speed')
      .closest('li')!
    const value = result.dataset.columns.find((c) => c.name === 'Engine Speed')!.values.at(-1)
    expect(speed).toHaveTextContent(`${formatValue(value)}rpm`)
  })

  it('is a toggle per panel', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))
    normalise('log')

    expect(screen.getByRole('combobox', { name: 'Normalise panel 2' })).toHaveValue('off')
  })
})

describe('moving series', () => {
  const choose = (what: 'Axis' | 'Panel', value: string) =>
    fireEvent.change(screen.getByRole('combobox', { name: `${what} of Engine Speed` }), {
      target: { value },
    })
  const open = () => click(screen.getByRole('button', { name: 'Options for Engine Speed' }))
  const scaleOfSpeed = () =>
    FakeUplot.instances[0]!.series.find((series) => series.label === 'Engine Speed')!.scale

  it('moves a series to another axis without losing the zoom, and back to automatic', () => {
    setup()
    const plot = FakeUplot.last
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    act(() => void fireEvent.wheel(plot.over, { deltaY: -300, clientX: 500 }))
    const zoomed = { ...plot.x! }
    const automatic = scaleOfSpeed()

    open()
    choose('Axis', 'left')
    expect(scaleOfSpeed()).toBe('a0')
    expect(plot.x).toEqual(zoomed)
    expect(FakeUplot.instances).toEqual([plot])

    click(screen.getByRole('button', { name: 'Reset Engine Speed to automatic' }))
    expect(scaleOfSpeed()).toBe(automatic)
  })

  it('moves a series to another panel without losing the zoom', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))
    const [first, second] = FakeUplot.instances
    first!.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    act(() => void fireEvent.wheel(first!.over, { deltaY: -300, clientX: 500 }))
    const zoomed = { ...first!.x! }

    open()
    choose('Panel', 'p2')
    expect(legendOf(2)[0]).toHaveTextContent('Engine Speed')
    expect(second!.x).toEqual(zoomed)
    expect(first!.x).toEqual(zoomed)
  })
})

describe('colours and legend', () => {
  const legendButton = (name: string) =>
    within(screen.getByRole('list', { name: 'Legend' })).getByRole('button', { name })
  const plotted = () => FakeUplot.last.series.slice(1).map((series) => series.label)
  const strokeOf = (label: string) => {
    const series = FakeUplot.last.series.find((candidate) => candidate.label === label)!
    return (series.stroke as () => string)()
  }

  it('toggles the visibility of a series from the legend', () => {
    setup()
    expect(plotted()).toContain('Engine Speed')

    click(legendButton('Engine Speed'))
    expect(plotted()).not.toContain('Engine Speed')
    expect(legendButton('Engine Speed')).toHaveAttribute('aria-pressed', 'false')

    click(legendButton('Engine Speed'))
    expect(plotted()).toContain('Engine Speed')
  })

  it('highlights the hovered series and dims the others', () => {
    setup()
    const normal = strokeOf('Oil Temperature')
    const data = FakeUplot.last.data
    const redraws = FakeUplot.last.redraws

    act(() => void fireEvent.mouseEnter(legendButton('Engine Speed')))
    // Only the colours change: a redraw, without sampling the data again.
    expect(FakeUplot.last.data).toBe(data)
    expect(FakeUplot.last.redraws).toBeGreaterThan(redraws)
    expect(strokeOf('Oil Temperature')).toMatch(/^rgba\(.*0\.22\)$/)
    expect(strokeOf('Engine Speed')).not.toMatch(/rgba/)

    act(() => void fireEvent.mouseLeave(legendButton('Engine Speed')))
    expect(strokeOf('Oil Temperature')).toBe(normal)
  })

  it('has a colour picker per series', () => {
    setup()
    click(screen.getByRole('button', { name: 'Options for Engine Speed' }))

    fireEvent.change(screen.getByLabelText('Colour of Engine Speed'), {
      target: { value: '#123456' },
    })
    expect(strokeOf('Engine Speed')).toBe('#123456')
  })
})

describe('presets', () => {
  const apply = (name: string) => {
    fireEvent.change(screen.getByRole('combobox', { name: 'Preset' }), { target: { value: name } })
    click(screen.getByRole('button', { name: 'Apply preset' }))
  }
  const legendNames = () =>
    within(screen.getByRole('list', { name: 'Legend' }))
      .queryAllByRole('listitem')
      .map((item) => item.querySelector('.legend-name')!.textContent)

  it('replaces the selection and reports what is missing', () => {
    setup()

    apply('Misfire')
    expect(legendNames()).toHaveLength(6)
    expect(legendNames().every((name) => name!.startsWith('Misfire'))).toBe(true)
    expect(screen.getByRole('status', { name: 'Preset result' })).toHaveTextContent(
      '7 of 13 not in this log',
    )
  })

  it('can be undone', () => {
    setup()
    const before = legendNames()

    apply('Misfire')
    click(screen.getByRole('button', { name: 'Undo preset' }))
    expect(legendNames()).toEqual(before)
    expect(screen.queryByRole('button', { name: 'Undo preset' })).toBeNull()
  })

  it('keeps the selection when none of the preset is in the log', () => {
    setup()
    const before = legendNames()

    apply('Knock')
    expect(legendNames()).toEqual(before)
    expect(screen.getByRole('status', { name: 'Preset result' })).toHaveTextContent(
      'None of the 27 parameters of Knock is in this log',
    )
  })
})

describe('saved view', () => {
  const key = () => Object.keys(localStorage).find((name) => name.startsWith('blv:view:'))
  const legendCount = () =>
    within(screen.getByRole('list', { name: 'Legend' })).queryAllByRole('listitem').length

  beforeEach(() => localStorage.clear())

  it('is restored when the same layout is opened again, and reset clears it', () => {
    const { unmount } = render(
      <Workspace
        log={{ ...result, id: 1, fileName: 'a.csv' }}
        onFiles={vi.fn()}
        onUnsavedChange={vi.fn()}
      />,
    )
    click(screen.getByRole('button', { name: 'Clear' }))
    click(screen.getByRole('checkbox', { name: /Oil Temperature/ }))
    expect(key()).toBeDefined()
    unmount()

    setup()
    expect(legendCount()).toBe(1)
    expect(screen.getByText(/Restored the saved view/)).toBeVisible()

    click(screen.getByRole('button', { name: 'Reset view' }))
    expect(key()).toBeUndefined()
    expect(legendCount()).toBe(6)
  })

  it('reports parameters it could not restore', () => {
    const ids = result.dataset.columns.map((column) => column.name.toLowerCase())
    localStorage.setItem(
      layoutKey(ids),
      JSON.stringify({ ...defaultView(['oil temperature', 'no such channel']) }),
    )

    setup()
    expect(screen.getByText(/1 parameter skipped/)).toBeVisible()
    expect(legendCount()).toBe(1)
  })

  it('carries on silently when storage fails', () => {
    const onUnsavedChange = vi.fn()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    render(
      <Workspace
        log={{ ...result, id: 1, fileName: 'a.csv' }}
        onFiles={vi.fn()}
        onUnsavedChange={onUnsavedChange}
      />,
    )

    click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByRole('alert')).toBeNull()
    // Without storage the changes are unsaved, so replacing the log asks first.
    expect(onUnsavedChange).toHaveBeenLastCalledWith(true)
    setItem.mockRestore()
  })
})

describe('view files', () => {
  it('exports the view as a JSON download', async () => {
    let saved: Blob | undefined
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      saved = blob as Blob
      return 'blob:view'
    })
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    setup()

    click(screen.getByRole('button', { name: 'Export view' }))
    expect(anchorClick).toHaveBeenCalledOnce()
    const file = JSON.parse(await saved!.text()) as { version: number; selected: string[] }
    expect(file.version).toBe(1)
    expect(file.selected).toHaveLength(6)
    for (const spy of [create, revoke, anchorClick]) spy.mockRestore()
  })

  it('imports a view and reports unknown parameters', async () => {
    setup()
    const text = JSON.stringify({
      ...defaultView(['oil temperature', 'no such channel']),
      version: 1,
      window: { min: 1, max: 2 },
    })

    fireEvent.change(screen.getByLabelText('View file'), {
      target: { files: [new File([text], 'view.json', { type: 'application/json' })] },
    })
    expect(await screen.findByText(/1 parameter of the file is not in this log/)).toBeVisible()
    expect(
      within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem'),
    ).toHaveLength(1)
    expect(FakeUplot.last.x).toEqual({ min: 1, max: 2 })
  })

  it('says why a file cannot be imported', async () => {
    setup()

    fireEvent.change(screen.getByLabelText('View file'), {
      target: { files: [new File(['nope'], 'view.json')] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('not a view file')
  })
})

describe('CSV export', () => {
  it('downloads the visible series over the window', async () => {
    let saved: Blob | undefined
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      saved = blob as Blob
      return 'blob:csv'
    })
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    setup()
    click(screen.getByRole('button', { name: 'Clear' }))
    click(screen.getByRole('checkbox', { name: /Engine Speed/ }))

    click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce())
    const text = await saved!.text()
    expect(text.split('\n')[0]).toBe('Time,"Engine Speed"')
    expect(text.trimEnd().split('\n')).toHaveLength(141)
    create.mockRestore()
    anchorClick.mockRestore()
  })
})

describe('accessibility', () => {
  it('has a data table as text alternative of the charts', async () => {
    setup()
    click(screen.getByText('Data table'))

    // The toggle event of <details> fires as a task of its own, so the table comes a little later.
    const table = await screen.findByRole('table', {
      name: /samples, evenly spread over the visible window/,
    })
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(10)
    expect(screen.getByText(/6 series over the visible window/)).toBeVisible()
  })

  it('can tell series apart by line style, not only by colour', () => {
    setup()
    const dashes = () => FakeUplot.last.series.slice(1).map((series) => JSON.stringify(series.dash))
    expect(new Set(dashes()).size).toBe(1)

    click(within(panel(1)).getByRole('checkbox', { name: 'Line styles in panel 1' }))
    expect(new Set(dashes()).size).toBe(6)
  })
})

describe('side panel drawer', () => {
  const toggle = () => screen.getByRole('button', { name: 'Parameters' })
  const sidebar = () => screen.getByRole('complementary', { name: 'Parameters' })

  it('is a labelled toggle that controls the parameter panel', () => {
    setup()
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(toggle()).toHaveAttribute('aria-controls', sidebar().id)
    expect(sidebar()).not.toHaveClass('is-open')

    click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(sidebar()).toHaveClass('is-open')
    expect(within(sidebar()).getByRole('button', { name: 'Close parameters' })).toHaveFocus()

    click(within(sidebar()).getByRole('button', { name: 'Close parameters' }))
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(toggle()).toHaveFocus()
  })

  it('closes with Escape and gives the focus back to the toggle', () => {
    setup()
    click(toggle())
    act(
      () =>
        void fireEvent.keyDown(within(sidebar()).getAllByRole('checkbox')[0]!, { key: 'Escape' }),
    )

    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(sidebar()).not.toHaveClass('is-open')
    expect(toggle()).toHaveFocus()
  })

  it('keeps the selection, the panels and the zoom while it opens and closes', () => {
    setup()
    click(screen.getByRole('button', { name: 'Add panel' }))
    const plot = FakeUplot.instances[0]!
    plot.over.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    act(() => void fireEvent.wheel(plot.over, { deltaY: -300, clientX: 500 }))
    const zoomed = { ...plot.x! }
    const count = FakeUplot.instances.length

    click(toggle())
    click(within(sidebar()).getByRole('checkbox', { name: /Engine Speed/ }))
    act(() => void fireEvent.keyDown(sidebar(), { key: 'Escape' }))

    expect(panel(2)).toBeVisible()
    expect(legendOf(1)).toHaveLength(5)
    expect(FakeUplot.instances).toHaveLength(count)
    expect(FakeUplot.instances[0]!.x).toEqual(zoomed)
  })
})

describe('drawer, closing', () => {
  const toggle = () => screen.getByRole('button', { name: 'Parameters' })

  it('closes with Escape wherever the focus is', () => {
    setup()
    click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')

    const chart = screen.getAllByRole('group', { name: /Time-series chart/ })[0]!
    chart.focus()
    act(() => void fireEvent.keyDown(chart, { key: 'Escape' }))
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not reopen by itself after the window grew past 900 px', () => {
    const listeners = new Set<() => void>()
    const wide = { matches: false }
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query.includes('min-width: 900px') && wide.matches
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }))
    setup()
    click(toggle())

    wide.matches = true
    act(() => listeners.forEach((listener) => listener()))
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    vi.unstubAllGlobals()
  })
})
