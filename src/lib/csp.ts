// The Content-Security-Policy of the production build (docs/privacy.md). GitHub Pages sets no
// headers, so vite.config.ts writes it into a meta tag; the dev server needs inline scripts for
// hot reload and goes without. frame-ancestors, report-uri and sandbox do nothing in a meta tag.

const SHA256_BASE64 = /^[A-Za-z0-9+/]{43}=$/

/**
 * The policy, given the base64 sha256 digests of the inline scripts of the page. Everything
 * comes from the own origin; nothing may connect anywhere, so a log cannot be sent even by
 * injected code. Style attributes set through the CSSOM (React, uPlot) need no 'unsafe-inline'.
 */
export function contentSecurityPolicy(scriptHashes: readonly string[]): string {
  for (const hash of scriptHashes) {
    if (!SHA256_BASE64.test(hash)) throw new Error(`Not a base64 sha256 digest: ${hash}`)
  }
  const directives: [string, ...string[]][] = [
    ['default-src', "'self'"],
    ['script-src', "'self'", ...scriptHashes.map((hash) => `'sha256-${hash}'`)],
    ['style-src', "'self'"],
    ['img-src', "'self'", 'data:', 'blob:'],
    ['connect-src', "'none'"],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'none'"],
  ]
  return directives.map((directive) => directive.join(' ')).join('; ')
}
