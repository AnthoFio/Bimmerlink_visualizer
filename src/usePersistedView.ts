import { useEffect, useState } from 'react'
import { readStored, writeStored } from './components/storage.ts'
import { viewsEqual } from './lib/view.ts'
import type { View } from './lib/view.ts'
import { layoutKey, readView } from './lib/viewSchema.ts'

interface Restored {
  skipped: string[]
}

/**
 * The view of a log, saved in this browser under the layout of its columns, so that a log with
 * the same columns opens the same way. Storage may fail: then the view is simply not saved.
 */
export function usePersistedView(
  ids: readonly string[],
  defaults: View,
  /** Hears whether replacing the log now would lose changes. */
  onUnsavedChange: (unsaved: boolean) => void,
) {
  const [key] = useState(() => layoutKey(ids))
  const [start] = useState(() => {
    const read = readView(readStored('local', key), ids)
    return { view: read?.view ?? defaults, restored: read && { skipped: read.skipped } }
  })
  const [view, setView] = useState(start.view)
  const [restored, setRestored] = useState<Restored | undefined>(start.restored)
  const isDefault = viewsEqual(view, defaults)

  useEffect(() => {
    // The default view is not stored: a log opens with it anyway.
    const saved = writeStored('local', key, isDefault ? undefined : view)
    onUnsavedChange(!isDefault && !saved)
  }, [key, view, isDefault, onUnsavedChange])

  const reset = () => {
    writeStored('local', key, undefined)
    setRestored(undefined)
    setView(defaults)
  }

  return {
    view,
    setView,
    reset,
    restored,
  }
}
