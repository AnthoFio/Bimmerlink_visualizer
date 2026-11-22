---
id: S56
type: story
title: 'Accessibility baseline (WCAG 2.2 AA)'
issue: 56
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/56
status: 'Backlog'
github_state: open
parent: 53
area: nfr
mvp: false
labels: ['user-story', 'area:nfr']
depends_on: [S10, S25, S31]
blocks: []
created: 2026-11-18
---

# Accessibility baseline (WCAG 2.2 AA)

## User story

As a keyboard or screen-reader user, I want a usable interface so that I am not blocked by the tool.

## Acceptance criteria

- [ ] All controls reachable and operable by keyboard with visible focus
- [ ] Colour is never the only differentiator (line styles/markers option)
- [ ] axe checks pass in Playwright on the main screens
- [ ] Chart has a text alternative: summary and data-table fallback for the selected range

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
