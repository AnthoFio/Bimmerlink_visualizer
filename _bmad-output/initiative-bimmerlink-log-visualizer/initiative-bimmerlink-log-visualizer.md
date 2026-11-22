---
type: initiative
title: 'BimmerLink Log Visualizer: drop a datalog, explore it as dynamic charts'
sources: ['_bmad-output/initiative-bimmerlink-log-visualizer/source-epic-1.md']
companions: []
after: []
status: in-progress
---

# BimmerLink Log Visualizer

## Description

A React web app where a BimmerLink datalog (CSV) is dropped onto the page and instantly turns into dynamic, explorable charts: pick which parameters to show, group them, change scales, zoom into events. Everything runs in the browser, so logs never leave the user's machine. The tickets migrated from the GitHub epic #1 and its issues, which are now closed.

## Outcome

A BimmerLink user explores a full datalog (up to about 25 minutes, 50k rows by 13 channels) on a chart they control, with no upload, within one second of dropping the file.

## Requirements

- R1 (source Guardrails): A change is accepted only when its acceptance criteria are automated tests and the CI pipeline passes, so an agent can build and verify each story alone.
- R2 (source Scope: upload, header-driven parsing): Dropping a BimmerLink CSV produces a dataset driven by the file's header, or a clear and actionable error.
- R3 (source Scope: catalog enrichment): Each log column is matched to the parameter catalog and shows its unit, category and description; unmatched columns still work with generic metadata.
- R4 (source Scope: dynamic multi-series charts): The selected parameters render as time-series charts, with several panels and Y axes by unit, and stay fluid on a 51k-row log.
- R5 (source Scope: parameter selection): The user shows, hides, searches, groups, colours and applies presets to any of the log's parameters, instantly.
- R6 (source Scope: axis/scale control): The user sets each axis range, the fit mode, a normalised overlay, the axis of each series and the time window.
- R7 (source Scope: zoom/pan/cursor): The user zooms, pans, reads synchronised cursor values and range statistics to find an event in a log.
- R8 (source Scope: session persistence and export): The working view is remembered per log layout, and charts and view configurations leave the app as images, JSON or CSV.
- R9 (source Guardrails, Features): The app meets its performance budget (50k rows by 13 channels interactive in under 1 s after parse) and is keyboard accessible, themeable, responsive and private.

## Constraints

- Latest stable React (19.x) with TypeScript and Vite (source Guardrails).
- Client-side only: no network call carries log data, and there is no backend (source Guardrails, Scope Out).
- Every story has acceptance criteria that an agent can turn into tests first; CI is the judge (source Guardrails).
- Performance target: 50k rows by 13 channels interactive in under 1 s after parse (source Guardrails).
- Parsing and matching are header-driven and case-insensitive: label casing differs between logs and column sets differ per log (source Context).

## Done when

- A file from `Example/` dropped on the deployed app renders as charts the user can select, scale, zoom and export.
- The 51k-row example log is interactive in under 1 s after parse, measured in an automated test.
- No request made by the app carries log data, checked by a test that blocks the network after load.
- CI is green on `main` and every epic's `Done when` holds.

## Boundaries

- Out for now: backend and accounts, live OBD/ENET streaming, writing or editing logs, multi-log comparison (a candidate follow-up initiative).
- Touch point: the parameter catalog `bimmerlink_n55_parameter_catalog.json` — enriches raw columns; owner: epic-parameter-catalog-enrichment
- Touch point: the charting library uPlot (ADR 0001) — draws every chart; owner: epic-dynamic-chart-rendering
- Tracer path: drop an `Example/` CSV, parse it, show one parameter on a chart.

## References

- source — _bmad-output/initiative-bimmerlink-log-visualizer/source-epic-1.md, sections Vision, Context, Scope, Guardrails
- architecture — docs/adr/0001-charting-library.md, decision uPlot
- agent instructions — AGENTS.md

## Notes

- Decision: 2026-11-22 — the nine features of the old GitHub tree became nine epics, and the 48 stories kept their text, acceptance criteria and checkbox state; ids `S<nn>` are the old issue numbers.
- Decision: 2026-11-22 — statuses carried over: the seven foundation stories S03 to S09 are done, everything else is backlog.
- Decision: 2026-11-22 — epic order is Foundation, CSV, Catalog, Charts, Selection, Exploration, Axis and scale, Session, UX quality. Four epic-level order conflicts stay on purpose because the old feature split cuts across itself: the catalog epic needs the selection epic's S31 while selection needs the catalog's S21 (and charts need S21 for units); foundation's S10 (e2e test) needs the CSV and chart epics. Story-level `after` is exact and is what decides what is ready; re-slicing these epics along vertical lines is a separate decision for the user.
