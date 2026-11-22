---
id: 2
type: epic
title: 'CSV upload and parsing'
parent: initiative-bimmerlink-log-visualizer
covers: ['R2']
sources: []
companions: []
after: []
refined: false
---

# CSV upload and parsing

## Description

Open the page, get invited to upload a BimmerLink CSV, and have it parsed into a typed in-memory dataset driven by the header names. The parser must be tolerant, fast and run off the main thread.

## Outcome

dropping any file from `Example/` produces a `Dataset` (time vector + named numeric columns) or a clear, actionable error.

## Done when

- dropping any file from `Example/` produces a `Dataset` (time vector + named numeric columns) or a clear, actionable error.
- All 6 stories of this epic are done.

## Boundaries

- Out of scope for the whole initiative: backend and accounts, live OBD/ENET streaming, writing or editing logs, multi-log comparison.
- Belongs to sibling epics: Foundation and AIDD workflow; Parameter catalog enrichment; Dynamic chart rendering; Parameter selection and grouping; Chart exploration interactions; Axis and scale control; Session persistence and export; UX quality: performance, accessibility, theming, privacy.

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/initiative-bimmerlink-log-visualizer.md, section Requirements (R2)
- source — _bmad-output/initiative-bimmerlink-log-visualizer/source-epic-1.md, original feature text migrated from docs/backlog (S12)

## Notes

- Decision: 2026-11-22 — migrated from the local docs/backlog tree (GitHub feature #12, area ingest, mvp); the split is the original one, kept as is.
