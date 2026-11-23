---
id: 1
type: story
title: 'Persist view configuration locally'
parent: epic-session-persistence-and-export
after: [5.1]
hitl: false
---

# Persist view configuration locally

## Description

As a BimmerLink user, I want my selection, panels, scales and colours remembered so that re-opening a similar log restores my view.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] View state serialised to localStorage, keyed by a hash of the sorted column labels
- [x] Restores only parameters present in the log; reports what was skipped
- [x] 'Reset view' clears the saved state
- [x] Persistence failures (quota, disabled storage) are silent and non-blocking

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-session-persistence-and-export/epic-session-persistence-and-export.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S49 (GitHub issue #49), area session; text and checkbox state kept.
