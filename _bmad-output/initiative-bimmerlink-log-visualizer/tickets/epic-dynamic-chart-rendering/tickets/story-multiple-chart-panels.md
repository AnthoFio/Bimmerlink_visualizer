---
id: 2
type: story
title: 'Multiple chart panels'
parent: epic-dynamic-chart-rendering
after: [1]
hitl: false
---

# Multiple chart panels

## Description

As a BimmerLink user, I want to add, remove and reorder chart panels and assign parameters to them so that I can compare channels with very different scales in stacked views.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] 'Add panel' / 'Remove panel' controls; at least one panel always exists
- [x] Parameters can be assigned to a panel from the list or by drag-and-drop
- [x] Panel height adjustable
- [x] Panel layout is part of the view state (see Session feature)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S26 (GitHub issue #26), area charts, mvp; text and checkbox state kept.
