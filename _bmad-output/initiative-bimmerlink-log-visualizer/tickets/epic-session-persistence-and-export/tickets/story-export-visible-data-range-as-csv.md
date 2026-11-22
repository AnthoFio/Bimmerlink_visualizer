---
id: 4
type: story
title: 'Export visible data range as CSV'
parent: epic-session-persistence-and-export
after: [5.1, 6.1]
hitl: false
---

# Export visible data range as CSV

## Description

As a BimmerLink user, I want to download the selected parameters over the current window as CSV so that I can post-process them in a spreadsheet.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Same format as BimmerLink (Time + labels), only selected columns and visible window
- [x] Large exports do not freeze the UI

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-session-persistence-and-export/epic-session-persistence-and-export.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S52 (GitHub issue #52), area session; text and checkbox state kept.
