---
id: 4
type: story
title: 'Responsive layout'
parent: epic-ux-quality-performance-accessibility-theming
after: [1.8, 4.1, 5.1]
hitl: false
---

# Responsive layout

## Description

As a BimmerLink user, I want the app to work on laptop and tablet widths so that I can review logs next to the car.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Side panel collapses to a drawer below 900 px
- [ ] Charts resize without losing state
- [ ] Verified at 1440, 1024 and 768 px in e2e screenshots

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-ux-quality-performance-accessibility-theming/epic-ux-quality-performance-accessibility-theming.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S57 (GitHub issue #57), area nfr; text and checkbox state kept.
