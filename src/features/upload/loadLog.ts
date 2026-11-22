import { describeLoadFailure } from '../../lib/readLog.ts'
import type { ReadResult } from '../../lib/readLog.ts'
import type { ParseMessage } from './parseJob.ts'

interface LoadOptions {
  signal?: AbortSignal
  /** Share of the file parsed so far, 0 to 1. */
  onProgress?: (value: number) => void
}

/** Rejects with an Error whose message is meant for the user. */
export type LoadLog = (file: File, options: LoadOptions) => Promise<ReadResult>

/** The part of `Worker` that loading uses. */
export interface ParseWorker {
  onmessage: ((event: MessageEvent<ParseMessage>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
  postMessage: (file: Blob) => void
  terminate: () => void
}

const createParseWorker = (): ParseWorker =>
  new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' })

/** Parses in a worker of its own, so that cancelling is simply terminating it. */
export function loadLogInWorker(
  file: File,
  { signal, onProgress }: LoadOptions,
  createWorker = createParseWorker,
): Promise<ReadResult> {
  return new Promise((resolve, reject) => {
    const unexpected = () => new Error(describeLoadFailure(undefined))
    let worker: ParseWorker
    try {
      worker = createWorker()
    } catch {
      reject(unexpected())
      return
    }

    const stop = () => {
      signal?.removeEventListener('abort', cancel)
      worker.terminate()
    }
    const cancel = () => {
      stop()
      reject(new DOMException('Loading was cancelled.', 'AbortError'))
    }
    const crash = () => {
      stop()
      reject(unexpected())
    }

    worker.onerror = crash
    worker.onmessageerror = crash
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        onProgress?.(data.value)
        return
      }
      stop()
      if (data.type === 'done') resolve(data.result)
      else reject(new Error(data.message))
    }

    if (signal?.aborted) {
      cancel()
      return
    }
    signal?.addEventListener('abort', cancel)
    worker.postMessage(file)
  })
}
