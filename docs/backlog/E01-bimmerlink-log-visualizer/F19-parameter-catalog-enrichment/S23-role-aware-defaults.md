---
id: S23
type: story
title: 'Role-aware defaults'
issue: 23
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/23
status: 'Backlog'
github_state: open
parent: 19
area: catalog
mvp: false
labels: ['user-story', 'area:catalog']
depends_on: [S21, S31]
blocks: []
created: 2026-11-18
---

# Role-aware defaults

## User story

As a BimmerLink user, I want sensible initial parameter visibility so that the first chart is useful instead of cluttered.

## Acceptance criteria

- [ ] On load, `core` channels present in the log are pre-selected (max 6; fallback to first N columns if none match)
- [ ] `redundant`, `static` and `broken` channels are hidden from the default list behind a 'show all' toggle
- [ ] Behaviour covered by tests on at least three example logs

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
