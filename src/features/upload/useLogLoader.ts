import { useCallback, useEffect, useRef, useState } from 'react'
import { describeLoadFailure } from '../../lib/readLog.ts'
import type { ReadResult } from '../../lib/readLog.ts'
import type { LoadLog } from './loadLog.ts'

export interface LoadedLog extends ReadResult {
  /** Different for every load, also for the same file. */
  id: number
  fileName: string
}

interface Pending {
  name: string
  size: number
  progress: number
}

/** Loads a file; a failed or cancelled load keeps the log that was open before. */
export function useLogLoader(load: LoadLog) {
  const [log, setLog] = useState<LoadedLog>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState<Pending>()
  const current = useRef<AbortController>(null)
  const loads = useRef(0)

  useEffect(() => () => current.current?.abort(), [])

  const open = useCallback(
    async (file: File) => {
      current.current?.abort()
      const controller = new AbortController()
      current.current = controller
      const { signal } = controller
      setError(undefined)
      setPending({ name: file.name, size: file.size, progress: 0 })
      try {
        const result = await load(file, {
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) setPending({ name: file.name, size: file.size, progress })
          },
        })
        if (!signal.aborted) setLog({ ...result, id: ++loads.current, fileName: file.name })
      } catch (cause) {
        if (!signal.aborted) {
          setError(cause instanceof Error ? cause.message : describeLoadFailure(cause))
        }
      } finally {
        if (current.current === controller) setPending(undefined)
      }
    },
    [load],
  )

  const cancel = useCallback(() => {
    current.current?.abort()
    setPending(undefined)
  }, [])

  return { log, error, pending, open, cancel }
}
