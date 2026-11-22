---
id: 3
type: story
title: 'Normalised overlay mode'
parent: epic-axis-and-scale-control
after: [4.3]
hitl: false
---

# Normalised overlay mode

## Description

As a BimmerLink user, I want to plot selected series normalised (0 to 100 % of their own min-max) on one shared axis so that channels with unrelated units can be compared on shape and timing.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Toggle per panel; legend/tooltip still show the real values and unit
- [ ] Normalisation is computed over the full log (or visible window - selectable)
- [ ] Axis labelled '% of range'

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-axis-and-scale-control/epic-axis-and-scale-control.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S39 (GitHub issue #39), area scale; text and checkbox state kept.
