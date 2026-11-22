---
id: 4
type: story
title: 'Quality gates: lint, format, typecheck, unit tests'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Quality gates: lint, format, typecheck, unit tests

## Description

As a developer, I want automated local quality checks so that regressions are caught before review.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] ESLint (typescript-eslint, react-hooks) and Prettier configured
- [x] Vitest + Testing Library configured with one passing sample test
- [x] `npm run check` runs lint + typecheck + test
- [x] Pre-commit hook (lint-staged) runs on changed files

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI (green run https://github.com/AnthoFio/Bimmerlink_visualizer/actions/runs/44390595393, story #7)
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S06 (GitHub issue #6), area foundation, mvp; text and checkbox state kept.
