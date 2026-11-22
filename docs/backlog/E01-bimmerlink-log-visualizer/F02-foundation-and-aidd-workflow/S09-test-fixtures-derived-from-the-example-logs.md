---
id: S09
type: story
title: 'Test fixtures derived from the example logs'
issue: 9
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/9
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
depends_on: []
blocks: []
created: 2026-11-18
---

# Test fixtures derived from the example logs

## User story

As a developer, I want small, committed fixtures covering the real format quirks so that parser and UI tests are fast and deterministic.

## Acceptance criteria

- [x] Trimmed fixtures (<= 200 rows) from each example log committed under `tests/fixtures/`
- [x] Edge-case fixtures: empty file, header only, missing `Time`, non-numeric cell, duplicate column names, CRLF line endings, BOM
- [x] README in fixtures explains each file
- [x] Full `Example/` logs remain available for e2e and perf tests; byte-identical duplicate noted

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed
