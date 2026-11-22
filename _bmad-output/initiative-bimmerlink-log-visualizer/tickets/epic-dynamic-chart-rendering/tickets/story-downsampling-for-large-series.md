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

- [x] Min/max (or LTTB) downsampling keeps visual peaks (knock events, misfire spikes) intact
- [x] Re-sampled for the visible window on zoom
- [x] Frame rate >= 30 fps while panning 51k rows x 13 series (measured in the perf test)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S28 (GitHub issue #28), area charts, mvp; text and checkbox state kept.
- Decision: 2026-11-22 — measured with npm run e2e:perf (headless Chromium, software raster): 60 fps at the 10% and 95% windows in three runs. Series are 1 px hairlines; at 1.5 px the same test gave 24 to 27 fps.
