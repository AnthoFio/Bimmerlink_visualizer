---
id: 7
type: story
title: 'Test fixtures derived from the example logs'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Test fixtures derived from the example logs

## Description

As a developer, I want small, committed fixtures covering the real format quirks so that parser and UI tests are fast and deterministic.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Trimmed fixtures (<= 200 rows) from each example log committed under `tests/fixtures/`
- [x] Edge-case fixtures: empty file, header only, missing `Time`, non-numeric cell, duplicate column names, CRLF line endings, BOM
- [x] README in fixtures explains each file
- [x] Full `Example/` logs remain available for e2e and perf tests; byte-identical duplicate noted

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S09 (GitHub issue #9), area foundation, mvp; text and checkbox state kept.
