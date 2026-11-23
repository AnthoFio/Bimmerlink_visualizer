---
id: 1
type: story
title: 'Bundle the catalog as typed app data'
parent: epic-parameter-catalog-enrichment
after: []
hitl: false
---

# Bundle the catalog as typed app data

## Description

As a developer, I want the catalog available as a typed, tree-shakeable module so that any feature can look up parameter metadata.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Catalog JSON imported from `src/data/` with a TypeScript type and runtime schema validation (e.g. zod) in tests
- [x] Provenance note (vehicle, source log) kept in `meta`
- [x] A script/documented step keeps `src/data` in sync with the root catalog files

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-parameter-catalog-enrichment/epic-parameter-catalog-enrichment.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S20 (GitHub issue #20), area catalog, mvp; text and checkbox state kept.
