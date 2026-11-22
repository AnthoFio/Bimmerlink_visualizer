---
id: S46
type: story
title: 'Range selection with statistics'
issue: 46
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/46
status: 'Backlog'
github_state: open
parent: 42
area: interaction
mvp: false
labels: ['user-story', 'area:interaction']
depends_on: [S43]
blocks: []
created: 2026-11-18
---

# Range selection with statistics

## User story

As a BimmerLink user, I want to select a time range and see min, max, mean and delta per series so that I can quantify a pull or an event.

## Acceptance criteria

- [ ] Shift-drag selects a range; selection stays highlighted
- [ ] Stats table lists min / max / mean / delta / sample count per visible series
- [ ] 'Zoom to selection' and clear actions

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
