import { useSyncExternalStore } from 'react'
import type { Store } from '../lib/store.ts'

/** Re-renders only when what `select` returns changes, so it must not create a new object. */
export function useStore<T, S>(store: Store<T>, select: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()))
}
