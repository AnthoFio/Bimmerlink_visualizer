import { useCallback, useRef, useState } from 'react'
import { describeLoadFailure, readLog } from '../../lib/readLog.ts'
import type { ReadResult } from '../../lib/readLog.ts'

export interface LoadedLog extends ReadResult {
  fileName: string
}

/** Loads a file; a failed load keeps the log that was open before. */
export function useLogLoader() {
  const [log, setLog] = useState<LoadedLog>()
  const [error, setError] = useState<string>()
  const latest = useRef(0)

  const open = useCallback(async (file: File) => {
    const request = ++latest.current
    setError(undefined)
    try {
      const result = readLog(await file.text())
      if (request === latest.current) setLog({ ...result, fileName: file.name })
    } catch (cause) {
      if (request === latest.current) setError(describeLoadFailure(cause))
    }
  }, [])

  return { log, error, open }
}
