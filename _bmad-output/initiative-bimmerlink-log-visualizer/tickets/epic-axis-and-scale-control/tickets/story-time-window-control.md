---
id: 5
type: story
title: 'Time-window control'
parent: epic-axis-and-scale-control
after: [6.1]
hitl: false
---

# Time-window control

## Description

As a BimmerLink user, I want to enter an exact start and end time for the X axis so that I can jump to a known event, for example 612 s to 640 s.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Start/end inputs in seconds or mm:ss
- [x] Clamped to the log duration; 'Full log' reset
- [x] Updates and is updated by zoom/pan interactions (single source of truth)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-axis-and-scale-control/epic-axis-and-scale-control.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S41 (GitHub issue #41), area scale; text and checkbox state kept.
