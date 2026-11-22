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

- [ ] Series sharing a unit share an axis; different units get left/right axes (max 2 visible per side, extra axes stacked)
- [ ] Axis colour matches its series when only one series uses it
- [ ] Unknown unit channels get an individual axis

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S27 (GitHub issue #27), area charts, mvp; text and checkbox state kept.
