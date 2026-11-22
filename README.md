# BimmerLink Log Visualizer

[![Deploy](https://github.com/AnthoFio/Bimmerlink_visualizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/AnthoFio/Bimmerlink_visualizer/actions/workflows/deploy.yml)

Live: https://anthofio.github.io/Bimmerlink_visualizer/ (setup and previews: `docs/deploy.md`)

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

## Quality gates

```sh
npm run check         # everything below in one go: lint + format:check + typecheck + test
npm run lint          # ESLint (typescript-eslint, react-hooks, react-refresh); lint:fix applies fixes
npm run format        # Prettier, write; format:check only verifies (used by check)
npm run typecheck     # tsc -b (TypeScript 7)
npm run test          # Vitest + Testing Library + jsdom, single run; test:watch for watch mode
```

Run `npm run check` and `npm run build` before opening a PR.
Agent and contributor conventions (architecture, naming, testing, log and catalog facts, story workflow, skills) are in [`AGENTS.md`](AGENTS.md); `CLAUDE.md` just imports it.
The same checks run in CI on every PR; see [docs/ci.md](docs/ci.md) (incl. the recommended branch protection).
Tests live next to the code as `*.test.ts(x)`; shared setup is in `src/test/setup.ts`.

A pre-commit hook (husky + lint-staged) lints and formats the staged files; it is installed automatically by `npm install` / `npm ci` (the `prepare` script).
Never bypass it with `--no-verify`; set `HUSKY=0` only for tooling that must skip hook installation.
`Example/`, `tests/fixtures/`, the parameter catalog and lock files are excluded from ESLint and Prettier, so they are never reformatted.

### TypeScript 7 and typescript-eslint

`typescript-eslint` still needs the TypeScript 6 JavaScript API and refuses to run on TypeScript 7
(see [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).
Following Microsoft's side-by-side guidance, `package.json` therefore aliases:

- `typescript` -> `@typescript/typescript6` (the TS 6 API that typescript-eslint imports),
- `typescript7` -> `typescript@~7.0` (the native compiler used for `typecheck` and `build`).

The scripts call `node ./node_modules/typescript7/bin/tsc` explicitly, because the bare `tsc` bin name is claimed by the TS 6 package and must not be used.
`npm run typecheck` is authoritative. A bare `tsc` / `npx tsc` and the editor's TypeScript service use TS 6 (the `typescript` alias), so they can disagree with it; treat the editor's squiggles as hints and `npm run typecheck` as the verdict.
Once typescript-eslint supports TypeScript 7, drop the `typescript7` alias and point `typescript` back at `~7.x`.

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
docs/adr/         Architecture decision records (ADR 0001: charting library)
spikes/           Throwaway, isolated mini-projects that back an ADR (own package.json; see spikes/README.md)
tests/fixtures/   Byte-exact test inputs derived from Example/ (see tests/fixtures/README.md)
bimmerlink_n55_parameter_catalog.(csv|json)   Source parameter catalog (210 parameters)
```

Spikes under `spikes/` are excluded from ESLint, Prettier, `tsc -b` and Vitest, so `npm run check` and `npm run build` never touch them.
Decisions that are expensive to reverse are recorded as ADRs in `docs/adr/` (a Vitest test asserts the ADR structure).

Line endings: `.gitattributes` normalises text to LF but keeps `Example/**` and `tests/fixtures/**` byte-exact.

## Process

Issue forms, the PR template, the label taxonomy and the project board status flow are described in [docs/process/labels-and-board.md](docs/process/labels-and-board.md).
