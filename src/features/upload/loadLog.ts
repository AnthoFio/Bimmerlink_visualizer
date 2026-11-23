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

/** How started workers are made; tests replace it through `startParseWorker`. */
let factory: () => ParseWorker = createParseWorker

/** Starts the parse worker ahead of the first log; does nothing if one is ready. */
export function startParseWorker(create = createParseWorker): void {
  factory = create
  if (idle) return
  try {
    keepIdle(create())
  } catch {
    // No worker now; loading tries again and reports the failure.
  }
}

/** Stops the started worker without making another. */
export function stopParseWorker(): void {
  idle?.terminate()
  idle = undefined
}

function takeParseWorker(): ParseWorker {
  const worker = idle ?? factory()
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
    // A stopped pooled worker is replaced at once, while the page is surely still online, so
    // that the next log needs no network either. A worker that fails while idle is not
    // replaced: that could loop when the worker script cannot load at all.
    const replace = () => {
      if (!createWorker) startParseWorker(factory)
    }
    const cancel = () => {
      stop()
      replace()
      reject(new DOMException('Loading was cancelled.', 'AbortError'))
    }
    const crash = () => {
      stop()
      replace()
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
