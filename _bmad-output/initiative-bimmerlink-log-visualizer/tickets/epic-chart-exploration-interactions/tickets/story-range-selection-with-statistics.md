---
id: 4
type: story
title: 'Range selection with statistics'
parent: epic-chart-exploration-interactions
after: [1]
hitl: false
---

# Range selection with statistics

## Description

As a BimmerLink user, I want to select a time range and see min, max, mean and delta per series so that I can quantify a pull or an event.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Shift-drag selects a range; selection stays highlighted
- [ ] Stats table lists min / max / mean / delta / sample count per visible series
- [ ] 'Zoom to selection' and clear actions

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-chart-exploration-interactions/epic-chart-exploration-interactions.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S46 (GitHub issue #46), area interaction; text and checkbox state kept.
