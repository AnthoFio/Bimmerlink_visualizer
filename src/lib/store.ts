/** A small observable store, for state that changes on every frame and must not re-render the app. */
export interface Store<T> {
  get: () => T
  /** Merges a change; subscribers hear of it only when a value really changed. */
  set: (change: Partial<T>) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    get: () => state,
    set(change) {
      const next = { ...state, ...change }
      if ((Object.keys(change) as (keyof T)[]).every((key) => Object.is(next[key], state[key]))) {
        return
      }
      state = next
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}
