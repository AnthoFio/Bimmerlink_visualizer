import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoadStatus } from './LoadStatus.tsx'

const MB = 1024 * 1024

describe('LoadStatus', () => {
  it('shows a progress indicator for files over 1 MB', () => {
    render(<LoadStatus name="big.csv" size={MB + 1} progress={0.42} onCancel={vi.fn()} />)

    expect(screen.getByRole('progressbar', { name: 'Reading big.csv' })).toHaveAttribute(
      'value',
      '0.42',
    )
  })

  it('shows no progress indicator for a small file', () => {
    render(<LoadStatus name="small.csv" size={MB} progress={0} onCancel={vi.fn()} />)

    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByText(/Reading small.csv/)).toBeVisible()
  })

  it('can be cancelled', () => {
    const onCancel = vi.fn()
    render(<LoadStatus name="big.csv" size={MB * 3} progress={0.1} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
