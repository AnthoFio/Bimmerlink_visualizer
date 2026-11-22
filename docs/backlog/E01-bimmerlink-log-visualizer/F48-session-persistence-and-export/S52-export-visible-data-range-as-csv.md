---
id: S52
type: story
title: 'Export visible data range as CSV'
issue: 52
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/52
status: 'Backlog'
github_state: open
parent: 48
area: session
mvp: false
labels: ['user-story', 'area:session']
created: 2026-11-18
---

# Export visible data range as CSV

## User story

As a BimmerLink user, I want to download the selected parameters over the current window as CSV so that I can post-process them in a spreadsheet.

## Acceptance criteria

- [ ] Same format as BimmerLink (Time + labels), only selected columns and visible window
- [ ] Large exports do not freeze the UI

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
