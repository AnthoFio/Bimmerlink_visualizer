# Privacy by design

A BimmerLink log comes from the user's own car. The app's promise: the log never leaves the browser.
This page lists what keeps that promise and which test proves each part (story S58).

## Guarantees

- **Everything runs in the page.** The log is read with the File API and parsed in a Web Worker (`src/features/upload/parse.worker.ts`). There is no backend: the site is static files on GitHub Pages (`docs/deploy.md`).
- **No network after load.** The page fetches its own files once. The parse worker is started with the page (`startParseWorker` in `src/features/upload/loadLog.ts`) and kept after each log; after a cancelled or crashed load it is replaced at once, so opening a log needs no network. Exports (PNG, SVG, CSV, view JSON) are made in memory and handed to the browser's download as `blob:` URLs; importing a view reads a local file.
- **No third parties.** The page loads only same-origin files: no CDN, web fonts, analytics, telemetry or error reporting. The only run-time dependencies are React and uPlot.
- **Stated on the landing page.** The upload panel says that files are processed locally and never uploaded.

## Content-Security-Policy

GitHub Pages cannot set HTTP headers, so the production build carries the policy in a `<meta http-equiv="Content-Security-Policy">` tag, written by the `content-security-policy` plugin in `vite.config.ts` from `contentSecurityPolicy` in `src/lib/csp.ts`. The dev server goes without it, as hot reload needs inline scripts.

```text
default-src 'self'; script-src 'self' 'sha256-<theme script>'; style-src 'self';
img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'
```

- `script-src`: the bundle, and the inline theme script (it sets light or dark before the first paint), allowed by the sha256 hash of the same string that is inlined, never by `'unsafe-inline'` or `'unsafe-eval'`. Change the script and the hash follows at build time.
- `connect-src 'none'`: no `fetch`, XHR, WebSocket or beacon to anywhere, so even injected code could not send a log.
- `style-src 'self'`: the stylesheet. React and uPlot set styles through the CSSOM, which the policy allows; a parsed `style="..."` attribute would be blocked.
- `img-src data: blob:`: the PNG export draws the SVG export from a `blob:` URL.
- The meta tag sits right after `<meta charset>` and before every script, as it only covers what follows it.
- Not settable in a meta tag, and so absent: `frame-ancestors` (clickjacking protection), `report-uri` and `sandbox`. They would need HTTP headers, which GitHub Pages does not offer.

## Tests

| Claim                                                                                                                                       | Test                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| The policy is strict and names no other origin                                                                                              | `src/lib/csp.test.ts`                   |
| The built page carries the CSP and loads only its own                                                                                       | `e2e/privacy.spec.ts` (strict CSP test) |
| Open, zoom, export and import with the network blocked after load: no request, no CSP violation, no file name or log content in any request | `e2e/privacy.spec.ts`                   |
| Privacy statement visible                                                                                                                   | `e2e/privacy.spec.ts`                   |
| No analytics or telemetry packages                                                                                                          | `src/test/privacy.test.ts`              |
| The started worker is reused, no new fetch                                                                                                  | `src/features/upload/loadLog.test.ts`   |

The e2e tests run against the local production build; the deployed site is not tested automatically.
