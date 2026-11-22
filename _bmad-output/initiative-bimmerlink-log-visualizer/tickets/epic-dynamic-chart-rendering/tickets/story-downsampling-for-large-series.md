---
id: 4
type: story
title: 'Downsampling for large series'
parent: epic-dynamic-chart-rendering
after: [1]
hitl: false
---

# Downsampling for large series

## Description

As a BimmerLink user, I want smooth rendering of long logs so that zooming and hovering never lag.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Min/max (or LTTB) downsampling keeps visual peaks (knock events, misfire spikes) intact
- [ ] Re-sampled for the visible window on zoom
- [ ] Frame rate >= 30 fps while panning 51k rows x 13 series (measured in the perf test)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S28 (GitHub issue #28), area charts, mvp; text and checkbox state kept.
