---
id: 4
type: story
title: 'Move series between axes and panels'
parent: epic-axis-and-scale-control
after: [4.2, 4.3]
hitl: false
---

# Move series between axes and panels

## Description

As a BimmerLink user, I want to choose which axis or panel each series uses so that I can override the automatic unit-based assignment.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Per-series menu: axis (left/right/new) and panel
- [ ] Moves update the chart without losing zoom
- [ ] Reset to automatic assignment available

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-axis-and-scale-control/epic-axis-and-scale-control.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S40 (GitHub issue #40), area scale; text and checkbox state kept.
