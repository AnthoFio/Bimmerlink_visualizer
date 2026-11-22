---
id: 5
type: story
title: 'Step vs linear line style'
parent: epic-dynamic-chart-rendering
after: [3.2, 1]
hitl: false
---

# Step vs linear line style

## Description

As a BimmerLink user, I want channels to be drawn as sample-and-hold steps or linear lines so that the plot reflects how the ECU actually reports values.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Toggle per chart: linear / step
- [ ] Default: step for `flag`/`counter` roles and gear, linear otherwise
- [ ] Choice is part of view state

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S29 (GitHub issue #29), area charts; text and checkbox state kept.
