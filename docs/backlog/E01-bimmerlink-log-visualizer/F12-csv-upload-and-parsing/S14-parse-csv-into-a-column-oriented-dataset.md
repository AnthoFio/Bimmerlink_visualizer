---
id: S14
type: story
title: 'Parse CSV into a column-oriented dataset'
issue: 14
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/14
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: true
labels: ['user-story', 'mvp', 'area:ingest']
created: 2026-11-18
---

# Parse CSV into a column-oriented dataset

## User story

As the app, I want to parse a log using its header row so that any BimmerLink log works without hard-coded columns.

## Acceptance criteria

- [ ] `parseLog(text|File)` returns `{ time: Float64Array, columns: [{ name, values: Float64Array }] }`
- [ ] First column must be `Time` (case-insensitive); other columns discovered from the header
- [ ] Handles quoted labels, comma delimiter, `.` decimal, BOM and CRLF/LF
- [ ] Passes on all files in `Example/` (6 files, incl. the 51k-row one)
- [ ] Unit tests on fixtures including edge cases

## Notes

Prefer PapaParse or a purpose-built streaming parser; decide in the PR and justify in the description.

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
