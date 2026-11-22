---
id: S06
type: story
title: 'Quality gates: lint, format, typecheck, unit tests'
issue: 6
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/6
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
created: 2026-11-18
---

# Quality gates: lint, format, typecheck, unit tests

## User story

As a developer, I want automated local quality checks so that regressions are caught before review.

## Acceptance criteria

- [x] ESLint (typescript-eslint, react-hooks) and Prettier configured
- [x] Vitest + Testing Library configured with one passing sample test
- [x] `npm run check` runs lint + typecheck + test
- [x] Pre-commit hook (lint-staged) runs on changed files

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI (green run https://github.com/AnthoFio/Bimmerlink_visualizer/actions/runs/44390595393, story #7)
- [x] Docs / AGENTS.md updated if conventions changed
