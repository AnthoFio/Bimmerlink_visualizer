import { useRef, useState } from 'react'
import { baseName, saveFile } from '../../components/download.ts'
import { plural } from '../../lib/format.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import type { View } from '../../lib/view.ts'
import { parseViewFile, viewFileText } from '../../lib/viewFile.ts'

interface Props {
  fileName: string
  ids: readonly string[]
  /** What is exported: read at the click, so it is current. */
  current: () => { view: View; window: TimeWindow | null }
  onImport: (view: View, window: TimeWindow | null) => void
}

export function ViewFileActions({ fileName, ids, current, onImport }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean }>()

  const importFile = async (file: File) => {
    let text: string
    try {
      text = await file.text()
    } catch {
      setMessage({ text: 'The file could not be read. Choose it again.', error: true })
      return
    }
    const result = parseViewFile(text, ids)
    if ('error' in result) {
      setMessage({ text: result.error, error: true })
      return
    }
    onImport(result.view, result.window)
    const skipped = result.skipped.length
    setMessage({
      text: skipped
        ? `View imported; ${plural(skipped, 'parameter of the file is', 'parameters of the file are')} not in this log.`
        : 'View imported.',
      error: false,
    })
  }

  return (
    <div className="view-file">
      <button
        type="button"
        onClick={() => {
          const { view, window } = current()
          const text = viewFileText(view, window)
          saveFile(
            `${baseName(fileName)}.view.json`,
            new Blob([text], { type: 'application/json' }),
          )
        }}
      >
        Export view
      </button>
      <button type="button" onClick={() => input.current?.click()}>
        Import view
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept=".json,application/json"
        aria-label="View file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void importFile(file)
        }}
      />
      {message && (
        <span
          role={message.error ? 'alert' : 'status'}
          className={message.error ? 'inline-error' : 'hint'}
        >
          {message.text}
        </span>
      )}
    </div>
  )
}
