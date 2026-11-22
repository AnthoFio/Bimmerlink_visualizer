---
id: 3
type: story
title: 'Show unit, category and description on parameters'
parent: epic-parameter-catalog-enrichment
after: [2, 4.1, 5.1]
hitl: false
---

# Show unit, category and description on parameters

## Description

As a BimmerLink user, I want units and descriptions next to each parameter so that I understand what a channel measures.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Parameter list and legend show the unit
- [ ] Tooltip shows description, category, role and confidence badge (low confidence flagged)
- [ ] Axis titles use the unit

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-catalog-enrichment/epic-parameter-catalog-enrichment.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S22 (GitHub issue #22), area catalog, mvp; text and checkbox state kept.
