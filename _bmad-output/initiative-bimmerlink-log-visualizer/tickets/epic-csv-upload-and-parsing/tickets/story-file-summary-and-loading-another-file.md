---
id: 5
type: story
title: 'File summary and loading another file'
parent: epic-csv-upload-and-parsing
after: [1, 2]
hitl: false
---

# File summary and loading another file

## Description

As a BimmerLink user, I want a summary of the loaded log and a way to load a different one so that I can confirm it is the right file and switch quickly.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Header shows file name, duration (mm:ss), row count, median sample interval / rate, number of channels
- [ ] 'Open another file' replaces the current dataset (with confirm if the view has unsaved customisations)
- [ ] Re-uploading the same file works

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S17 (GitHub issue #17), area ingest; text and checkbox state kept.
