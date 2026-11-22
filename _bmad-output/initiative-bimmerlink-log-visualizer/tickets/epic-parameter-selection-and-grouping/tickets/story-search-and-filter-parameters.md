---
id: 2
type: story
title: 'Search and filter parameters'
parent: epic-parameter-selection-and-grouping
after: [3.2, 1]
hitl: false
---

# Search and filter parameters

## Description

As a BimmerLink user, I want to search by name and filter by category, unit or role so that I find a channel among 200+ quickly.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Case-insensitive substring search across label and key
- [ ] Filters: category, unit, role; combined with AND
- [ ] Selected parameters always remain visible in a 'Selected' section
- [ ] Filter state shown with a clear 'reset' control

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-selection-and-grouping/epic-parameter-selection-and-grouping.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S32 (GitHub issue #32), area selection, mvp; text and checkbox state kept.
