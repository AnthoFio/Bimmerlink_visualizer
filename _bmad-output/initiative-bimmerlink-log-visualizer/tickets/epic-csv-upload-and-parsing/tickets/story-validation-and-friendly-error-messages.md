---
id: 4
type: story
title: 'Validation and friendly error messages'
parent: epic-csv-upload-and-parsing
after: [2]
hitl: false
---

# Validation and friendly error messages

## Description

As a BimmerLink user, I want specific errors when a file cannot be used so that I can fix the problem instead of guessing.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Distinct messages for: not CSV, empty file, header only, missing `Time` column, duplicate column names, no numeric data
- [x] Non-numeric or blank cells are tolerated (treated as gaps/NaN) and counted in a warning, not fatal
- [x] Non-monotonic time is detected and reported
- [x] Errors never leave the app in a broken state; user can retry with another file

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S16 (GitHub issue #16), area ingest, mvp; text and checkbox state kept.
