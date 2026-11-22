---
id: S54
type: story
title: 'Performance budget and automated measurement'
issue: 54
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/54
status: 'Backlog'
github_state: open
parent: 53
area: nfr
mvp: false
labels: ['user-story', 'area:nfr']
depends_on: [S10, S15, S28]
blocks: []
created: 2026-11-18
---

# Performance budget and automated measurement

## User story

As the maintainer, I want performance budgets enforced by tests so that regressions in load or interaction speed are caught early.

## Acceptance criteria

- [ ] Budgets: parse 50k x 13 < 1 s, first chart paint < 1.5 s after parse, pan >= 30 fps, JS bundle < 300 kB gzip (excluding chart lib or documented)
- [ ] Playwright perf test on `Example/2026-10-25_09-33-22.csv` runs in CI (non-blocking at first)
- [ ] Also validated with a synthetic 210-column file

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
