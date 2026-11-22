---
id: 1
type: story
title: 'Manual Y-axis min/max per axis'
parent: epic-axis-and-scale-control
after: [4.3]
hitl: false
---

# Manual Y-axis min/max per axis

## Description

As a BimmerLink user, I want to set min and max on any Y axis, or reset to auto so that I can zoom on a value range such as lambda 0.7 to 1.3.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Each axis has min, max inputs and an 'Auto' toggle
- [ ] Invalid ranges (min >= max, NaN) rejected inline
- [ ] Values persist while switching panels/selection in the session
- [ ] Y zoom via the inputs and via axis drag (if supported by the chosen library)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-axis-and-scale-control/epic-axis-and-scale-control.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S37 (GitHub issue #37), area scale, mvp; text and checkbox state kept.
