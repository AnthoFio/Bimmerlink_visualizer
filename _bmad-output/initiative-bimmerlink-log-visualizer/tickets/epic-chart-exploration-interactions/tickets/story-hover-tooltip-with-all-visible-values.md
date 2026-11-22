---
id: 3
type: story
title: 'Hover tooltip with all visible values'
parent: epic-chart-exploration-interactions
after: [4.1]
hitl: false
---

# Hover tooltip with all visible values

## Description

As a BimmerLink user, I want a tooltip showing every visible series' value at the cursor time so that I can read exact values.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Shows time and, for each visible series, name, value, unit (with colour key)
- [ ] Snaps to nearest sample
- [ ] Handles 13+ series without covering the chart (scrollable / docked)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-chart-exploration-interactions/epic-chart-exploration-interactions.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S45 (GitHub issue #45), area interaction, mvp; text and checkbox state kept.
