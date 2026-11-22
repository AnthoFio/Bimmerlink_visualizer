---
id: S29
type: story
title: 'Step vs linear line style'
issue: 29
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/29
status: 'Backlog'
github_state: open
parent: 24
area: charts
mvp: false
labels: ['user-story', 'area:charts']
depends_on: [S21, S25]
blocks: []
created: 2026-11-18
---

# Step vs linear line style

## User story

As a BimmerLink user, I want channels to be drawn as sample-and-hold steps or linear lines so that the plot reflects how the ECU actually reports values.

## Acceptance criteria

- [ ] Toggle per chart: linear / step
- [ ] Default: step for `flag`/`counter` roles and gear, linear otherwise
- [ ] Choice is part of view state

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
