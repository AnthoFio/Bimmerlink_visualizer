import { fireEvent, render, screen } from '@testing-library/react'
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

describe('ParameterList', () => {
  it('lists every column with a checkbox, a colour swatch and the unit', () => {
    const { boxes } = setup()

    expect(boxes()).toHaveLength(3)
    const items = screen.getAllByRole('listitem')
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
