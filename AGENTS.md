# AGENTS.md

Single source of truth for AI agents (and humans) working in this repository.
`CLAUDE.md` only imports this file; edit conventions here, nowhere else.
`README.md` is the human-facing quick start and must not contradict this file.

## Project

BimmerLink Log Visualizer: a React 19 + TypeScript (strict) + Vite single-page app.
The user drops a BimmerLink datalog (CSV) onto the page and gets dynamic, explorable charts: pick parameters, group them, change scales, zoom into events.

Hard rules:

- Client-side only. Logs never leave the browser: no network calls with user data, no backend, no analytics or telemetry, no third-party origins. The production build carries a strict Content-Security-Policy (`connect-src 'none'`); guarantees, policy and tests are in `docs/privacy.md`. A new inline script needs its hash in that policy.
- Spec-driven: every story has acceptance criteria that become tests first; CI and the local gate are the judge.
- Performance target: 50k rows x 13 channels interactive in under 1 s after parse.
- The initiative (`_bmad-output/initiative-bimmerlink-log-visualizer/initiative-bimmerlink-log-visualizer.md`) holds the vision, requirements and guardrails; read it before starting any story.

## Commands

Node 24 and npm 11 (`.nvmrc`, `engines` in `package.json`). Run everything from the repository root.

| Purpose           | Command                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Install           | `npm ci` (exact versions from `package-lock.json`; installs husky)                                    |
| Dev server        | `npm run dev` (http://localhost:5173)                                                                 |
| Unit tests        | `npm run test` (Vitest, single run); `npm run test:watch` for watch                                   |
| Lint              | `npm run lint`; `npm run lint:fix` applies fixes                                                      |
| Format            | `npm run format` writes; `npm run format:check` only verifies                                         |
| Typecheck         | `npm run typecheck` (`tsc -b` with the TypeScript 7 compiler)                                         |
| Build             | `npm run build` (runs typecheck, then `vite build` into `dist`)                                       |
| Preview build     | `npm run preview` (http://localhost:4173)                                                             |
| Full quality gate | `npm run check` = lint + format:check + typecheck + test                                              |
| Sync the catalog  | `npm run catalog:sync` (root catalog JSON into `src/data/catalog.json`)                               |
| e2e (Playwright)  | `npm run e2e` (run `npm run build` first; `npx playwright install chromium` once)                     |
| Performance       | `npm run e2e:perf` (after a build; one worker, quiet machine; `docs/performance.md`)                  |
| CI                | `.github/workflows/ci.yml` runs check, build and e2e (plus a non-blocking perf job), see `docs/ci.md` |

Before every commit/PR run `npm run check`, `npm run build` and `npm run e2e`; all must be green.
A pre-commit hook (husky + lint-staged) lints and formats staged files. Never bypass it with `--no-verify`.

CI is the workflow `CI` in `.github/workflows/ci.yml`: on every pull request and every push to `main` it runs `npm ci`, `npm run check`, `npm run build` and `npm run e2e` on Node from `.nvmrc`; a separate, non-blocking job `perf` runs `npm run e2e:perf`. A failing step is reproduced locally with the same npm script (`gh run view <id> --log-failed` shows the log). `docs/ci.md` explains the design choices and the documented branch protection (required check `CI`).

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
e2e/                       Playwright specs
src/
  main.tsx                 App entry point
  App.tsx                  Root component
  index.css                Global styles
  features/                One folder per user-facing feature (upload, charts, selection...)
  components/              UI shared by several features
  lib/                     Pure, framework-independent logic (CSV parsing, matching, downsampling...)
  data/                    Static data bundled with the app (e.g. the parameter catalog)
  test/                    Shared test setup (setup.ts) and repo-level tests
public/                    Static assets copied as-is
docs/                      Process docs (ci.md, deploy.md, privacy.md, process/labels-and-board.md)
_bmad/                     BMad setup: scripts and config (the render cache and the personal user config are git-ignored)
_bmad-output/              The ticket tree (initiative, epics, stories) and other BMad artifacts
scripts/                   Small helper scripts (set-project-status.ps1)
.github/                   CI workflow, issue forms and the pull request template
docs/adr/                  Architecture decision records (0001: charting library)
spikes/                    Throwaway, isolated mini-projects that back an ADR (own package.json)
bimmerlink_n55_parameter_catalog.csv   Source parameter catalog (CSV)
bimmerlink_n55_parameter_catalog.json  Same catalog as JSON (the source; code imports `src/data/catalog.ts`)
tests/fixtures/            Small, committed, byte-exact test inputs (README inside)
```

Rules:

- `src/lib/` has no React and no DOM imports; it takes plain values in and returns plain values out. Put logic there so it is trivially unit-testable.
- `src/features/<name>/` owns its components, hooks and local state. Features may import from `src/lib/` and `src/data/`; `src/lib/` never imports from `src/features/`. Features do not import from each other: lift shared code into `src/lib/` or a shared component folder.
- Heavy work stays off the main thread: `src/features/upload/parse.worker.ts` parses and validates, then transfers the typed arrays. Keep `src/lib/` functions worker-safe. `src/main.tsx` starts the worker with the page and `loadLogInWorker` keeps it after each log, so opening a log needs no network after load.
- jsdom has no Worker: UI tests pass `src/test/directLoader.ts` to `App`.
- Data model: column-oriented `LogDataset` (`time: Float64Array` plus `columns: { name, values: Float64Array }[]`), produced by `parseLogText` in `src/lib/parseLog.ts`. The parser is purpose-built (no PapaParse), header-driven, and maps bad cells to `NaN`; only a missing header or `Time` column throws a `LogParseError` (codes `empty`, `missing-time`). `readLog` in `src/lib/readLog.ts` validates on top of it: user-facing errors, warnings for what is tolerated, and a finite, non-decreasing time axis.
- Charting library: uPlot, decided in `docs/adr/0001-charting-library.md` (fallback: Apache ECharts). Do not add another chart library without a new ADR.
- Chart wiring: `uplot` (pinned exact version) is imported only by `src/features/charts/ChartPanel.tsx`, a test enforces it. Panels are functions of app state and never set each other. In jsdom `src/test/setup.ts` replaces uPlot with `src/test/fakeUplot.ts`, so real drawing is verified in a browser.
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
- e2e: Playwright specs in `e2e/` run against the production build and the real example logs (config `playwright.config.ts`). Cover there what jsdom cannot: canvas drawing, layout, workers, the network.

## Log format and catalog facts

Source of truth for these facts is the initiative plus the files in `Example/`; verify against them rather than assuming.

BimmerLink log (CSV):

- `Example/` has 6 files, one is a byte-identical duplicate (`Example/2026-10-24_12-29-08 2.csv` equals `Example/2026-10-24_12-29-08.csv`). 14k to 51k rows, 9 to 13 parameter columns besides `Time`, up to about 25 minutes.
- Header-driven: the first column is `Time` (unquoted, seconds, 3 decimals, starts at 0.000); every other column header is a double-quoted parameter label. Which columns exist, and in what order, differs per log: always read the header, never assume positions.
- Comma separated, `.` decimal point, LF line endings, no BOM, trailing newline, values unquoted. Be tolerant anyway (CRLF, BOM, empty/short files) and fail with friendly errors; those edge cases get fixtures in story #9.
- Sampling is irregular, about 30 ms between rows. Do not assume a fixed step.
- Label casing differs between logs (`Engine speed` vs `Engine Speed`), so label matching must be case-insensitive. Some labels are not in the catalog at all (for example `Target Rail Pressure`): unmatched columns must still work as plain series.
- Most channels start at `0` until their first sample arrives (staggered ramp-up) and are sample-and-hold afterwards, so leading zeros are mostly artefacts, not data (handling: `docs/ramp-up.md`; a placeholder is the text `0`, a sampled zero is `0.00`). A few channels already start with a non-zero value in row 0: the lambda adaptation factor `1.03` in `Example/2026-09-06_10-09-49.csv` and `Target Rail Pressure` `90.50` in both `2026-10-24_12-29-08` logs. Never assume the first sample is zero.
- Units are heterogeneous (rpm, bar, deg, lambda, degC, counters...), so multi-axis and normalisation are first-class needs.

Parameter catalog (`bimmerlink_n55_parameter_catalog.json`, mirrored in the CSV; the CSV starts with a UTF-8 BOM):

- 210 parameters for a BMW X4 M40i F26 (N55), in 17 categories (for example `Boost`, `Fuel / lambda`, `Ignition / knock`).
- Fields: `index`, `label`, `key` (snake_case, duplicates suffixed `_2`), `category`, `description`, `unit`, `role`, `confidence` (`high`/`medium`/`low`), `presets` (`1`..`6`, `1b`), `note`. The JSON has a `meta` block that documents the fields and a `parameters` array.
- `role` is one of `core`, `standard`, `flag`, `counter`, `raw`, `redundant`, `static`, `broken`. `core` are the primary analysis channels, `redundant`/`static`/`broken` are usually hidden by default.
- `src/lib/channels.ts` does the matching; the rules and the expected split per example log are in `docs/catalog-matching.md`.
- Match log columns to catalog entries by label, case-insensitively, not by `index` (log columns are a subset in another order). One label occurs twice in the catalog, so matching must tolerate duplicates.

Code imports the catalog from `src/data/catalog.ts`. Its JSON is a generated copy: edit the root files, run `npm run catalog:sync`, and `src/data/catalog.test.ts` fails while they differ.

Fixtures: committed test inputs live in `tests/fixtures/` (a README documents every file): the first 150 rows of each distinct example log (`trimmed_*.csv`) plus edge cases (BOM, CRLF line endings, empty file, header only, missing `Time` column, non-numeric cell, duplicate columns). Load them in tests with `src/test/fixtures.ts`. The full `Example/` logs stay available for e2e and performance tests.

## Story workflow

Work is tracked in the BMad ticket tree `_bmad-output/initiative-bimmerlink-log-visualizer/`: the initiative file, a breakdown table of the epics in build order, one folder per epic with its own breakdown table of stories, and one `story-*.md` file per story. The tree was migrated from the former GitHub issues (closed on 2026-11-22; do not reopen or create issues). The original issue numbers survive as `S<nn>` in the story notes, and the `story #n` in "(planned, story #n)" markers is that number. A story is addressed by its ref `<epic>.<entry>` (for example `2.2` is S14), its file name, or a unique title phrase.

The tree's tool is `.claude/skills/bmad-agent-po/scripts/tickets.py`; run it from the repository root as `uv run .claude/skills/bmad-agent-po/scripts/tickets.py --project-root . <command>` with `next` (what can start), `status` (every ticket) or `find <ref>`. It needs the active initiative: set `active_initiative = "initiative-bimmerlink-log-visualizer"` under `[core]` in the personal, git-ignored user config of `_bmad/custom/` (a `.user.toml` file there), or pass the initiative folder as an argument.

1. Pick a story from `ready_to_start` of `tickets.py next`: all its `after` prerequisites are done or in review. Parallel agents each take a different ready story. Read the story file, its epic file and the initiative. Acceptance criteria and the Definition of done are the spec.
2. Branch from the latest origin/main: `story/<nn>-<short-slug>` (`<nn>` is the story's original number). When several agents work at once, use your own git worktree (`git worktree add -b story/<nn>-<slug> ../wt-<nn> origin/main`, then `npm ci`) and never switch branches in the main checkout.
3. Build with `bmad-build` (interactive) or `bmad-build-auto` (unattended); they follow steps 4 to 6 and write the story's plan file. Working by hand, first commit `tickets.py mark <epic folder> <entry> in-progress` (the plan file `story-*-plan.md`; never edit a status in the story file).
4. Turn each acceptance criterion into a failing test first (Vitest; Playwright for e2e once it exists).
5. Implement the smallest change that makes the tests pass. Keep it scoped to the story: no other story's work, no silent scope growth; if something is missing, add the smallest stub and say so in the PR. Tick the acceptance criteria checkboxes in the story file as they are met.
6. Run `npm run check` and `npm run build`; both green. Update this file and the README if conventions changed.
7. Commit (never `--no-verify`), push, open a PR into `main`:
   - title `<imperative summary> (S<nn>)`;
   - body starts with `Story S<nn>` and the path of the story file, then summary, how each acceptance criterion is met (checklist), test evidence (commands and results), screenshots if UI;
   - commit messages end with the `Co-Authored-By: ...` trailer and PR bodies with the `Generated with Claude Code` line that your harness specifies.
8. Never force-push `main`; only QA merges (squash, delete branch).

Scope, slicing, order and `after` change only through the product owner (`bmad-agent-po`, Sofia): an agent never edits another story's file, an epic's breakdown table or the initiative to suit its own work; it asks for a replan instead.

### Status flow and who moves it

A story's status lives in its plan file (`story-*-plan.md`, next to the story file), written by the BMad builds or by `tickets.py mark`: `draft`, `ready-for-dev`, `in-progress`, `in-review`, `built`, `done`, `blocked`, `dropped`. `tickets.py` reports it as the board state `backlog`, `in-progress`, `review` or `done`. Whoever takes over or hands on a story marks it in the same PR.

| Role      | Moves the story                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------- |
| Developer | Start of work: `in-progress`. PR open and the local gate green: `in-review`.                      |
| Reviewer  | Approves: leaves `in-review`. Requests changes: `in-progress` (developer sets `in-review` again). |
| QA        | Validates every acceptance criterion, merges, marks `done`. Fails: `in-progress`, no merge.       |

The reviewer is a different agent than the developer and is read-only on code; reviews are posted on the PR with a first line `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED`.
Do not touch stories other than your own.

Pull requests use `.github/pull_request_template.md`. `docs/process/labels-and-board.md` describes the former GitHub board flow and is kept for history only. The legacy helper `scripts/set-project-status.ps1` (`-Issue <n> -Status "<column>"`, needs `gh` signed in with the `project` scope) edited that board; do not use it for new work.

## Agent skills

Skills are third-party bundles pinned by commit in `skills-lock.json`, installed twice with identical content: `.claude/skills/` is read by Claude Code, `.agents/skills/` by other agents that follow the `.agents` convention. Do not hand-edit them (they are excluded from ESLint via `globalIgnores` in `eslint.config.js` and from Prettier via `.prettierignore`); update them by reinstalling and keep both folders in sync.
Each skill is a folder with a SKILL.md file (when to use it), often with a references folder with detail files that are loaded on demand.

Engineering skills (source Jeffallan/claude-skills):

| Skill               | Use it for in this repo                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-expert`      | Building React 19 components, hooks, state management, performance work. Ignore its Next.js / Server Components parts: this is a Vite SPA. |
| `code-reviewer`     | Structured PR / diff review (correctness, security, performance, maintainability); the reviewer agent's checklist. Read-only tools.        |
| `code-documenter`   | JSDoc/TSDoc, user guides and README/doc work. Ignore the OpenAPI and Python parts.                                                         |
| `security-reviewer` | Security review of a diff or the dependency tree. Client-side only app: focus on XSS, dependencies and the no-upload guarantee.            |

Planning and delivery skills (BMAD method, source bmad-code-org/BMAD-METHOD). Start with `bmad` when unsure what to run next.

| Skill                                                                                                      | Use it for in this repo                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `bmad`                                                                                                     | Help, next-step recommendation, installation status.                                                 |
| `bmad-agent-po`                                                                                            | Product owner: slice epics into stories, refine, validate and replan the tickets in `_bmad-output/`. |
| `bmad-agent-pm`, `bmad-agent-analyst`, `bmad-agent-architect`, `bmad-agent-ux-designer`, `bmad-agent-dev`  | Persona agents: product manager, analyst, architect, UX designer, developer.                         |
| `bmad-build`, `bmad-build-auto`                                                                            | Implement a story end to end (interactive, or unattended for an orchestrator).                       |
| `bmad-code-review`, `bmad-review`, `bmad-walkthrough`                                                      | Parallel code review, review lenses on a diff or document, guided human walkthrough.                 |
| `bmad-architecture`, `bmad-ux`, `bmad-project-context`                                                     | Architecture document, DESIGN.md / EXPERIENCE.md, maintain the agent instructions.                   |
| `bmad-qa-generate-e2e-tests`, `bmad-retrospective`                                                         | e2e tests for working features, epic retrospective.                                                  |
| `bmad-advanced-elicitation`, `bmad-brainstorming`, `bmad-forge-idea`, `bmad-party-mode`, `bmad-facilitate` | Ideation and document-coaching helpers.                                                              |
| `bmad-deep-recon`, `bmad-ingest`, `bmad-shard-pro`, `bmad-customize`                                       | Research, notes from transcripts, shard long docs, customize BMAD skills.                            |
| `bmod-core-tools`, `bmod-method`                                                                           | Required BMAD metadata. Never invoke.                                                                |

BMAD skills work on the ticket tree in `_bmad-output/` (repo store, no external tracker), set up by `_bmad/`; see Story workflow. The `fastapi-expert` skill was removed (no backend).

## Documentation conventions

- Keep this file short, factual and verified. Prefer a pointer to the source of truth (a config file, an issue) over a copied value.
- A command or path that does not exist yet must be on a line that contains `(planned, story #n)`; the test in `src/test/agents-md.test.ts` skips existence checks on those lines and checks all others. The reverse is enforced too: a backticked path or `npm run` script on a planned line that now exists fails the test. When the story lands, remove the marker in the same PR and describe the real thing. Do not backtick existing paths on a planned line.
- Write file and directory paths in backticks so that the test can verify them. Paths with placeholders or globs (`<n>`, `*`) are not checked, and anything in backticks that has a slash or a file extension is treated as a path, so do not backtick other things that look like that (repository names, branch names, bare extensions).
