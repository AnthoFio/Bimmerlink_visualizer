import { useEffect, useId, useRef } from 'react'

interface Props {
  fileName: string
  onKeep: () => void
  onReplace: () => void
}

export function ReplaceConfirm({ fileName, onKeep, onReplace }: Props) {
  const title = useId()
  const keep = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const before = document.activeElement
    keep.current?.focus()
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus()
    }
  }, [])

  return (
    <div
      role="alertdialog"
      aria-labelledby={title}
      className="message message-warning confirm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onKeep()
      }}
    >
      <strong id={title}>Replace the current log?</strong>
      <span>Opening {fileName} discards the unsaved changes to this view.</span>
      <button ref={keep} type="button" onClick={onKeep}>
        Keep this log
      </button>
      <button type="button" onClick={onReplace}>
        Discard changes and open
      </button>
    </div>
  )
}
