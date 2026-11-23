import { useId, useState } from 'react'
import { useStore } from '../../components/useStore.ts'
import { parseTime } from '../../lib/parseTime.ts'
import { clampWindow, resolveWindow } from '../../lib/timeWindow.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import type { ViewportStore } from '../../lib/viewport.ts'

interface Draft {
  /** The window it was typed over: when that moves on, the draft is out of date. */
  over: TimeWindow | null
  start: string
  end: string
  problem?: string
}

const show = (seconds: number) => String(Math.round(seconds * 1000) / 1000)

interface Props {
  extent: TimeWindow
  viewport: ViewportStore
}

/** Start and end of the shared window. The store is the truth; the fields only edit it. */
export function TimeWindowControl({ extent, viewport }: Props) {
  const id = useId()
  const stored = useStore(viewport, (state) => state.window)
  const [edited, setEdited] = useState<Draft>()
  const shown = resolveWindow(stored, extent)
  const draft: Draft =
    edited?.over === stored && edited
      ? edited
      : { over: stored, start: show(shown.min), end: show(shown.max) }

  const apply = () => {
    const start = parseTime(draft.start)
    const end = parseTime(draft.end)
    if (start === undefined || end === undefined) {
      setEdited({ ...draft, problem: 'Enter each time in seconds or mm:ss.' })
      return
    }
    const min = Math.max(extent.min, start)
    const max = Math.min(extent.max, end)
    if (min >= max) {
      setEdited({ ...draft, problem: 'The start must be before the end, inside the log.' })
      return
    }
    setEdited(undefined)
    viewport.set({ window: clampWindow({ min, max }, extent) })
  }

  return (
    <form
      className="time-window"
      aria-label="Time window"
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      {(['start', 'end'] as const).map((edge) => (
        <label key={edge}>
          {edge === 'start' ? 'Start' : 'End'}{' '}
          <input
            value={draft[edge]}
            size={9}
            aria-invalid={draft.problem !== undefined}
            aria-describedby={draft.problem ? id : undefined}
            onChange={(event) =>
              setEdited({ ...draft, problem: undefined, [edge]: event.target.value })
            }
          />
        </label>
      ))}
      <button type="submit">Apply window</button>
      <button
        type="button"
        onClick={() => {
          setEdited(undefined)
          viewport.set({ window: null })
        }}
      >
        Full log
      </button>
      {draft.problem && (
        <span id={id} role="alert" className="inline-error">
          {draft.problem}
        </span>
      )}
    </form>
  )
}
