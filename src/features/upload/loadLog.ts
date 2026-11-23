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

/**
 * A started worker without a job. It is made with the page and kept after each log, so that
 * opening a log needs no network once the page has loaded (docs/privacy.md).
 */
let idle: ParseWorker | undefined

function keepIdle(worker: ParseWorker) {
  const drop = () => {
    if (idle === worker) idle = undefined
    worker.terminate()
  }
  worker.onmessage = null
  worker.onerror = drop
  worker.onmessageerror = drop
  idle = worker
}

/** Starts the parse worker ahead of the first log; does nothing if one is ready. */
export function startParseWorker(create = createParseWorker): void {
  if (idle) return
  try {
    keepIdle(create())
  } catch {
    // No worker now; loading tries again and reports the failure.
  }
}

function takeParseWorker(): ParseWorker {
  const worker = idle ?? createParseWorker()
  idle = undefined
  return worker
}

/**
 * Parses in a worker, so that cancelling is simply terminating it. Without `createWorker` the
 * started worker is used and kept for the next log; a given factory's worker is always stopped.
 */
export function loadLogInWorker(
  file: File,
  { signal, onProgress }: LoadOptions,
  createWorker?: () => ParseWorker,
): Promise<ReadResult> {
  return new Promise((resolve, reject) => {
    const unexpected = () => new Error(describeLoadFailure(undefined))
    let worker: ParseWorker
    try {
      worker = (createWorker ?? takeParseWorker)()
    } catch {
      reject(unexpected())
      return
    }

    const stop = () => {
      signal?.removeEventListener('abort', cancel)
      worker.terminate()
    }
    const finish = () => {
      if (createWorker || idle) {
        stop()
        return
      }
      signal?.removeEventListener('abort', cancel)
      keepIdle(worker)
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
      finish()
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
