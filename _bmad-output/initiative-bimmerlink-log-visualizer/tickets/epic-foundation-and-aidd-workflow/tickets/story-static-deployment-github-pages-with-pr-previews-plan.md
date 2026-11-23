---
title: 'Static deployment (GitHub Pages) with PR previews'
type: chore
ticket: 9
created: '2026-11-22'
status: done
baseline_revision: '49599ffa1c30d566b32485775370fd18d4946e02'
route: full
route_source: auto
risk: low
review: quick
review_source: pinned
lenses_ran: [quick]
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no public URL for the app, so a user must clone the repo to try it, and a reviewer cannot see what a PR builds.

**Approach:** Add one GitHub Actions workflow that builds the app with a configurable Vite base path, deploys the build of `main` to GitHub Pages, and uploads the build of every PR as a downloadable artifact (no hosted preview). Add the status badge to the README and document the one-time repository setup.

## Boundaries & Constraints

**Always:** Client-side only, no network call carries log data; least-privilege `permissions` per job (Pages write and `id-token` only on the deploy job); the base path comes from the repository name, never hard-coded in app code; `npm run dev` and `npm run build` without `BASE_PATH` keep serving at `/`; actions pinned to a major version tag like `ci.yml`.

**Never:** Trigger a deployment, push, or change repository settings from this work; add a hosted per-PR preview service or third-party action beyond the official GitHub Pages and artifact actions; touch the existing `CI` workflow or its required check name; add analytics.

## I/O & Edge-Case Matrix

| Scenario                 | Input / State                 | Expected Output / Behavior                                                                          | Error Handling                 |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| Push to `main`           | workflow runs                 | `build` job uploads the Pages artifact, `deploy` job publishes it to the `github-pages` environment | a failed build skips deploy    |
| Pull request             | workflow runs                 | `build` job uploads `dist` as artifact `preview-pr-<number>` (7 days), no deploy job                | fork PRs only need read access |
| `BASE_PATH` set at build | `/Bimmerlink_visualizer/`     | `dist/index.html` references `/Bimmerlink_visualizer/assets/...`                                    | none                           |
| `BASE_PATH` unset        | local `npm run dev` / `build` | base is `/`                                                                                         | none                           |

</frozen-after-approval>

## Code Map

- `vite.config.ts` -- Vite and Vitest config; has no `base` yet; `index.html` uses absolute `/favicon.svg` and `/src/main.tsx`, which Vite rewrites with `base`
- `.github/workflows/ci.yml` -- pattern to mirror (checkout@v7, setup-node@v7 with `.nvmrc` and npm cache, `npm ci`, env `CI`/`NO_COLOR`/`HUSKY`); must stay unchanged, its job name `CI` is the branch-protection check
- `src/test/github-templates.test.ts` -- pattern for repo-level tests: `import.meta.glob(..., { query: '?raw' })` plus the `yaml` package (already a devDependency)
- `src/test/agents-md.test.ts` -- every path written in `AGENTS.md` must exist (line 101 already covers `.github/workflows/ci.yml`)
- `README.md`, `docs/ci.md` -- badge goes under the README title; `docs/ci.md` is the style model for the new `docs/deploy.md`
- Repository facts (2026-11-22, after approval): `AnthoFio/Bimmerlink_visualizer` is now public, so Pages needs no paid plan; the Pages site is still not configured (API 404), so a human must set Settings > Pages > Source to GitHub Actions before the first deploy can succeed

## Tasks & Acceptance

**Execution:**

- [ ] `src/test/deploy.test.ts` -- failing tests first: workflow triggers and permissions, jobs, base path env, README badge, the Vite `base` default and override -- turns each acceptance criterion into a test
- [ ] `vite.config.ts` -- `base: process.env.BASE_PATH ?? '/'` -- one source of truth for the base path
- [ ] `.github/workflows/deploy.yml` -- `build` job (checkout, setup-node, `npm ci`, `npm run build` with `BASE_PATH=/${{ github.event.repository.name }}/`, then `upload-pages-artifact` on push or `upload-artifact` `preview-pr-<n>` on PR) and `deploy` job (`needs: build`, only on push to `main`, `environment: github-pages`, `deploy-pages`); concurrency group `pages`
- [ ] `README.md` -- deploy status badge linking to the workflow, and the live URL
- [ ] `docs/deploy.md` -- how it works, the one-time setup (human step), how to fetch a PR preview artifact, rollback; `AGENTS.md` -- list `docs/deploy.md` in the docs line

**Acceptance Criteria:**

- Given a push to `main`, when `deploy.yml` runs, then the build is deployed to GitHub Pages with the repository name as base path.
- Given a pull request, when `deploy.yml` runs, then a `preview-pr-<number>` artifact holds the built `dist` and nothing is deployed.
- Given the README, when it is opened, then it shows a badge for the `deploy.yml` workflow.
- Given `BASE_PATH` is unset, when the app is built or served locally, then it uses `/` as before.

## Implementation Notes

## Plan Change Log

## Review Triage Log

Pass 1 (quick, lens: quick): 0 high, 0 medium, 4 low, 3 false, 0 maybe-false. No unmet acceptance criteria reported.

| #   | Finding                                                                                   | Verdict | Route    | Evidence                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | vite.config.ts: `??` keeps an empty BASE_PATH as base '' (a relative base) instead of `/` | low     | patch    | Real: an exported-but-blank BASE_PATH yields base ''; the workflow never sets it blank, the fix is one operator (`                                                        |     | `) plus a test case. |
| 2   | deploy.yml concurrency group is `pages-<pr number or ref>`, plan text says group `pages`  | false   | rejected | The group still contains `pages`; separating PR runs from `main` keeps PR runs from cancelling or queueing a deploy, so "one deployment at a time" holds. No bad outcome. |
| 3   | deploy.test.ts: `vi.stubEnv(name, undefined)` may not be supported                        | false   | rejected | Vitest 5.1.1 is installed and the test ran and passed (9 of 9).                                                                                                           |
| 4   | deploy.test.ts imports vite.config.ts from src without declaring node types               | false   | rejected | `npm run typecheck` passes with the file as is.                                                                                                                           |
| 5   | deploy.test.ts: regex over raw YAML would also match a `uses:` inside a comment           | low     | rejected | No such comment exists and a future one fails the test loudly, not silently; a fix means rewriting the check to walk parsed steps, more than a direct correction.         |
| 6   | docs/deploy.md hard-codes the repository name in the preview commands                     | low     | patch    | Real: the commands go stale on a rename or fork; fix is a direct edit to placeholders.                                                                                    |
| 7   | Plan: task checkboxes unticked, `context` empty                                           | low     | rejected | Its fix is to edit this build's plan.                                                                                                                                     |

## Design Notes

A PR preview here is an artifact, not a hosted site: Pages serves one site per repository and a private repository cannot host per-PR URLs without extra services. The documented alternative in `docs/deploy.md` is `gh run download` plus `npm run preview`-style serving of the unpacked `dist` with the same base path.

## Verification

**Commands:**

- `npm run check` -- expected: lint, format, typecheck and all tests pass
- `npm run build` -- expected: builds with base `/`
- `BASE_PATH=/Bimmerlink_visualizer/ npm run build` and then search `dist/index.html` for `/Bimmerlink_visualizer/assets/` -- expected: found

**Manual checks (if no CLI):**

- The workflow cannot be run from here; read `deploy.yml` once for the two triggers, the `if:` on `deploy`, and the per-job `permissions`.
