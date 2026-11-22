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
