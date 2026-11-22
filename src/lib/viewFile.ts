// A view as a file, to reuse an analysis setup on another log or to share it.
import type { TimeWindow } from './timeWindow.ts'
import type { View } from './view.ts'
import { readView } from './viewSchema.ts'

export const VIEW_FILE_VERSION = 1

/** The file: the view plus its format version and the time window, `null` for the full log. */
export function viewFileText(view: View, window: TimeWindow | null): string {
  return `${JSON.stringify({ version: VIEW_FILE_VERSION, ...view, window }, null, 2)}\n`
}

export type ParsedViewFile =
  { view: View; window: TimeWindow | null; skipped: string[] } | { error: string }

const NOT_A_VIEW = 'This is not a view file of the BimmerLink Log Visualizer.'

function readWindow(value: unknown): TimeWindow | null {
  if (typeof value !== 'object' || value === null) return null
  const { min, max } = value as Record<string, unknown>
  if (typeof min !== 'number' || typeof max !== 'number') return null
  return Number.isFinite(min) && Number.isFinite(max) && min < max ? { min, max } : null
}

export function parseViewFile(text: string, ids: readonly string[]): ParsedViewFile {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { error: NOT_A_VIEW }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: NOT_A_VIEW }
  }
  const { version, window } = value as Record<string, unknown>
  if (typeof version !== 'number') return { error: NOT_A_VIEW }
  if (version !== VIEW_FILE_VERSION) {
    return {
      error: `The view file has version ${version}; this app reads version ${VIEW_FILE_VERSION}.`,
    }
  }
  const read = readView(value, ids)
  if (!read) return { error: NOT_A_VIEW }
  return { view: read.view, window: readWindow(window), skipped: read.skipped }
}
