---
id: F02
type: feature
title: 'Foundation and AIDD workflow'
issue: 2
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/2
status: 'In progress'
github_state: open
parent: 1
area: foundation
mvp: true
labels: ['feature', 'mvp', 'area:foundation']
children: [3, 4, 5, 6, 7, 8, 9, 10, 11]
created: 2026-11-18
---

# Foundation and AIDD workflow

Set up the repository so humans and AI agents can ship small, verified increments: scaffold, conventions, quality gates, CI, templates and test fixtures. Everything else depends on this.

**Outcome:** a green CI pipeline on an empty app, an `AGENTS.md`/`CLAUDE.md` that tells an agent how to build, test and contribute, and issue/PR templates that turn a story into an agent-ready task.

## Stories

- [S03](S03-scaffold-react-typescript-vite-app.md) Scaffold React + TypeScript + Vite app (Done)
- [S04](S04-spike-choose-the-charting-library-adr.md) Spike: choose the charting library (ADR) (Done)
- [S05](S05-write-agents-md-claude-md-agent-context.md) Write AGENTS.md / CLAUDE.md agent context (Done)
- [S06](S06-quality-gates-lint-format-typecheck-unit-tests.md) Quality gates: lint, format, typecheck, unit tests (Done)
- [S07](S07-ci-pipeline-on-github-actions.md) CI pipeline on GitHub Actions (Done)
- [S08](S08-issue-and-pr-templates-plus-label-taxonomy.md) Issue and PR templates plus label taxonomy (Done)
- [S09](S09-test-fixtures-derived-from-the-example-logs.md) Test fixtures derived from the example logs (Done)
- [S10](S10-e2e-smoke-test-with-playwright.md) E2E smoke test with Playwright (Backlog)
- [S11](S11-static-deployment-github-pages-with-pr-previews.md) Static deployment (GitHub Pages) with PR previews (Backlog)
