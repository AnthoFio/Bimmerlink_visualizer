import { THEME_CHOICES } from '../lib/theme.ts'
import type { ThemeChoice } from '../lib/theme.ts'
import { setThemeChoice, useThemeChoice } from './useTheme.ts'

const NAMES: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' }

export function ThemePicker() {
  const choice = useThemeChoice()

  return (
    <label className="theme-picker">
      Theme{' '}
      <select
        aria-label="Theme"
        value={choice}
        onChange={(event) => setThemeChoice(event.target.value as ThemeChoice)}
      >
        {THEME_CHOICES.map((option) => (
          <option key={option} value={option}>
            {NAMES[option]}
          </option>
        ))}
      </select>
    </label>
  )
}
