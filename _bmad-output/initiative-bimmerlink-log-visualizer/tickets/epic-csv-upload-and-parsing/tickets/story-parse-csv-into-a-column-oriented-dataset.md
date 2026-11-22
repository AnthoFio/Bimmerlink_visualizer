---
id: 2
type: story
title: 'Parse CSV into a column-oriented dataset'
parent: epic-csv-upload-and-parsing
after: []
hitl: false
---

# Parse CSV into a column-oriented dataset

## Description

As the app, I want to parse a log using its header row so that any BimmerLink log works without hard-coded columns.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] `parseLog(text|File)` returns `{ time: Float64Array, columns: [{ name, values: Float64Array }] }`
- [x] First column must be `Time` (case-insensitive); other columns discovered from the header
- [x] Handles quoted labels, comma delimiter, `.` decimal, BOM and CRLF/LF
- [x] Passes on all files in `Example/` (6 files, incl. the 51k-row one)
- [x] Unit tests on fixtures including edge cases

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S14 (GitHub issue #14), area ingest, mvp; text and checkbox state kept.
- Decision: 2026-11-22 — purpose-built parser instead of PapaParse: the format is fixed and simple, the output must be typed arrays, and it adds no dependency (see the parser header comment).
