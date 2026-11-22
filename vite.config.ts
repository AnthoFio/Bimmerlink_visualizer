import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { themeInitScript } from './src/lib/theme.ts'

/** Sets the theme in the head, before the first paint: no flash of the wrong theme. */
const themeInit = (): Plugin => ({
  name: 'theme-init',
  transformIndexHtml: () => [
    { tag: 'script', children: themeInitScript, injectTo: 'head-prepend' },
  ],
})

// https://vite.dev/config/
export default defineConfig({
  // Served at / locally; the deploy workflow sets BASE_PATH (e.g. /Bimmerlink_visualizer/).
  base: process.env.BASE_PATH || '/',
  plugins: [themeInit(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
