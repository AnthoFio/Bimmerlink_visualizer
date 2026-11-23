---
id: 2
type: story
title: 'Light and dark theme'
parent: epic-ux-quality-performance-accessibility-theming
after: [4.1]
hitl: false
---

# Light and dark theme

## Description

As a BimmerLink user, I want the app to follow my system theme with a manual override so that it is comfortable in a garage or in daylight.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] `prefers-color-scheme` honoured; manual toggle persisted
- [x] Chart palettes tuned for both themes with sufficient contrast
- [x] No flash of wrong theme on load

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-ux-quality-performance-accessibility-theming/epic-ux-quality-performance-accessibility-theming.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S55 (GitHub issue #55), area nfr; text and checkbox state kept.
