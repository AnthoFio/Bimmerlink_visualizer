import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { directLoader } from './test/directLoader.ts'
import { loadFixtureText } from './test/fixtures.ts'

const LOG = 'trimmed_2026-10-25_09-33-22.csv'

const pick = (name: string, text: string) =>
  fireEvent.change(screen.getByLabelText('BimmerLink CSV file'), {
    target: { files: [new File([text], name, { type: 'text/csv' })] },
  })

/** The header of the loaded log, once it shows the given file. */
async function loaded(name: string) {
  await screen.findByRole('heading', { level: 2, name })
  return within(screen.getByRole('banner'))
}

async function openLog(name = 'log.csv', fixture = LOG) {
  render(<App loadLog={directLoader} />)
  pick(name, loadFixtureText(fixture))
  return loaded(name)
}

const never = (signal?: AbortSignal) =>
  new Promise<never>((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')))
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

    pick('log.csv', loadFixtureText(LOG))
    await loaded('log.csv')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows warnings without refusing the file', async () => {
    await openLog('bad.csv', 'non-numeric-cell.csv')

    expect(screen.getByText(/1 cell is blank or not a number/)).toBeVisible()
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

describe('ramp-up trim', () => {
  it('is on by default and can be switched off', async () => {
    const header = await openLog()

    const trim = screen.getByRole('checkbox', { name: 'Trim to first complete row' })
    expect(trim).toBeChecked()
    expect(header.getByText('140')).toBeVisible()

    fireEvent.click(trim)
    expect(header.getByText('150')).toBeVisible()
  })
})

describe('file summary', () => {
  it('shows name, duration, rows, sample interval and channels', async () => {
    const header = await openLog()

    const value = (term: string) => header.getByText(term).nextElementSibling
    expect(value('Duration')).toHaveTextContent('00:04')
    expect(value('Rows')).toHaveTextContent('140')
    expect(value('Median sample')).toHaveTextContent('30 ms (33.3 Hz)')
    expect(value('Channels')).toHaveTextContent('11')
  })
})

describe('opening another file', () => {
  it('replaces the dataset', async () => {
    await openLog()

    pick('other.csv', loadFixtureText('trimmed_2026-10-24_12-29-08.csv'))
    const header = await loaded('other.csv')
    expect(header.getByText('Channels').nextElementSibling).toHaveTextContent('9')
    expect(screen.queryByRole('heading', { name: 'log.csv' })).toBeNull()
  })

  it('loads the same file again', async () => {
    await openLog()
    const before = screen.getByRole('checkbox', { name: 'Trim to first complete row' })

    pick('log.csv', loadFixtureText(LOG))
    await expect.poll(() => before.isConnected).toBe(false)
    await loaded('log.csv')
  })

  it('asks first when the view has unsaved changes', async () => {
    await openLog()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Trim to first complete row' }))

    pick('other.csv', loadFixtureText('trimmed_2026-10-24_12-29-08.csv'))
    const question = screen.getByRole('alertdialog', { name: 'Replace the current log?' })
    fireEvent.click(within(question).getByRole('button', { name: 'Keep this log' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    await loaded('log.csv')

    pick('other.csv', loadFixtureText('trimmed_2026-10-24_12-29-08.csv'))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and open' }))
    await loaded('other.csv')
  })

  it('keeps the current log when the new file cannot be used', async () => {
    await openLog()

    pick('empty.csv', '')
    expect(await screen.findByRole('alert')).toHaveTextContent('The file is empty')
    await loaded('log.csv')
  })

  it('opens the picker from the header', async () => {
    const header = await openLog()

    expect(header.getByRole('button', { name: 'Open another file' })).toBeEnabled()
  })
})

describe('catalog matching in the summary', () => {
  it('reports the number of unmatched columns', async () => {
    const header = await openLog()

    expect(header.getByText('Not in catalog').nextElementSibling).toHaveTextContent('1')
  })
})
