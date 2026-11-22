// What changes while exploring. It is the single source of truth for every chart (ADR 0001).
import { createStore } from './store.ts'
import type { Store } from './store.ts'
import type { TimeWindow } from './timeWindow.ts'

export interface Viewport {
  /** `null` is the full log. */
  window: TimeWindow | null
}

export type ViewportStore = Store<Viewport>

export function createViewport(): ViewportStore {
  return createStore<Viewport>({ window: null })
}
