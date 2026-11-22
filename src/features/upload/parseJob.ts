// What the parse worker does, kept apart from the worker global so that it can be tested.
import { describeLoadFailure, readLog } from '../../lib/readLog.ts'
import type { ReadResult } from '../../lib/readLog.ts'

export type ParseMessage =
  | { type: 'progress'; value: number }
  | { type: 'done'; result: ReadResult }
  | { type: 'error'; message: string }

type Post = (message: ParseMessage, transfer?: Transferable[]) => void

export async function handleParseRequest(file: Blob, post: Post): Promise<void> {
  try {
    const text = await file.text()
    const result = readLog(text, (value) => post({ type: 'progress', value }))
    const { time, columns } = result.dataset
    post({ type: 'progress', value: 1 })
    post({ type: 'done', result }, [
      time.buffer as ArrayBuffer,
      ...columns.map((column) => column.values.buffer as ArrayBuffer),
    ])
  } catch (error) {
    post({ type: 'error', message: describeLoadFailure(error) })
  }
}
