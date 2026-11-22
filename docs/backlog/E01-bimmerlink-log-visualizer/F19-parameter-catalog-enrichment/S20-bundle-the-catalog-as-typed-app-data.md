---
id: S20
type: story
title: 'Bundle the catalog as typed app data'
issue: 20
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/20
status: 'Backlog'
github_state: open
parent: 19
area: catalog
mvp: true
labels: ['user-story', 'mvp', 'area:catalog']
depends_on: []
blocks: [S21]
created: 2026-11-18
---

# Bundle the catalog as typed app data

## User story

As a developer, I want the catalog available as a typed, tree-shakeable module so that any feature can look up parameter metadata.

## Acceptance criteria

- [ ] Catalog JSON imported from `src/data/` with a TypeScript type and runtime schema validation (e.g. zod) in tests
- [ ] Provenance note (vehicle, source log) kept in `meta`
- [ ] A script/documented step keeps `src/data` in sync with the root catalog files

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
