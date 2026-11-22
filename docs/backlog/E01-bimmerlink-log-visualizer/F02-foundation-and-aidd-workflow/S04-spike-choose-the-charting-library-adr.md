---
id: S04
type: story
title: 'Spike: choose the charting library (ADR)'
issue: 4
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/4
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
depends_on: []
blocks: []
created: 2026-11-18
---

# Spike: choose the charting library (ADR)

## User story

As the maintainer, I want an evidence-based choice of charting library so that we can render 50k+ points x many series with zoom and multi-axis without rewriting later.

## Acceptance criteria

- [x] Compare uPlot, Apache ECharts, Plotly.js and Recharts on: 51k rows x 13 series FPS, multi-Y-axis, stacked synced panels, zoom/pan API, bundle size, React 19 fit
- [x] Throwaway prototype for the top 2 candidates using `Example/2026-10-25_09-33-22.csv`
- [x] Decision recorded in `docs/adr/0001-charting-library.md`

## Notes

Time-boxed: 1 day. Result unblocks the Charts feature.

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed
