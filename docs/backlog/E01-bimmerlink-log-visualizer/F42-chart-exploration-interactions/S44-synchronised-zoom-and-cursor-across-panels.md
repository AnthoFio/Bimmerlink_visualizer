---
id: S44
type: story
title: 'Synchronised zoom and cursor across panels'
issue: 44
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/44
status: 'Backlog'
github_state: open
parent: 42
area: interaction
mvp: true
labels: ['user-story', 'mvp', 'area:interaction']
depends_on: [S26, S43]
blocks: []
created: 2026-11-18
---

# Synchronised zoom and cursor across panels

## User story

As a BimmerLink user, I want all stacked panels to share the time window and cursor so that I can correlate a pedal input with boost and ignition angle.

## Acceptance criteria

- [ ] Zoom/pan in one panel applies to all
- [ ] A vertical cursor line follows the mouse in every panel
- [ ] Can be disabled per panel (advanced)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
