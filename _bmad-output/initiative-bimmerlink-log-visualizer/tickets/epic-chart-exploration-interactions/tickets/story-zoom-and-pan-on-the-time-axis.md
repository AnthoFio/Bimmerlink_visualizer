---
id: 1
type: story
title: 'Zoom and pan on the time axis'
parent: epic-chart-exploration-interactions
after: [4.1]
hitl: false
---

# Zoom and pan on the time axis

## Description

As a BimmerLink user, I want mouse-wheel / drag zoom and drag pan with a reset so that I can inspect short events in a 25-minute log.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Wheel zoom centred on cursor, drag to pan, double-click to reset
- [ ] Touch: pinch and two-finger pan
- [ ] Keyboard: +/- and arrow keys when chart focused
- [ ] Zoom is bounded to the log extent

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-chart-exploration-interactions/epic-chart-exploration-interactions.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S43 (GitHub issue #43), area interaction, mvp; text and checkbox state kept.
