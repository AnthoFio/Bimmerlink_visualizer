const PROGRESS_FROM_BYTES = 1024 * 1024

interface Props {
  name: string
  size: number
  progress: number
  onCancel: () => void
}

export function LoadStatus({ name, size, progress, onCancel }: Props) {
  return (
    <div className="load-status">
      <span role="status">Reading {name}…</span>
      {size > PROGRESS_FROM_BYTES && (
        <progress aria-label={`Reading ${name}`} max={1} value={progress} />
      )}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
