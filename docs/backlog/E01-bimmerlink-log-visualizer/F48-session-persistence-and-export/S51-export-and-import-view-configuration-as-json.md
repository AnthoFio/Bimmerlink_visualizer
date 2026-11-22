---
id: S51
type: story
title: 'Export and import view configuration as JSON'
issue: 51
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/51
status: 'Backlog'
github_state: open
parent: 48
area: session
mvp: false
labels: ['user-story', 'area:session']
created: 2026-11-18
---

# Export and import view configuration as JSON

## User story

As a BimmerLink user, I want to save my view to a file and load it on another log so that I can reuse an analysis setup or share it.

## Acceptance criteria

- [ ] Versioned JSON schema (`version`, panels, series, axes, window)
- [ ] Import validates the schema and reports unknown parameters
- [ ] Round-trip test: export > import yields identical view state

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
