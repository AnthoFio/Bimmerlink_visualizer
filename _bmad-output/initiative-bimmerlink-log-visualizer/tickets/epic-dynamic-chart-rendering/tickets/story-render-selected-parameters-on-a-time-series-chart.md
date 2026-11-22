---
id: 1
type: story
title: 'Render selected parameters on a time-series chart'
parent: epic-dynamic-chart-rendering
after: [2.2]
hitl: false
---

# Render selected parameters on a time-series chart

## Description

As a BimmerLink user, I want my selected parameters plotted against time so that I can see how channels evolve during the drive.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Chart renders one line per selected parameter, X axis = Time in seconds (mm:ss labels when > 120 s)
- [ ] Series update immediately when the selection changes without remounting the chart
- [ ] Empty selection shows a helpful empty state
- [ ] Works on every file in `Example/`

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-dynamic-chart-rendering/epic-dynamic-chart-rendering.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S25 (GitHub issue #25), area charts, mvp; text and checkbox state kept.
