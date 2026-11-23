---
id: 3
type: story
title: 'Parse in a Web Worker with progress'
parent: epic-csv-upload-and-parsing
after: [2]
hitl: false
---

# Parse in a Web Worker with progress

## Description

As a BimmerLink user, I want the UI to stay responsive while a large log loads so that I get feedback instead of a frozen tab.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Parsing runs in a Web Worker; typed arrays transferred, not copied
- [x] Progress indicator shown for files > 1 MB
- [x] Parsing can be cancelled
- [x] 50k rows x 13 columns parsed in under 1 s on a mid-range laptop

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S15 (GitHub issue #15), area ingest, mvp; text and checkbox state kept.
