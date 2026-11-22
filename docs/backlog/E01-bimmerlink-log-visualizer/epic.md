---
id: E01
type: epic
title: 'BimmerLink Log Visualizer'
issue: 1
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/1
status: 'In progress'
github_state: open
mvp: false
labels: ['epic']
children: [2, 12, 19, 24, 30, 36, 42, 48, 53]
created: 2026-11-18
---

# BimmerLink Log Visualizer

## Vision

A React web app where a BimmerLink datalog (CSV) is dropped onto the page and instantly turns into dynamic, explorable charts: pick which parameters to show, group them, change scales, zoom into events. Everything runs in the browser, so logs never leave the user's machine.

## Context (from the example logs and the parameter catalog)

- Logs in `Example/` (6 files, one is a byte-identical duplicate): 14k to 51k rows, 9 to 13 columns, ~30 ms irregular sampling, up to ~25 min.
- Header-driven format: first column `Time` (seconds, 3 decimals) followed by quoted parameter labels. Label casing differs between logs (`Engine speed` vs `Engine Speed`) so matching must be case-insensitive.
- Channels start at `0` until their first sample arrives (staggered ramp-up) and are sample-and-hold afterwards.
- `bimmerlink_n55_parameter_catalog.(csv|json)`: 210 parameters (BMW X4 M40i F26, N55) with category (17), unit, description, role (core/standard/flag/counter/raw/redundant/static/broken), confidence and preset membership. Used to enrich the raw columns.
- Units are heterogeneous (rpm, bar, deg, lambda, degC, counters...), so multi-axis and normalisation are first-class needs.

## Scope

In: upload, header-driven parsing, catalog enrichment, dynamic multi-series charts, parameter selection, axis/scale control, zoom/pan/cursor, session persistence and export.
Out (for now): backend/accounts, live OBD/ENET streaming, writing/editing logs, multi-log comparison (candidate follow-up epic).

## Guardrails

- Latest stable React (19.x) + TypeScript + Vite. Client-side only, no network calls with user data.
- Spec-driven AIDD: every story has acceptance criteria that an agent can turn into tests first; CI is the judge.
- Performance target: 50k rows x 13 channels interactive in under 1 s after parse.

## Features

- [ ] #2 Foundation and AIDD workflow
- [ ] #12 CSV upload and parsing
- [ ] #19 Parameter catalog enrichment
- [ ] #24 Dynamic chart rendering
- [ ] #30 Parameter selection and grouping
- [ ] #36 Axis and scale control
- [ ] #42 Chart exploration interactions
- [ ] #48 Session persistence and export
- [ ] #53 UX quality: performance, accessibility, theming, privacy

## Features

- [F02](F02-foundation-and-aidd-workflow/feature.md) Foundation and AIDD workflow (9 stories)
- [F12](F12-csv-upload-and-parsing/feature.md) CSV upload and parsing (6 stories)
- [F19](F19-parameter-catalog-enrichment/feature.md) Parameter catalog enrichment (4 stories)
- [F24](F24-dynamic-chart-rendering/feature.md) Dynamic chart rendering (5 stories)
- [F30](F30-parameter-selection-and-grouping/feature.md) Parameter selection and grouping (5 stories)
- [F36](F36-axis-and-scale-control/feature.md) Axis and scale control (5 stories)
- [F42](F42-chart-exploration-interactions/feature.md) Chart exploration interactions (5 stories)
- [F48](F48-session-persistence-and-export/feature.md) Session persistence and export (4 stories)
- [F53](F53-ux-quality-performance-accessibility-theming-privacy/feature.md) UX quality: performance, accessibility, theming, privacy (5 stories)
