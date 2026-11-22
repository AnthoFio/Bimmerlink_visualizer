// What changes while exploring. It is the single source of truth for every chart (ADR 0001):
// a panel never sets another panel, it follows this store.
import { createStore } from './store.ts'
import type { Store } from './store.ts'
import type { TimeWindow } from './timeWindow.ts'

export interface Cursor {
  time: number
  /** The panel under the pointer. */
  panel: string
  /** Whether that panel is synchronised with the others. */
  synced: boolean
  /** False once the pointer left: the line goes, the values it read stay. */
  hovering: boolean
}

export interface Viewport {
  /** The shared window; `null` is the full log. */
  window: TimeWindow | null
  /** The windows of the panels that are not synchronised. */
  ownWindows: ReadonlyMap<string, TimeWindow | null>
  cursor: Cursor | null
}

export type ViewportStore = Store<Viewport>

interface PanelSync {
  id: string
  synced: boolean
}

export function createViewport(): ViewportStore {
  return createStore<Viewport>({ window: null, ownWindows: new Map(), cursor: null })
}

export function windowOf(state: Viewport, panel: PanelSync): TimeWindow | null {
  if (panel.synced || !state.ownWindows.has(panel.id)) return state.window
  return state.ownWindows.get(panel.id)!
}

export function setWindowOf(store: ViewportStore, panel: PanelSync, window: TimeWindow | null) {
  if (panel.synced) store.set({ window })
  else store.set({ ownWindows: new Map(store.get().ownWindows).set(panel.id, window) })
}

/** The time at which this panel reads values. */
export function readoutTimeOf({ cursor }: Viewport, panel: PanelSync): number | null {
  if (!cursor) return null
  if (cursor.panel === panel.id || (cursor.synced && panel.synced)) return cursor.time
  return null
}

/** The time at which this panel draws the cursor line. */
export function cursorTimeOf(state: Viewport, panel: PanelSync): number | null {
  return state.cursor?.hovering ? readoutTimeOf(state, panel) : null
}
