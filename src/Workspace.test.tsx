import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PARAMETER_DRAG_TYPE } from './lib/dragParameter.ts'
import { formatValue } from './lib/format.ts'
import { readLog } from './lib/readLog.ts'
import { loadFixtureText } from './test/fixtures.ts'
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

beforeEach(() => FakeUplot.reset())

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
    expect(speed.querySelector('.swatch')).toHaveAttribute('style')
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

    act(() => {
      fireEvent.pointerDown(strip, { clientY: 200, button: 0 })
      fireEvent.pointerMove(window, { clientY: 120 })
      fireEvent.pointerUp(window)
    })
    const [min, max] = rangeOfAxis(0)
    expect(max! - min!).toBeLessThan(auto[1]! - auto[0]!)

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

    act(() => void fireEvent.mouseEnter(legendButton('Engine Speed')))
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
