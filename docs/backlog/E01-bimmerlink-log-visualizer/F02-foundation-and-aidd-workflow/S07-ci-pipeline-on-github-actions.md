---
id: S07
type: story
title: 'CI pipeline on GitHub Actions'
issue: 7
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/7
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
created: 2026-11-18
---

# CI pipeline on GitHub Actions

## User story

As the maintainer, I want CI that runs on every PR so that merging is gated by objective checks.

## Acceptance criteria

- [x] Workflow runs install, lint, typecheck, unit tests and build on PR and on `main`
- [x] Node and npm caching enabled
- [x] Branch protection requires the workflow (documented)
- [x] Failing job output is readable by an agent (no interactive steps)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed
