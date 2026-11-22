---
id: 2
type: story
title: 'Synchronised zoom and cursor across panels'
parent: epic-chart-exploration-interactions
after: [4.2, 1]
hitl: false
---

# Synchronised zoom and cursor across panels

## Description

As a BimmerLink user, I want all stacked panels to share the time window and cursor so that I can correlate a pedal input with boost and ignition angle.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Zoom/pan in one panel applies to all
- [ ] A vertical cursor line follows the mouse in every panel
- [ ] Can be disabled per panel (advanced)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-chart-exploration-interactions/epic-chart-exploration-interactions.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S44 (GitHub issue #44), area interaction, mvp; text and checkbox state kept.
