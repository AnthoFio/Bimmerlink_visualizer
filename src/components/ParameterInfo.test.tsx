import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { describeChannels } from '../lib/channels.ts'
import { ParameterInfo } from './ParameterInfo.tsx'

const show = (label: string) => {
  render(<ParameterInfo channel={describeChannels([label], parameters)[0]!} />)
  const button = screen.getByRole('button', { name: `About ${label}` })
  fireEvent.focus(button)
  return { button, tooltip: screen.getByRole('tooltip') }
}

describe('ParameterInfo', () => {
  it('shows description, category, role and confidence', () => {
    const parameter = parameters.find((candidate) => candidate.confidence === 'high')!
    const { tooltip } = show(parameter.label)

    expect(tooltip).toHaveTextContent(parameter.description)
    expect(tooltip).toHaveTextContent(parameter.category)
    expect(tooltip).toHaveTextContent(parameter.role)
    expect(tooltip).toHaveTextContent('high confidence')
    expect(tooltip).not.toHaveTextContent('may be wrong')
  })

  it('flags low confidence', () => {
    const { tooltip } = show(parameters.find((p) => p.confidence === 'low')!.label)

    expect(tooltip).toHaveTextContent('low confidence')
    expect(tooltip).toHaveTextContent('may be wrong')
  })

  it('works for a column that is not in the catalog', () => {
    const { tooltip } = show('Target Rail Pressure')

    expect(tooltip).toHaveTextContent('Not in the parameter catalog')
    expect(tooltip).toHaveTextContent('Other')
  })

  it('is tied to its button and closes with Escape or blur', () => {
    const { button, tooltip } = show('Engine speed')

    expect(button).toHaveAttribute('aria-describedby', tooltip.id)
    fireEvent.keyDown(button, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.focus(button)
    fireEvent.blur(button)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on hover', () => {
    render(<ParameterInfo channel={describeChannels(['Engine speed'], parameters)[0]!} />)

    fireEvent.pointerEnter(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeVisible()
  })
})
