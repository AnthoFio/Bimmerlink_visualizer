---
id: S27
type: story
title: 'Multiple Y axes by unit'
issue: 27
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/27
status: 'Backlog'
github_state: open
parent: 24
area: charts
mvp: true
labels: ['user-story', 'mvp', 'area:charts']
depends_on: [S21, S25]
blocks: [S37, S39, S40]
created: 2026-11-18
---

# Multiple Y axes by unit

## User story

As a BimmerLink user, I want channels with different units to get their own Y axes in one panel so that rpm and lambda can be overlaid readably.

## Acceptance criteria

- [ ] Series sharing a unit share an axis; different units get left/right axes (max 2 visible per side, extra axes stacked)
- [ ] Axis colour matches its series when only one series uses it
- [ ] Unknown unit channels get an individual axis

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
