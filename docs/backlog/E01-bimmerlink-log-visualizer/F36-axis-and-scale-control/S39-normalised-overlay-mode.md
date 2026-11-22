---
id: S39
type: story
title: 'Normalised overlay mode'
issue: 39
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/39
status: 'Backlog'
github_state: open
parent: 36
area: scale
mvp: false
labels: ['user-story', 'area:scale']
depends_on: [S27]
blocks: []
created: 2026-11-18
---

# Normalised overlay mode

## User story

As a BimmerLink user, I want to plot selected series normalised (0 to 100 % of their own min-max) on one shared axis so that channels with unrelated units can be compared on shape and timing.

## Acceptance criteria

- [ ] Toggle per panel; legend/tooltip still show the real values and unit
- [ ] Normalisation is computed over the full log (or visible window - selectable)
- [ ] Axis labelled '% of range'

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
