---
id: S28
type: story
title: 'Downsampling for large series'
issue: 28
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/28
status: 'Backlog'
github_state: open
parent: 24
area: charts
mvp: true
labels: ['user-story', 'mvp', 'area:charts']
created: 2026-11-18
---

# Downsampling for large series

## User story

As a BimmerLink user, I want smooth rendering of long logs so that zooming and hovering never lag.

## Acceptance criteria

- [ ] Min/max (or LTTB) downsampling keeps visual peaks (knock events, misfire spikes) intact
- [ ] Re-sampled for the visible window on zoom
- [ ] Frame rate >= 30 fps while panning 51k rows x 13 series (measured in the perf test)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
