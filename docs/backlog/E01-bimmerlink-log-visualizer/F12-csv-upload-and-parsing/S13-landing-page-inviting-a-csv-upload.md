---
id: S13
type: story
title: 'Landing page inviting a CSV upload'
issue: 13
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/13
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: true
labels: ['user-story', 'mvp', 'area:ingest']
created: 2026-11-18
---

# Landing page inviting a CSV upload

## User story

As a BimmerLink user, I want a clear drop zone and file picker on first load so that I know immediately what to do.

## Acceptance criteria

- [ ] Empty state shows title, short explanation, drag-and-drop zone and a Browse button
- [ ] Drag-over state is visually distinct; keyboard users can activate the picker
- [ ] Accepts `.csv` (and `text/csv`), rejects other types with a message
- [ ] States that files are processed locally and never uploaded

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
