import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { directLoader } from './test/directLoader.ts'
import { loadFixtureText } from './test/fixtures.ts'

const pick = (name: string, text: string) =>
  fireEvent.change(screen.getByLabelText('BimmerLink CSV file'), {
    target: { files: [new File([text], name, { type: 'text/csv' })] },
  })

describe('App', () => {
  it('renders the application heading', () => {
    render(<App loadLog={directLoader} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'BimmerLink Log Visualizer' }),
    ).toBeInTheDocument()
  })

  it('shows why a file cannot be used and lets the user retry with another', async () => {
    render(<App loadLog={directLoader} />)

    pick('empty.csv', '')
    expect(await screen.findByRole('alert')).toHaveTextContent('The file is empty')

    pick('log.csv', loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
    expect(await screen.findByText(/Loaded log\.csv/)).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows warnings without refusing the file', async () => {
    render(<App loadLog={directLoader} />)

    pick('bad.csv', loadFixtureText('non-numeric-cell.csv'))
    expect(await screen.findByText(/1 cell is blank or not a number/)).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('cancelling a load', () => {
  it('stops reading and returns to the upload page', async () => {
    render(<App loadLog={(_file, { signal }) => never(signal)} />)

    pick('slow.csv', 'Time,"A"\n0,1\n')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('button', { name: 'Browse files' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

function never(signal?: AbortSignal) {
  return new Promise<never>((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')))
  })
}

describe('ramp-up trim', () => {
  it('is on by default and can be switched off', async () => {
    render(<App loadLog={directLoader} />)

    pick('log.csv', loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
    const trim = await screen.findByRole('checkbox', { name: 'Trim to first complete row' })
    expect(trim).toBeChecked()
    expect(screen.getByText(/140 rows/)).toBeVisible()

    fireEvent.click(trim)
    expect(screen.getByText(/150 rows/)).toBeVisible()
  })
})
