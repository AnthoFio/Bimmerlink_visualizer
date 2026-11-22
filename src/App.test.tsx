import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { loadFixtureText } from './test/fixtures.ts'

const pick = (name: string, text: string) =>
  fireEvent.change(screen.getByLabelText('BimmerLink CSV file'), {
    target: { files: [new File([text], name, { type: 'text/csv' })] },
  })

describe('App', () => {
  it('renders the application heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'BimmerLink Log Visualizer' }),
    ).toBeInTheDocument()
  })

  it('shows why a file cannot be used and lets the user retry with another', async () => {
    render(<App />)

    pick('empty.csv', '')
    expect(await screen.findByRole('alert')).toHaveTextContent('The file is empty')

    pick('log.csv', loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
    expect(await screen.findByText(/log\.csv/)).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows warnings without refusing the file', async () => {
    render(<App />)

    pick('bad.csv', loadFixtureText('non-numeric-cell.csv'))
    expect(await screen.findByText(/1 cell is blank or not a number/)).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
