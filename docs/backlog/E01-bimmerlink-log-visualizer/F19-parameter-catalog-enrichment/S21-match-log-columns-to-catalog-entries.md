---
id: S21
type: story
title: 'Match log columns to catalog entries'
issue: 21
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/21
status: 'Backlog'
github_state: open
parent: 19
area: catalog
mvp: true
labels: ['user-story', 'mvp', 'area:catalog']
depends_on: [S14, S20]
blocks: [S22, S23, S27, S29, S32, S33, S35]
created: 2026-11-18
---

# Match log columns to catalog entries

## User story

As the app, I want to link each column header to a catalog parameter so that units and categories can be shown even when label casing differs.

## Acceptance criteria

- [ ] Matching normalises case, whitespace and punctuation (`Engine speed` = `Engine Speed`)
- [ ] Unmatched columns get `category: Other`, unit unknown; count reported in the file summary
- [ ] Match results are unit-tested against all 6 example files with the expected matched/unmatched split documented

## Notes

Catalog says labels may be reordered in smaller logs: always match on label, never on index.

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
