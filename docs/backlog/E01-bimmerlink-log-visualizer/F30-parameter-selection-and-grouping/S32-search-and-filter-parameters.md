---
id: S32
type: story
title: 'Search and filter parameters'
issue: 32
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/32
status: 'Backlog'
github_state: open
parent: 30
area: selection
mvp: true
labels: ['user-story', 'mvp', 'area:selection']
depends_on: [S21, S31]
blocks: []
created: 2026-11-18
---

# Search and filter parameters

## User story

As a BimmerLink user, I want to search by name and filter by category, unit or role so that I find a channel among 200+ quickly.

## Acceptance criteria

- [ ] Case-insensitive substring search across label and key
- [ ] Filters: category, unit, role; combined with AND
- [ ] Selected parameters always remain visible in a 'Selected' section
- [ ] Filter state shown with a clear 'reset' control

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
