---
id: S47
type: story
title: 'Overview minimap with brush'
issue: 47
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/47
status: 'Backlog'
github_state: open
parent: 42
area: interaction
mvp: false
labels: ['user-story', 'area:interaction']
depends_on: [S43]
blocks: []
created: 2026-11-18
---

# Overview minimap with brush

## User story

As a BimmerLink user, I want a small overview of the whole log with a draggable window so that I always know where I am in the log.

## Acceptance criteria

- [ ] Minimap shows the first selected series (or normalised overlay)
- [ ] Dragging/resizing the window updates the main charts and vice versa

## Notes

Nice-to-have; skip if the chosen library makes it expensive.

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
