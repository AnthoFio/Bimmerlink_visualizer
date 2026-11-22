---
id: S37
type: story
title: 'Manual Y-axis min/max per axis'
issue: 37
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/37
status: 'Backlog'
github_state: open
parent: 36
area: scale
mvp: true
labels: ['user-story', 'mvp', 'area:scale']
created: 2026-11-18
---

# Manual Y-axis min/max per axis

## User story

As a BimmerLink user, I want to set min and max on any Y axis, or reset to auto so that I can zoom on a value range such as lambda 0.7 to 1.3.

## Acceptance criteria

- [ ] Each axis has min, max inputs and an 'Auto' toggle
- [ ] Invalid ranges (min >= max, NaN) rejected inline
- [ ] Values persist while switching panels/selection in the session
- [ ] Y zoom via the inputs and via axis drag (if supported by the chosen library)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
