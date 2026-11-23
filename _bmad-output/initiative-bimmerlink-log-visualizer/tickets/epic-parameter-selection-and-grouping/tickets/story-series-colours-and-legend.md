---
id: 4
type: story
title: 'Series colours and legend'
parent: epic-parameter-selection-and-grouping
after: [4.1, 1]
hitl: false
---

# Series colours and legend

## Description

As a BimmerLink user, I want distinct, editable colours and an interactive legend so that I can tell series apart and emphasise one.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Auto-assigned colourblind-safe palette, stable per parameter across reloads
- [x] Colour picker per series
- [x] Legend click toggles visibility; hover highlights series, dims the others

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-selection-and-grouping/epic-parameter-selection-and-grouping.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S34 (GitHub issue #34), area selection; text and checkbox state kept.
