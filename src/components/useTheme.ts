import { useSyncExternalStore } from 'react'
import type { Theme } from '../lib/palette.ts'

const query = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function subscribe(onChange: () => void) {
  const media = query()
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

const current = (): Theme => (query()?.matches ? 'dark' : 'light')

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current)
}
