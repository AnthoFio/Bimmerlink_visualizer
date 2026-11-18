# AGENTS.md

Single source of truth for AI agents (and humans) working in this repository.
`CLAUDE.md` only imports this file; edit conventions here, nowhere else.
`README.md` is the human-facing quick start and must not contradict this file.

## Project

BimmerLink Log Visualizer: a React 19 + TypeScript (strict) + Vite single-page app.
The user drops a BimmerLink datalog (CSV) onto the page and gets dynamic, explorable charts: pick parameters, group them, change scales, zoom into events.

Hard rules:

- Client-side only. Logs never leave the browser: no network calls with user data, no backend, no analytics on log content.
- Spec-driven: every story has acceptance criteria that become tests first; CI and the local gate are the judge.
- Performance target: 50k rows x 13 channels interactive in under 1 s after parse.
- Epic #1 holds the vision, scope and guardrails; read it before starting any story.

## Commands

Node 24 and npm 11 (`.nvmrc`, `engines` in `package.json`). Run everything from the repository root.

| Purpose           | Command                                                             |
| ----------------- | ------------------------------------------------------------------- |
| Install           | `npm ci` (exact versions from `package-lock.json`; installs husky)  |
| Dev server        | `npm run dev` (http://localhost:5173)                               |
| Unit tests        | `npm run test` (Vitest, single run); `npm run test:watch` for watch |
| Lint              | `npm run lint`; `npm run lint:fix` applies fixes                    |
| Format            | `npm run format` writes; `npm run format:check` only verifies       |
| Typecheck         | `npm run typecheck` (`tsc -b` with the TypeScript 7 compiler)       |
| Build             | `npm run build` (runs typecheck, then `vite build` into `dist`)     |
| Preview build     | `npm run preview` (http://localhost:4173)                           |
| Full quality gate | `npm run check` = lint + format:check + typecheck + test            |
| e2e (Playwright)  | `npm run e2e` (planned, story #10)                                  |
| CI                | `.github/workflows/ci.yml` runs check + build, see `docs/ci.md`     |

Before every commit/PR run `npm run check` and `npm run build`; both must be green.
A pre-commit hook (husky + lint-staged) lints and formats staged files. Never bypass it with `--no-verify`.

CI is the workflow `CI` in `.github/workflows/ci.yml`: on every pull request and every push to `main` it runs `npm ci`, `npm run check` and `npm run build` on Node from `.nvmrc`. A failing step is reproduced locally with the same npm script (`gh run view <id> --log-failed` shows the log). `docs/ci.md` explains the design choices and the documented branch protection (required check `CI`).

### TypeScript 6 / 7 quirk (read this before touching the type setup)

`typescript-eslint` cannot run on TypeScript 7 yet, so `package.json` aliases two packages:

- `typescript` -> `@typescript/typescript6` (the TS 6 API that typescript-eslint imports),
- `typescript7` -> `typescript@~7.0` (the native compiler).

The scripts call `node ./node_modules/typescript7/bin/tsc` explicitly, so `npm run typecheck` is authoritative (it is also what `npm run build` and CI run).
A bare `tsc`, `npx tsc` or the editor's TypeScript service resolves to the TS 6 package, so they can differ from the real result in edge cases: never use them as the verdict and never "fix" an error that only shows up there.
When typescript-eslint supports TS 7, drop the `typescript7` alias and point `typescript` back at `~7.x`.

## Architecture and folder layout

```text
Example/                   Real BimmerLink logs (byte-exact, never edit, never reformat)
src/
  main.tsx                 App entry point
  App.tsx                  Root component
  index.css                Global styles
  features/                One folder per user-facing feature (upload, charts, selection...)
  lib/                     Pure, framework-independent logic (CSV parsing, matching, downsampling...)
  data/                    Static data bundled with the app (e.g. the parameter catalog)
  test/                    Shared test setup (setup.ts) and repo-level tests
public/                    Static assets copied as-is
docs/                      Process docs (ci.md, process/labels-and-board.md)
scripts/                   Small helper scripts (set-project-status.ps1)
.github/                   CI workflow, issue forms and the pull request template
docs/adr/                  Architecture decision records (0001: charting library)
spikes/                    Throwaway, isolated mini-projects that back an ADR (own package.json)
bimmerlink_n55_parameter_catalog.csv   Source parameter catalog (CSV)
bimmerlink_n55_parameter_catalog.json  Same catalog as JSON (prefer this one in code)
tests/fixtures/            Small, committed, byte-exact test inputs (README inside)
```

Rules:

- `src/lib/` has no React and no DOM imports; it takes plain values in and returns plain values out. Put logic there so it is trivially unit-testable.
- `src/features/<name>/` owns its components, hooks and local state. Features may import from `src/lib/` and `src/data/`; `src/lib/` never imports from `src/features/`. Features do not import from each other: lift shared code into `src/lib/` or a shared component folder.
- Heavy work (CSV parsing of 50k rows) belongs in a Web Worker so the UI stays responsive (planned, story #15).
- Keep `src/lib/` functions worker-safe, so that move is cheap.
- Data model: column-oriented dataset (one typed array per channel plus a shared time array) (planned, story #14).
- Charting library: uPlot, decided in `docs/adr/0001-charting-library.md` (fallback: Apache ECharts). Do not add another chart library without a new ADR. `uplot` becomes a dependency in the first chart story (#25, pinned exact version) and is imported only by one thin chart-panel component (planned, story #25); the x window, axis ranges and cursor live in an app-level store, the min/max downsampling is a pure function in `src/lib/`.
- `spikes/` holds throwaway evidence projects with their own `package.json` and `node_modules`; ESLint, Prettier, `tsc -b`, Vitest and the app build ignore them, and the app never depends on them. Decisions that are expensive to reverse get an ADR in `docs/adr/`; `src/docs/adr.test.ts` asserts the ADR structure.

## Naming and code conventions

- Files: React components in `PascalCase` files with the tsx extension (one main component per file, same name as the file); hooks `use<Name>.ts`; everything else `camelCase` files with the ts extension; folders `kebab-case`. Tests sit next to the code: `thing.test.ts(x)`.
- Named exports, except where a tool requires a default (`App` is the root component's default export). `eslint-plugin-react-refresh` requires component files to export only components.
- Formatting is owned by Prettier (no semicolons, single quotes, trailing commas, 100 columns, see `.prettierrc.json`); `.editorconfig` covers the rest. Do not hand-format.
- TypeScript is `strict` plus `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for types) and `erasableSyntaxOnly` (no `enum`, no namespaces, no constructor parameter properties). Imports of local files may include the ts/tsx extension.
- No `any`; prefer `unknown` plus narrowing. No `console.log` left behind.
- Text files are LF (`.gitattributes`). `Example/**` and `tests/fixtures/**` are `-text`: byte-exact, excluded from ESLint and Prettier (`.prettierignore`, `eslint.config.js`).

## Testing conventions

- Vitest + Testing Library + jest-dom, jsdom environment, config in `vite.config.ts`, setup in `src/test/setup.ts`. Vitest globals are off: import `describe`, `it`, `expect` from `vitest`.
- Only files matching `src/**/*.test.{ts,tsx}` run. Colocate unit tests with the code under test.
- Query the DOM the way a user does (`getByRole`, `getByLabelText`); avoid test ids and implementation details.
- Tests are deterministic and offline. Use the small fixtures in `tests/fixtures/` for unit tests, loaded with the helpers in `src/test/fixtures.ts` (`loadFixtureBytes`, `loadFixtureText`, `loadExampleBytes`; Node-only, not part of the browser bundle); use the real `Example/` logs only for e2e and performance tests. `src/test/fixtures.test.ts` asserts the documented properties of every fixture byte-exactly.
- `src/test/agents-md.test.ts` keeps this file honest: every `npm run <script>` and every path written here must exist, unless the line is marked `(planned, story #n)`; and a path or script on a planned line must NOT exist yet, so a stale marker fails the test.
- e2e with Playwright against the real example logs (planned, story #10). Until it exists, UI behaviour is covered by Testing Library tests.

## Log format and catalog facts

Source of truth for these facts is epic #1 plus the files in `Example/`; verify against them rather than assuming.

BimmerLink log (CSV):

- `Example/` has 6 files, one is a byte-identical duplicate (`Example/2026-10-24_12-29-08 2.csv` equals `Example/2026-10-24_12-29-08.csv`). 14k to 51k rows, 9 to 13 parameter columns besides `Time`, up to about 25 minutes.
- Header-driven: the first column is `Time` (unquoted, seconds, 3 decimals, starts at 0.000); every other column header is a double-quoted parameter label. Which columns exist, and in what order, differs per log: always read the header, never assume positions.
- Comma separated, `.` decimal point, LF line endings, no BOM, trailing newline, values unquoted. Be tolerant anyway (CRLF, BOM, empty/short files) and fail with friendly errors; those edge cases get fixtures in story #9.
- Sampling is irregular, about 30 ms between rows. Do not assume a fixed step.
- Label casing differs between logs (`Engine speed` vs `Engine Speed`), so label matching must be case-insensitive. Some labels are not in the catalog at all (for example `Target Rail Pressure`): unmatched columns must still work as plain series.
- Most channels start at `0` until their first sample arrives (staggered ramp-up) and are sample-and-hold afterwards, so leading zeros are mostly artefacts, not data (handling: story #18). A few channels already start with a non-zero value in row 0: the lambda adaptation factor `1.03` in `Example/2026-09-06_10-09-49.csv` and `Target Rail Pressure` `90.50` in both `2026-10-24_12-29-08` logs. Never assume the first sample is zero.
- Units are heterogeneous (rpm, bar, deg, lambda, degC, counters...), so multi-axis and normalisation are first-class needs.

Parameter catalog (`bimmerlink_n55_parameter_catalog.json`, mirrored in the CSV; the CSV starts with a UTF-8 BOM):

- 210 parameters for a BMW X4 M40i F26 (N55), in 17 categories (for example `Boost`, `Fuel / lambda`, `Ignition / knock`).
- Fields: `index`, `label`, `key` (snake_case, duplicates suffixed `_2`), `category`, `description`, `unit`, `role`, `confidence` (`high`/`medium`/`low`), `presets` (`1`..`6`, `1b`), `note`. The JSON has a `meta` block that documents the fields and a `parameters` array.
- `role` is one of `core`, `standard`, `flag`, `counter`, `raw`, `redundant`, `static`, `broken`. `core` are the primary analysis channels, `redundant`/`static`/`broken` are usually hidden by default.
- Match log columns to catalog entries by label, case-insensitively, not by `index` (log columns are a subset in another order). One label occurs twice in the catalog, so matching must tolerate duplicates.

Fixtures: committed test inputs live in `tests/fixtures/` (a README documents every file): the first 150 rows of each distinct example log (`trimmed_*.csv`) plus edge cases (BOM, CRLF line endings, empty file, header only, missing `Time` column, non-numeric cell, duplicate columns). Load them in tests with `src/test/fixtures.ts`. The full `Example/` logs stay available for e2e and performance tests.

## Story workflow

Work is tracked as GitHub issues in AnthoFio/Bimmerlink_visualizer on project board 7 (owner `AnthoFio`). Epic #1 > features > stories.

1. Read the issue (`gh issue view <n>`) and epic #1. Acceptance criteria and the Definition of done are the spec.
2. Branch from the latest origin/main: `story/<n>-<short-slug>`. When several agents work at once, use your own git worktree (`git worktree add -b story/<n>-<slug> ../wt-<n> origin/main`, then `npm ci`) and never switch branches in the main checkout.
3. Turn each acceptance criterion into a failing test first (Vitest; Playwright for e2e once it exists).
4. Implement the smallest change that makes the tests pass. Keep it scoped to the ticket: no other story's work, no silent scope growth; if something is missing, add the smallest stub and say so in the PR.
5. Run `npm run check` and `npm run build`; both green. Update this file and the README if conventions changed.
6. Commit (never `--no-verify`), push, open a PR into `main`:
   - title `<imperative summary> (#<n>)`;
   - body starts with `Closes #<n>`, then summary, how each acceptance criterion is met (checklist), test evidence (commands and results), screenshots if UI;
   - commit messages end with the `Co-Authored-By: ...` trailer and PR bodies with the `Generated with Claude Code` line that your harness specifies.
7. Never force-push `main`; only QA merges (squash, delete branch).

### Status flow and who moves it

The project board field `Status` is `Backlog` > `Ready` > `In progress` > `In review` > `Done`. Whoever takes over or hands on a ticket sets the Status themselves.

| Role      | Moves the ticket                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------- |
| Developer | Start of work: `In progress`. PR open and the local gate green: `In review`.                      |
| Reviewer  | Approves: leaves `In review`. Requests changes: `In progress` (developer sets `In review` again). |
| QA        | Validates every acceptance criterion, merges, sets `Done`. Fails: `In progress`, no merge.        |

The reviewer is a different agent than the developer and is read-only on code; reviews are posted on the PR with a first line `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED`.
Do not touch tickets other than your own.

Set the Status with the helper `scripts/set-project-status.ps1` (PowerShell, from the repository root):

```text
powershell -File scripts/set-project-status.ps1 -Issue <n> -Status "In progress"
```

`-Status` is one of `Backlog`, `Ready`, `In progress`, `In review`, `Done`; `-Issue` takes several numbers (`-Issue 5,8`). It edits project 7 of owner `AnthoFio` through the GitHub CLI, so `gh` must be signed in with the `project` scope (`gh auth refresh -s project`) and the issue must already be on the board.

Issues are created from the forms in `.github/ISSUE_TEMPLATE/`, pull requests use `.github/pull_request_template.md`, and `docs/process/labels-and-board.md` defines the label taxonomy (type + `area:*` + optional `mvp`) and the full Status flow.

## Agent skills

Skills are third-party bundles (source Jeffallan/claude-skills on GitHub, pinned by commit in `skills-lock.json`), installed twice with identical content: `.claude/skills/` is read by Claude Code, `.agents/skills/` by other agents that follow the `.agents` convention. Do not hand-edit them (they are excluded from ESLint via `globalIgnores` in `eslint.config.js` and from Prettier via `.prettierignore`); update them by reinstalling and keep both folders in sync.
Each skill is a folder with a SKILL.md file (when to use it) and a references folder with detail files that are loaded on demand.

| Skill             | Use it for in this repo                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-expert`    | Building React 19 components, hooks, state management, performance work. Ignore its Next.js / Server Components parts: this is a Vite SPA. |
| `code-reviewer`   | Structured PR / diff review (correctness, security, performance, maintainability); the reviewer agent's checklist. Read-only tools.        |
| `code-documenter` | JSDoc/TSDoc, user guides and README/doc work. Ignore the OpenAPI and Python parts.                                                         |
| `fastapi-expert`  | Python FastAPI backends. Not applicable: the app has no backend. Do not use it.                                                            |

## Documentation conventions

- Keep this file short, factual and verified. Prefer a pointer to the source of truth (a config file, an issue) over a copied value.
- A command or path that does not exist yet must be on a line that contains `(planned, story #n)`; the test in `src/test/agents-md.test.ts` skips existence checks on those lines and checks all others. The reverse is enforced too: a backticked path or `npm run` script on a planned line that now exists fails the test. When the story lands, remove the marker in the same PR and describe the real thing. Do not backtick existing paths on a planned line.
- Write file and directory paths in backticks so that the test can verify them. Paths with placeholders or globs (`<n>`, `*`) are not checked, and anything in backticks that has a slash or a file extension is treated as a path, so do not backtick other things that look like that (repository names, branch names, bare extensions).
