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

- [ ] `parseLog(text|File)` returns `{ time: Float64Array, columns: [{ name, values: Float64Array }] }`
- [ ] First column must be `Time` (case-insensitive); other columns discovered from the header
- [ ] Handles quoted labels, comma delimiter, `.` decimal, BOM and CRLF/LF
- [ ] Passes on all files in `Example/` (6 files, incl. the 51k-row one)
- [ ] Unit tests on fixtures including edge cases

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S14 (GitHub issue #14), area ingest, mvp; text and checkbox state kept.
- Open question: PapaParse or a purpose-built parser, decide in the PR and justify in the description. Answered on the unmerged branch story/14-parse-csv-dataset (worktree ../wt-14, purpose-built parser, in review); the story stays backlog until that branch is merged, then mark it done.
