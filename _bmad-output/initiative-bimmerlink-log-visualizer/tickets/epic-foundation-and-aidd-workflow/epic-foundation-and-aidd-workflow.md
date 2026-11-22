---
id: 1
type: epic
title: 'Foundation and AIDD workflow'
parent: initiative-bimmerlink-log-visualizer
covers: ['R1']
sources: []
companions: []
after: []
refined: false
status: in-progress
---

# Foundation and AIDD workflow

## Description

Set up the repository so humans and AI agents can ship small, verified increments: scaffold, conventions, quality gates, CI, templates and test fixtures. Everything else depends on this.

## Outcome

a green CI pipeline on an empty app, an `AGENTS.md`/`CLAUDE.md` that tells an agent how to build, test and contribute, and issue/PR templates that turn a story into an agent-ready task.

## Done when

- a green CI pipeline on an empty app, an `AGENTS.md`/`CLAUDE.md` that tells an agent how to build, test and contribute, and issue/PR templates that turn a story into an agent-ready task.
- All 9 stories of this epic are done.

## Boundaries

- Out of scope for the whole initiative: backend and accounts, live OBD/ENET streaming, writing or editing logs, multi-log comparison.
- Belongs to sibling epics: CSV upload and parsing; Parameter catalog enrichment; Dynamic chart rendering; Parameter selection and grouping; Chart exploration interactions; Axis and scale control; Session persistence and export; UX quality: performance, accessibility, theming, privacy.

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/initiative-bimmerlink-log-visualizer.md, section Requirements (R1)
- source — _bmad-output/initiative-bimmerlink-log-visualizer/source-epic-1.md, original feature text migrated from docs/backlog (S02)

## Notes

- Decision: 2026-11-22 — migrated from the local docs/backlog tree (GitHub feature #2, area foundation, mvp); the split is the original one, kept as is.
