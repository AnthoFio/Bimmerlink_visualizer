---
id: 5
type: story
title: 'Presets from the catalog'
parent: epic-parameter-selection-and-grouping
after: [3.2, 1]
hitl: false
---

# Presets from the catalog

## Description

As a BimmerLink user, I want one-click presets (BimmerLink log presets, 'Core only', 'Knock', 'Misfire', 'Fuel & lambda') so that I get to a typical analysis view instantly.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Presets derived from the catalog `presets` field and categories; only parameters present in the log are applied
- [x] Missing parameters reported ('3 of 8 not in this log')
- [x] Applying a preset replaces the selection (undo available)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-selection-and-grouping/epic-parameter-selection-and-grouping.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S35 (GitHub issue #35), area selection; text and checkbox state kept.
