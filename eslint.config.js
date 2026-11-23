import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  // Never lint build output, coverage, example logs, fixtures or third-party agent skills.
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'Example',
    'tests/fixtures',
    '.claude',
    '.agents',
    // Throwaway spikes are isolated mini-projects with their own package.json (see spikes/README.md).
    'spikes',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    // Node-side tooling files (vite/vitest and Playwright config, e2e tests).
    files: ['vite.config.ts', 'playwright.config.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // Must stay last: switches off every stylistic rule that Prettier owns.
  eslintConfigPrettier,
])
