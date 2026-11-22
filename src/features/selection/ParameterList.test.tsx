import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { parameters } from '../../data/catalog.ts'
import { describeChannels } from '../../lib/channels.ts'
import { ParameterList } from './ParameterList.tsx'

const channels = describeChannels(
  ['Engine Speed', 'Oil Temperature', 'Target Rail Pressure'],
  parameters,
)
const colours = new Map(channels.map((channel, i) => [channel.id, `rgb(${i + 1}, 2, 3)`]))

function setup(initial: string[] = []) {
  const changed = vi.fn<(ids: string[], on: boolean) => void>()
  function Harness() {
    const [selected, setSelected] = useState(new Set(initial))
    return (
      <ParameterList
        channels={channels}
        selected={selected}
        colours={colours}
        onSelect={(ids, on) => {
          changed(ids, on)
          const next = new Set(selected)
          for (const id of ids) {
            if (on) next.add(id)
            else next.delete(id)
          }
          setSelected(next)
        }}
      />
    )
  }
  render(<Harness />)
  return { changed, boxes: () => screen.getAllByRole('checkbox') }
}

const listed = () =>
  within(screen.getByRole('list', { name: 'Parameters' })).getAllByRole('listitem')

describe('ParameterList', () => {
  it('lists every column with a checkbox, a colour swatch and the unit', () => {
    const { boxes } = setup()

    expect(boxes()).toHaveLength(3)
    const items = listed()
    expect(items[0]).toHaveTextContent('Engine Speedrpm')
    expect(items[1]).toHaveTextContent('°C')
    expect(items[2]).toHaveTextContent('unit unknown')
    expect(items[0]!.querySelector('.swatch')).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' })
  })

  it('toggles one parameter', () => {
    const { changed } = setup()

    fireEvent.click(screen.getByRole('checkbox', { name: /Oil Temperature/ }))
    expect(changed).toHaveBeenCalledWith([channels[1]!.id], true)
    expect(screen.getByRole('checkbox', { name: /Oil Temperature/ })).toBeChecked()
  })

  it('selects all and clears', () => {
    const { boxes } = setup([channels[0]!.id])

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(boxes().every((box) => (box as HTMLInputElement).checked)).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(boxes().some((box) => (box as HTMLInputElement).checked)).toBe(false)
  })

  it('moves with the arrow keys, Home and End', () => {
    const { boxes } = setup()
    const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key })

    boxes()[0]!.focus()
    press('ArrowDown')
    expect(boxes()[1]).toHaveFocus()
    press('End')
    expect(boxes()[2]).toHaveFocus()
    press('ArrowDown')
    expect(boxes()[2]).toHaveFocus()
    press('ArrowUp')
    expect(boxes()[1]).toHaveFocus()
    press('Home')
    expect(boxes()[0]).toHaveFocus()
  })

  it('uses native checkboxes, which Space toggles', () => {
    const { boxes } = setup()

    for (const box of boxes()) expect(box).toHaveAttribute('type', 'checkbox')
  })
})

describe('roles that are hidden by default', () => {
  const core = parameters.find((parameter) => parameter.role === 'core')!
  const hidden = ['redundant', 'static', 'broken'].map((role) =>
    parameters.find((parameter) => parameter.role === role)!,
  )
  const mixed = describeChannels(
    [core, ...hidden].map((parameter) => parameter.label),
    parameters,
  )

  it('keeps them behind a "show all" toggle', () => {
    const onSelect = vi.fn()
    render(
      <ParameterList channels={mixed} selected={new Set()} colours={colours} onSelect={onSelect} />,
    )

    expect(listed()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onSelect).toHaveBeenLastCalledWith([mixed[0]!.id], true)

    fireEvent.click(screen.getByRole('button', { name: 'Show all (3 hidden)' }))
    expect(listed()).toHaveLength(4)
  })

  it('still lists one that is selected', () => {
    render(
      <ParameterList
        channels={mixed}
        selected={new Set([mixed[2]!.id])}
        colours={colours}
        onSelect={vi.fn()}
      />,
    )

    expect(listed()).toHaveLength(2)
  })
})

describe('search and filters', () => {
  const type = (value: string) =>
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search parameters' }), {
      target: { value },
    })
  const rows = () => screen.getAllByRole('checkbox')

  it('narrows the list, and select all applies to what is listed', () => {
    const { changed } = setup()

    type('OIL')
    expect(rows()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(changed).toHaveBeenLastCalledWith([channels[1]!.id], true)
  })

  it('always shows the selected parameters in a section of their own', () => {
    setup([channels[0]!.id])

    type('oil')
    const section = screen.getByRole('region', { name: 'Selected' })
    expect(section).toHaveTextContent('Engine Speed')

    fireEvent.click(within(section).getByRole('button', { name: 'Unselect Engine Speed' }))
    expect(section).not.toHaveTextContent('Engine Speed')
  })

  it('filters by category, unit and role', () => {
    setup()

    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), {
      target: { value: 'Oil' },
    })
    expect(rows()).toHaveLength(1)
    fireEvent.change(screen.getByRole('combobox', { name: 'Unit' }), { target: { value: 'rpm' } })
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.getByText('No parameter matches.')).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Role' })).toBeEnabled()
  })

  it('shows that a filter is on, with a reset', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull()

    type('oil')
    expect(screen.getByText('Showing 1 of 3')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(rows()).toHaveLength(3)
  })
})
