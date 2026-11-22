---
id: S35
type: story
title: 'Presets from the catalog'
issue: 35
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/35
status: 'Backlog'
github_state: open
parent: 30
area: selection
mvp: false
labels: ['user-story', 'area:selection']
created: 2026-11-18
---

# Presets from the catalog

## User story

As a BimmerLink user, I want one-click presets (BimmerLink log presets, 'Core only', 'Knock', 'Misfire', 'Fuel & lambda') so that I get to a typical analysis view instantly.

## Acceptance criteria

- [ ] Presets derived from the catalog `presets` field and categories; only parameters present in the log are applied
- [ ] Missing parameters reported ('3 of 8 not in this log')
- [ ] Applying a preset replaces the selection (undo available)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
