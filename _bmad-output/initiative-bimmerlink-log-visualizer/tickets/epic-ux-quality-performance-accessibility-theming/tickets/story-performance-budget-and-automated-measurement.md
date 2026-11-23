---
id: 1
type: story
title: 'Performance budget and automated measurement'
parent: epic-ux-quality-performance-accessibility-theming
after: [1.8, 2.3, 4.4]
hitl: false
---

# Performance budget and automated measurement

## Description

As the maintainer, I want performance budgets enforced by tests so that regressions in load or interaction speed are caught early.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Budgets: parse 50k x 13 < 1 s, first chart paint < 1.5 s after parse, pan >= 30 fps, JS bundle < 300 kB gzip (excluding chart lib or documented)
- [ ] Playwright perf test on `Example/2026-10-25_09-33-22.csv` runs in CI (non-blocking at first)
- [x] Also validated with a synthetic 210-column file

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-ux-quality-performance-accessibility-theming/epic-ux-quality-performance-accessibility-theming.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S54 (GitHub issue #54), area nfr; text and checkbox state kept.
- Open question: 2026-11-23 — the CI perf job is wired and unit-tested but unproven until a GitHub Actions run (nothing was pushed).
