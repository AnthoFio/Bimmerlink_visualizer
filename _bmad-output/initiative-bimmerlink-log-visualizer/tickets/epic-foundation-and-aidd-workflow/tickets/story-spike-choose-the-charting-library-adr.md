---
id: 2
type: story
title: 'Spike: choose the charting library (ADR)'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Spike: choose the charting library (ADR)

## Description

As the maintainer, I want an evidence-based choice of charting library so that we can render 50k+ points x many series with zoom and multi-axis without rewriting later.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Compare uPlot, Apache ECharts, Plotly.js and Recharts on: 51k rows x 13 series FPS, multi-Y-axis, stacked synced panels, zoom/pan API, bundle size, React 19 fit
- [x] Throwaway prototype for the top 2 candidates using `Example/2026-10-25_09-33-22.csv`
- [x] Decision recorded in `docs/adr/0001-charting-library.md`

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S04 (GitHub issue #4), area foundation, mvp; text and checkbox state kept.
- Decision: 2026-11-22 — kept from the original issue: "Time-boxed: 1 day. Result unblocks the Charts feature."
