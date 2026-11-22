import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PARAMETER_DRAG_TYPE } from './lib/dragParameter.ts'
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
