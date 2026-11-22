---
id: S17
type: story
title: 'File summary and loading another file'
issue: 17
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/17
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: false
labels: ['user-story', 'area:ingest']
created: 2026-11-18
---

# File summary and loading another file

## User story

As a BimmerLink user, I want a summary of the loaded log and a way to load a different one so that I can confirm it is the right file and switch quickly.

## Acceptance criteria

- [ ] Header shows file name, duration (mm:ss), row count, median sample interval / rate, number of channels
- [ ] 'Open another file' replaces the current dataset (with confirm if the view has unsaved customisations)
- [ ] Re-uploading the same file works

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
