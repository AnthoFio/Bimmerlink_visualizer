---
id: S45
type: story
title: 'Hover tooltip with all visible values'
issue: 45
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/45
status: 'Backlog'
github_state: open
parent: 42
area: interaction
mvp: true
labels: ['user-story', 'mvp', 'area:interaction']
created: 2026-11-18
---

# Hover tooltip with all visible values

## User story

As a BimmerLink user, I want a tooltip showing every visible series' value at the cursor time so that I can read exact values.

## Acceptance criteria

- [ ] Shows time and, for each visible series, name, value, unit (with colour key)
- [ ] Snaps to nearest sample
- [ ] Handles 13+ series without covering the chart (scrollable / docked)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
