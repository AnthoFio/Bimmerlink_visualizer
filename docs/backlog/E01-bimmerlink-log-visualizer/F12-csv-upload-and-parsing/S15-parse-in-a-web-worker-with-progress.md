---
id: S15
type: story
title: 'Parse in a Web Worker with progress'
issue: 15
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/15
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: true
labels: ['user-story', 'mvp', 'area:ingest']
depends_on: [S14]
blocks: [S54]
created: 2026-11-18
---

# Parse in a Web Worker with progress

## User story

As a BimmerLink user, I want the UI to stay responsive while a large log loads so that I get feedback instead of a frozen tab.

## Acceptance criteria

- [ ] Parsing runs in a Web Worker; typed arrays transferred, not copied
- [ ] Progress indicator shown for files > 1 MB
- [ ] Parsing can be cancelled
- [ ] 50k rows x 13 columns parsed in under 1 s on a mid-range laptop

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
