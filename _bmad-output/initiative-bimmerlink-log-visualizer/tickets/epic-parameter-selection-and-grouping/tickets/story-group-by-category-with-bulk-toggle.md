---
id: 3
type: story
title: 'Group by category with bulk toggle'
parent: epic-parameter-selection-and-grouping
after: [3.2, 1]
hitl: false
---

# Group by category with bulk toggle

## Description

As a BimmerLink user, I want collapsible category groups with group-level toggles so that I can enable all misfire or all knock channels at once.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Groups follow catalog categories (17) plus 'Other'
- [ ] Group header shows count selected / available and a tri-state checkbox
- [ ] Collapse state remembered during the session

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-selection-and-grouping/epic-parameter-selection-and-grouping.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S33 (GitHub issue #33), area selection; text and checkbox state kept.
