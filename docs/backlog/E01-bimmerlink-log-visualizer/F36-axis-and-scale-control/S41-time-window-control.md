---
id: S41
type: story
title: 'Time-window control'
issue: 41
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/41
status: 'Backlog'
github_state: open
parent: 36
area: scale
mvp: false
labels: ['user-story', 'area:scale']
created: 2026-11-18
---

# Time-window control

## User story

As a BimmerLink user, I want to enter an exact start and end time for the X axis so that I can jump to a known event, for example 612 s to 640 s.

## Acceptance criteria

- [ ] Start/end inputs in seconds or mm:ss
- [ ] Clamped to the log duration; 'Full log' reset
- [ ] Updates and is updated by zoom/pan interactions (single source of truth)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
