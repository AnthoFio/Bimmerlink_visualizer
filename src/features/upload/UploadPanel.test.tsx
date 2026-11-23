import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UploadPanel } from './UploadPanel.tsx'

const setup = () => {
  const onFile = vi.fn<(file: File) => void>()
  render(<UploadPanel onFile={onFile} />)
  return {
    onFile,
    zone: screen.getByRole('region', { name: 'Upload a log' }),
    input: screen.getByLabelText<HTMLInputElement>('BimmerLink CSV file'),
    browse: screen.getByRole('button', { name: 'Browse files' }),
  }
}
const drop = (zone: HTMLElement, files: File[]) =>
  fireEvent.drop(zone, { dataTransfer: { files, types: ['Files'] } })

describe('UploadPanel', () => {
  it('shows the title, an explanation, a drop zone and a Browse button', () => {
    const { zone, browse } = setup()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BimmerLink Log Visualizer')
    expect(screen.getByText(/turns into charts/i)).toBeVisible()
    expect(zone).toHaveTextContent(/drop a BimmerLink CSV/i)
    expect(browse).toBeVisible()
  })

  it('marks the zone while a file is dragged over it', () => {
    const { zone } = setup()

    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'] } })
    expect(zone).toHaveTextContent('Release to open the log')
    expect(zone).toHaveClass('is-dragging')

    fireEvent.dragLeave(zone, { relatedTarget: null })
    expect(zone).not.toHaveClass('is-dragging')
  })

  it('opens the picker from a keyboard-operable button', () => {
    const { input, browse } = setup()
    const click = vi.spyOn(input, 'click')

    browse.focus()
    expect(browse).toHaveFocus()
    expect(browse.tagName).toBe('BUTTON')
    fireEvent.click(browse)
    expect(click).toHaveBeenCalledOnce()
  })

  it.each([
    ['log.csv', ''],
    ['LOG.CSV', 'application/vnd.ms-excel'],
    ['export', 'text/csv'],
  ])('accepts %s (%s) when dropped', (name, type) => {
    const { zone, onFile } = setup()
    const file = new File(['Time'], name, { type })

    drop(zone, [file])
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('accepts a picked file and lets the same one be picked again', () => {
    const { input, onFile } = setup()
    const file = new File(['Time'], 'log.csv')

    expect(input).toHaveAttribute('accept', '.csv,text/csv')
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFile).toHaveBeenCalledWith(file)
    expect(input.value).toBe('')
  })

  it('rejects other types with a message, cleared by the next valid file', () => {
    const { zone, onFile } = setup()

    drop(zone, [new File(['x'], 'photo.png', { type: 'image/png' })])
    expect(screen.getByRole('alert')).toHaveTextContent('"photo.png" is not a CSV file')
    expect(onFile).not.toHaveBeenCalled()

    drop(zone, [new File(['Time'], 'log.csv')])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('rejects several files at once', () => {
    const { zone, onFile } = setup()

    drop(zone, [new File([''], 'a.csv'), new File([''], 'b.csv')])
    expect(screen.getByRole('alert')).toHaveTextContent('one log at a time')
    expect(onFile).not.toHaveBeenCalled()
  })

  it('says that files are processed locally and never uploaded', () => {
    setup()
    expect(screen.getByText(/processed locally.*never uploaded/i)).toBeVisible()
  })
})

describe('dropping outside the drop zone', () => {
  it('still opens the file instead of letting the browser navigate to it', () => {
    const { onFile } = setup()
    const heading = screen.getByRole('heading', { level: 1 })
    const file = new File(['Time'], 'log.csv')

    const over = fireEvent.dragOver(heading, { dataTransfer: { types: ['Files'] } })
    expect(over).toBe(false)
    fireEvent.drop(heading, { dataTransfer: { files: [file], types: ['Files'] } })
    expect(onFile).toHaveBeenCalledWith(file)
  })
})
