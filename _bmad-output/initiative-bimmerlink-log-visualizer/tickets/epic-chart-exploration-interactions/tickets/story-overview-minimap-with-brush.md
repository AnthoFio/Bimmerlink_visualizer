---
id: 5
type: story
title: 'Overview minimap with brush'
parent: epic-chart-exploration-interactions
after: [1]
hitl: false
---

# Overview minimap with brush

## Description

As a BimmerLink user, I want a small overview of the whole log with a draggable window so that I always know where I am in the log.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Minimap shows the first selected series (or normalised overlay)
- [ ] Dragging/resizing the window updates the main charts and vice versa

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-chart-exploration-interactions/epic-chart-exploration-interactions.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S47 (GitHub issue #47), area interaction; text and checkbox state kept.
- Decision: 2026-11-22 — kept from the original issue: "Nice-to-have; skip if the chosen library makes it expensive."
