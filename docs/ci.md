# Continuous integration

The workflow in `.github/workflows/ci.yml` (named `CI`) is the objective gate for every change.

## What it does

It runs on every pull request and on every push to `main`, on `ubuntu-latest`:

1. `actions/checkout`
2. `actions/setup-node`: Node version read from `.nvmrc`, npm cache enabled (keyed on `package-lock.json`)
3. `npm ci`
4. `npm run check`: ESLint, Prettier check, TypeScript typecheck and Vitest unit tests
5. `npm run build`: typecheck plus production build
6. `npx playwright install --with-deps chromium`, then `npm run e2e`: the browser tests against the production build; on a failure the screenshots and traces are uploaded as `e2e-failure`

A second job, `perf` ("Performance budgets"), builds and runs `npm run e2e:perf` with `continue-on-error: true`, so it never fails the required check `CI`; it uploads its measurements as `perf-results` (see `docs/performance.md`).

The same commands run locally, so a failing CI step is reproduced with the same `npm run ...`.

Design choices:

- No interactive steps; `CI=true` and `NO_COLOR=1` keep the logs plain text, and each step has its own name, so the failing step and its output are easy to find for people and agents (`gh run view <id> --log-failed`).
- `permissions: contents: read` (least privilege); the workflow has no secrets and no write access.
- A `concurrency` group per PR/branch cancels superseded runs.
- Actions are pinned to a major version tag (`@v7` for checkout and setup-node, `@v4` for the artifact and Pages actions).
- `HUSKY=0` skips git hook installation during `npm ci`.

## Branch protection on `main` (documented, not enabled)

Branch protection is a repository setting and is not applied by this repository's code.
To make merging depend on CI, configure it on GitHub under **Settings > Branches > Add branch ruleset** (or classic **Branch protection rule**) for branch name pattern `main`:

| Setting                                                    | Value                                    |
| ---------------------------------------------------------- | ---------------------------------------- |
| Require a pull request before merging                      | on (0 required approvals for a solo dev) |
| Require status checks to pass before merging               | on                                       |
| Required status check                                      | `CI` (the job name in `ci.yml`)          |
| Require branches to be up to date before merging (strict)  | on                                       |
| Block force pushes / restrict deletions                    | on                                       |
| Do not allow bypassing the above settings (include admins) | on                                       |

The `CI` check only becomes selectable after the workflow has run at least once.

The equivalent with the GitHub CLI:

```sh
gh api -X PUT repos/AnthoFio/Bimmerlink_visualizer/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["CI"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Note: for a private repository, GitHub only offers branch protection and rulesets on a paid plan (Pro, Team or Enterprise).

## End-to-end tests

After the build, CI installs Chromium (`npx playwright install --with-deps chromium`) and runs `npm run e2e` headless against the production build. When the run fails, the screenshots and traces are uploaded as the artifact `e2e-failure`. Locally: `npm run build`, then `npm run e2e`.

## Performance budgets (non-blocking)

A second job, `perf` (shown as `Performance budgets`), builds, installs Chromium and runs `npm run e2e:perf` (see `docs/performance.md`). It has `continue-on-error: true`, so a slow runner never blocks a merge, and it is not the required check `CI`. Every perf test writes its numbers to a `perf.json`, which the job uploads as the artifact `perf-results`, also when a budget fails.
