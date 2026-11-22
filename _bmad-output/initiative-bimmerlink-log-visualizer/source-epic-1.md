# Source: GitHub epic #1 (migrated 2026-11-22)

Original text of the epic that was the vision, scope and guardrails of this project, kept verbatim as the initiative's source. The GitHub issues are closed.

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
