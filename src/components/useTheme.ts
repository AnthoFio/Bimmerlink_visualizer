import { useSyncExternalStore } from 'react'
import type { Theme } from '../lib/palette.ts'
import { THEME_CHOICES, THEME_KEY } from '../lib/theme.ts'
import type { ThemeChoice } from '../lib/theme.ts'

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

const media = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function storedChoice(): ThemeChoice {
  // The init script stores plain text, not JSON.
  let raw: string | null = null
  try {
    raw = localStorage.getItem(THEME_KEY)
  } catch {
    raw = null
  }
  return THEME_CHOICES.find((choice) => choice === raw) ?? 'system'
}

let choice: ThemeChoice = storedChoice()

function resolve(): Theme {
  if (choice !== 'system') return choice
  return media()?.matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.dataset.theme = resolve()
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) media()?.addEventListener('change', onSystemChange)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) media()?.removeEventListener('change', onSystemChange)
  }
}

function onSystemChange() {
  apply()
  notify()
}

export function setThemeChoice(next: ThemeChoice) {
  choice = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    // Not remembered, but still applied.
  }
  apply()
  notify()
}

/** The theme in use; the charts draw with it. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, resolve)
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, () => choice)
}
