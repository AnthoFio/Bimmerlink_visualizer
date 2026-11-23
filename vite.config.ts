import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { contentSecurityPolicy } from './src/lib/csp.ts'
import { themeInitScript } from './src/lib/theme.ts'

const CHARSET = /<meta charset="[^"]*"\s*\/?>/i

/** Puts `tag` right after the charset declaration, which stays first in the head. */
function afterCharset(html: string, tag: string): string {
  if (!CHARSET.test(html)) throw new Error('index.html has no <meta charset>')
  return html.replace(CHARSET, (charset) => `${charset}\n    ${tag}`)
}

/** Sets the theme in the head, before the first paint: no flash of the wrong theme. */
const themeInit = (): Plugin => ({
  name: 'theme-init',
  transformIndexHtml: (html) => afterCharset(html, `<script>${themeInitScript}</script>`),
})

/**
 * Writes the strict CSP into the built page (docs/privacy.md). The theme script is allowed by
 * the hash of the very string that themeInit inlines; the e2e tests check there is no violation.
 * Running after themeInit, it lands before the script: a meta CSP covers only what follows it.
 */
const csp = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: (html) => {
    const policy = contentSecurityPolicy([
      createHash('sha256').update(themeInitScript).digest('base64'),
    ])
    return afterCharset(html, `<meta http-equiv="Content-Security-Policy" content="${policy}" />`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  // Served at / locally; the deploy workflow sets BASE_PATH (e.g. /Bimmerlink_visualizer/).
  base: process.env.BASE_PATH || '/',
  plugins: [themeInit(), csp(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
