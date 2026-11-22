---
id: 1
type: story
title: 'Landing page inviting a CSV upload'
parent: epic-csv-upload-and-parsing
after: []
hitl: false
---

# Landing page inviting a CSV upload

## Description

As a BimmerLink user, I want a clear drop zone and file picker on first load so that I know immediately what to do.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Empty state shows title, short explanation, drag-and-drop zone and a Browse button
- [ ] Drag-over state is visually distinct; keyboard users can activate the picker
- [ ] Accepts `.csv` (and `text/csv`), rejects other types with a message
- [ ] States that files are processed locally and never uploaded

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S13 (GitHub issue #13), area ingest, mvp; text and checkbox state kept.
