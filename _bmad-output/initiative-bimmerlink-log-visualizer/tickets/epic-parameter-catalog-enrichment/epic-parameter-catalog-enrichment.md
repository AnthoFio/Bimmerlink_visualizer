---
id: 3
type: epic
title: 'Parameter catalog enrichment'
parent: initiative-bimmerlink-log-visualizer
covers: ['R3']
sources: []
companions: []
after: []
refined: false
---

# Parameter catalog enrichment

## Description

Use `bimmerlink_n55_parameter_catalog.json` (210 parameters) to give raw column names meaning: unit, category, description, role, confidence. The catalog drives sensible defaults and grouping.

## Outcome

every matched column shows a unit and category; unmatched columns still work with generic metadata.

## Done when

- every matched column shows a unit and category; unmatched columns still work with generic metadata.
- All 4 stories of this epic are done.

## Boundaries

- Out of scope for the whole initiative: backend and accounts, live OBD/ENET streaming, writing or editing logs, multi-log comparison.
- Belongs to sibling epics: Foundation and AIDD workflow; CSV upload and parsing; Dynamic chart rendering; Parameter selection and grouping; Chart exploration interactions; Axis and scale control; Session persistence and export; UX quality: performance, accessibility, theming, privacy.

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/initiative-bimmerlink-log-visualizer.md, section Requirements (R3)
- source — _bmad-output/initiative-bimmerlink-log-visualizer/source-epic-1.md, original feature text migrated from docs/backlog (S19)

## Notes

- Decision: 2026-11-22 — migrated from the local docs/backlog tree (GitHub feature #19, area catalog, mvp); the split is the original one, kept as is.
