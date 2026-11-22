import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CSV_ACCEPT, fileSelectionProblem } from '../../lib/fileType.ts'

interface Props {
  onFile: (file: File) => void
  /** Status of the load in progress, shown under the drop zone. */
  children?: ReactNode
}

export function UploadPanel({ onFile, children }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [problem, setProblem] = useState<string>()

  const open = (files: File[]) => {
    const found = fileSelectionProblem(files)
    setProblem(found)
    if (!found && files[0]) onFile(files[0])
  }

  return (
    <div className="landing">
      <h1>BimmerLink Log Visualizer</h1>
      <p className="lead">
        Open a datalog and it turns into charts: choose the channels, zoom into an event and read
        the exact values.
      </p>
      <section
        aria-label="Upload a log"
        className={dragging ? 'drop-zone is-dragging' : 'drop-zone'}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          // dragleave also fires when the pointer moves onto a child of the zone.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          open(Array.from(event.dataTransfer.files))
        }}
      >
        <p className="drop-title">
          {dragging ? 'Release to open the log' : 'Drop a BimmerLink CSV here'}
        </p>
        <button type="button" className="primary" onClick={() => input.current?.click()}>
          Browse files
        </button>
        <input
          ref={input}
          hidden
          type="file"
          accept={CSV_ACCEPT}
          aria-label="BimmerLink CSV file"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            // Clear the input, otherwise picking the same file again fires no change event.
            event.target.value = ''
            if (files.length) open(files)
          }}
        />
      </section>
      {problem && (
        <p role="alert" className="message message-error">
          {problem}
        </p>
      )}
      {children}
      <p className="privacy">Files are processed locally in your browser and are never uploaded.</p>
    </div>
  )
}
