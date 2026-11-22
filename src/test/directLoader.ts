// jsdom has no Worker: tests run the worker's job on the same thread instead.
import { handleParseRequest } from '../features/upload/parseJob.ts'
import type { LoadLog } from '../features/upload/loadLog.ts'

export const directLoader: LoadLog = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')))
    void handleParseRequest(file, (message) => {
      if (message.type === 'progress') onProgress?.(message.value)
      else if (message.type === 'done') resolve(message.result)
      else reject(new Error(message.message))
    })
  })
