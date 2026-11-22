---
id: F19
type: feature
title: 'Parameter catalog enrichment'
issue: 19
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/19
status: 'Backlog'
github_state: open
parent: 1
area: catalog
mvp: true
labels: ['feature', 'mvp', 'area:catalog']
children: [20, 21, 22, 23]
created: 2026-11-18
---

# Parameter catalog enrichment

Use `bimmerlink_n55_parameter_catalog.json` (210 parameters) to give raw column names meaning: unit, category, description, role, confidence. The catalog drives sensible defaults and grouping.

**Outcome:** every matched column shows a unit and category; unmatched columns still work with generic metadata.

## Stories

- [S20](S20-bundle-the-catalog-as-typed-app-data.md) Bundle the catalog as typed app data (Backlog)
- [S21](S21-match-log-columns-to-catalog-entries.md) Match log columns to catalog entries (Backlog)
- [S22](S22-show-unit-category-and-description-on-parameters.md) Show unit, category and description on parameters (Backlog)
- [S23](S23-role-aware-defaults.md) Role-aware defaults (Backlog)
