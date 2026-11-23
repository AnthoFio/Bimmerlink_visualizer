---
id: 3
type: story
title: 'Accessibility baseline (WCAG 2.2 AA)'
parent: epic-ux-quality-performance-accessibility-theming
after: [1.8, 4.1, 5.1]
hitl: false
---

# Accessibility baseline (WCAG 2.2 AA)

## Description

As a keyboard or screen-reader user, I want a usable interface so that I am not blocked by the tool.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] All controls reachable and operable by keyboard with visible focus
- [x] Colour is never the only differentiator (line styles/markers option)
- [x] axe checks pass in Playwright on the main screens
- [x] Chart has a text alternative: summary and data-table fallback for the selected range

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-ux-quality-performance-accessibility-theming/epic-ux-quality-performance-accessibility-theming.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S56 (GitHub issue #56), area nfr; text and checkbox state kept.
