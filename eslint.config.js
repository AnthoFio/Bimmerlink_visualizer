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
    // Node-side tooling files (vite/vitest config).
    files: ['vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  // Must stay last: switches off every stylistic rule that Prettier owns.
  eslintConfigPrettier,
])
