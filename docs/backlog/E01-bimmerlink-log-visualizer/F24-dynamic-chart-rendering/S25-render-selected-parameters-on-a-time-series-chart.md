---
id: S25
type: story
title: 'Render selected parameters on a time-series chart'
issue: 25
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/25
status: 'Backlog'
github_state: open
parent: 24
area: charts
mvp: true
labels: ['user-story', 'mvp', 'area:charts']
created: 2026-11-18
---

# Render selected parameters on a time-series chart

## User story

As a BimmerLink user, I want my selected parameters plotted against time so that I can see how channels evolve during the drive.

## Acceptance criteria

- [ ] Chart renders one line per selected parameter, X axis = Time in seconds (mm:ss labels when > 120 s)
- [ ] Series update immediately when the selection changes without remounting the chart
- [ ] Empty selection shows a helpful empty state
- [ ] Works on every file in `Example/`

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
