---
id: 4
type: story
title: 'Role-aware defaults'
parent: epic-parameter-catalog-enrichment
after: [2, 5.1]
hitl: false
---

# Role-aware defaults

## Description

As a BimmerLink user, I want sensible initial parameter visibility so that the first chart is useful instead of cluttered.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] On load, `core` channels present in the log are pre-selected (max 6; fallback to first N columns if none match)
- [x] `redundant`, `static` and `broken` channels are hidden from the default list behind a 'show all' toggle
- [x] Behaviour covered by tests on at least three example logs

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-catalog-enrichment/epic-parameter-catalog-enrichment.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S23 (GitHub issue #23), area catalog; text and checkbox state kept.
