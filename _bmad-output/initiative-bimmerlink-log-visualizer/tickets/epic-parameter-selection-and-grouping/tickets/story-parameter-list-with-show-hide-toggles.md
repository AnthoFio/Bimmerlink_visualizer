---
id: 1
type: story
title: 'Parameter list with show/hide toggles'
parent: epic-parameter-selection-and-grouping
after: [2.2, 4.1]
hitl: false
---

# Parameter list with show/hide toggles

## Description

As a BimmerLink user, I want a checklist of all parameters in the log so that I can select and unselect what I want to see.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Lists every column of the loaded log with a checkbox, colour swatch and unit
- [ ] Toggle updates the chart immediately
- [ ] 'Select all', 'Clear' (for the visible/filtered items)
- [ ] Keyboard accessible (arrow keys, space to toggle)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-selection-and-grouping/epic-parameter-selection-and-grouping.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S31 (GitHub issue #31), area selection, mvp; text and checkbox state kept.
