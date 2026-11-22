import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RampUpToggle } from './RampUpToggle.tsx'

describe('RampUpToggle', () => {
  it('says how much was trimmed', () => {
    render(<RampUpToggle rows={10} seconds={0.3} checked onChange={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'Trim to first complete row' })).toBeChecked()
    expect(screen.getByText('10 rows (0.30 s) trimmed')).toBeVisible()
  })

  it('can be switched off', () => {
    const onChange = vi.fn()
    render(<RampUpToggle rows={10} seconds={0.3} checked onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('says when there was nothing to trim', () => {
    render(<RampUpToggle rows={0} seconds={0} checked onChange={vi.fn()} />)

    expect(screen.getByText('nothing to trim')).toBeVisible()
  })
})
