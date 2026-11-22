---
id: 5
type: story
title: 'CI pipeline on GitHub Actions'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# CI pipeline on GitHub Actions

## Description

As the maintainer, I want CI that runs on every PR so that merging is gated by objective checks.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Workflow runs install, lint, typecheck, unit tests and build on PR and on `main`
- [x] Node and npm caching enabled
- [x] Branch protection requires the workflow (documented)
- [x] Failing job output is readable by an agent (no interactive steps)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S07 (GitHub issue #7), area foundation, mvp; text and checkbox state kept.
