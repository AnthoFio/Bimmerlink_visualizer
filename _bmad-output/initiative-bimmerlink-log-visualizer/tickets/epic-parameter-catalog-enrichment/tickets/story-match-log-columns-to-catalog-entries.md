---
id: 2
type: story
title: 'Match log columns to catalog entries'
parent: epic-parameter-catalog-enrichment
after: [2.2, 1]
hitl: false
---

# Match log columns to catalog entries

## Description

As the app, I want to link each column header to a catalog parameter so that units and categories can be shown even when label casing differs.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Matching normalises case, whitespace and punctuation (`Engine speed` = `Engine Speed`)
- [x] Unmatched columns get `category: Other`, unit unknown; count reported in the file summary
- [x] Match results are unit-tested against all 6 example files with the expected matched/unmatched split documented

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-catalog-enrichment/epic-parameter-catalog-enrichment.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S21 (GitHub issue #21), area catalog, mvp; text and checkbox state kept.
- Decision: 2026-11-22 — kept from the original issue: "Catalog says labels may be reordered in smaller logs: always match on label, never on index."
