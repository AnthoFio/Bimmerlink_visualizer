# BimmerLink Log Visualizer

Drop a BimmerLink datalog (CSV) onto the page and it turns into dynamic, explorable charts: pick the parameters to show, group them, change scales and zoom into events.
Everything runs in the browser, so your logs never leave your machine.
Stack: React 19, TypeScript (strict) and Vite.

## Getting started

Requires Node 24 (see `.nvmrc`; `nvm use` picks it up).

```sh
npm ci            # install exact dependencies from package-lock.json
npm run dev       # dev server with hot reload (http://localhost:5173)
npm run build     # type-check (tsc -b) and production build into dist/
npm run preview   # serve the production build (http://localhost:4173)
```

## Folder structure

```text
Example/          Sample BimmerLink logs (byte-exact, never edit)
src/
  main.tsx        App entry point
  App.tsx         Root component (placeholder page)
  features/       One folder per user-facing feature (upload, charts, selection...);
                  each owns its components, hooks and local state
  lib/            Pure, framework-independent logic (CSV parsing, downsampling...);
                  no React imports, easy to unit test
  data/           Static data bundled with the app (e.g. the parameter catalog)
public/           Static assets copied as-is
tests/fixtures/   Test input files (byte-exact, created by later stories)
bimmerlink_n55_parameter_catalog.(csv|json)   Source parameter catalog (210 parameters)
```

Line endings: `.gitattributes` normalises text to LF but keeps `Example/**` and `tests/fixtures/**` byte-exact.
