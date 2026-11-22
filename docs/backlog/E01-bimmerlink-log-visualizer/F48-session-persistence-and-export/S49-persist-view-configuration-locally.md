---
id: S49
type: story
title: 'Persist view configuration locally'
issue: 49
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/49
status: 'Backlog'
github_state: open
parent: 48
area: session
mvp: false
labels: ['user-story', 'area:session']
depends_on: [S31]
blocks: [S51]
created: 2026-11-18
---

# Persist view configuration locally

## User story

As a BimmerLink user, I want my selection, panels, scales and colours remembered so that re-opening a similar log restores my view.

## Acceptance criteria

- [ ] View state serialised to localStorage, keyed by a hash of the sorted column labels
- [ ] Restores only parameters present in the log; reports what was skipped
- [ ] 'Reset view' clears the saved state
- [ ] Persistence failures (quota, disabled storage) are silent and non-blocking

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
