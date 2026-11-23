---
id: 3
type: story
title: 'Multiple Y axes by unit'
parent: epic-dynamic-chart-rendering
after: [3.2, 1]
hitl: false
---

# Multiple Y axes by unit

## Description

As a BimmerLink user, I want channels with different units to get their own Y axes in one panel so that rpm and lambda can be overlaid readably.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Series sharing a unit share an axis; different units get left/right axes (max 2 visible per side, extra axes stacked)
- [x] Axis colour matches its series when only one series uses it
- [x] Unknown unit channels get an individual axis

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S27 (GitHub issue #27), area charts, mvp; text and checkbox state kept.
- Decision: 2026-11-22 — "max 2 visible per side, extra axes stacked" is read as: four axes drawn, stacked outwards two per side; further axes keep their own scale and are stacked as a list with their range under the chart. For the product owner to confirm.
