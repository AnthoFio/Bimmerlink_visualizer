---
id: S43
type: story
title: 'Zoom and pan on the time axis'
issue: 43
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/43
status: 'Backlog'
github_state: open
parent: 42
area: interaction
mvp: true
labels: ['user-story', 'mvp', 'area:interaction']
created: 2026-11-18
---

# Zoom and pan on the time axis

## User story

As a BimmerLink user, I want mouse-wheel / drag zoom and drag pan with a reset so that I can inspect short events in a 25-minute log.

## Acceptance criteria

- [ ] Wheel zoom centred on cursor, drag to pan, double-click to reset
- [ ] Touch: pinch and two-finger pan
- [ ] Keyboard: +/- and arrow keys when chart focused
- [ ] Zoom is bounded to the log extent

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
