---
id: S16
type: story
title: 'Validation and friendly error messages'
issue: 16
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/16
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: true
labels: ['user-story', 'mvp', 'area:ingest']
depends_on: [S14]
blocks: []
created: 2026-11-18
---

# Validation and friendly error messages

## User story

As a BimmerLink user, I want specific errors when a file cannot be used so that I can fix the problem instead of guessing.

## Acceptance criteria

- [ ] Distinct messages for: not CSV, empty file, header only, missing `Time` column, duplicate column names, no numeric data
- [ ] Non-numeric or blank cells are tolerated (treated as gaps/NaN) and counted in a warning, not fatal
- [ ] Non-monotonic time is detected and reported
- [ ] Errors never leave the app in a broken state; user can retry with another file

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
