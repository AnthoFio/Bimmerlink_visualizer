---
id: 2
type: story
title: 'Export chart as PNG/SVG'
parent: epic-session-persistence-and-export
after: [4.1, 4.2, 5.4]
hitl: false
---

# Export chart as PNG/SVG

## Description

As a BimmerLink user, I want to export the current view as an image so that I can share it in a forum or a report.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Exports all panels with legend, axis titles and the log file name/date
- [ ] PNG at 2x resolution, SVG when the library supports it
- [ ] Export reflects current zoom and scales

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-session-persistence-and-export/epic-session-persistence-and-export.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S50 (GitHub issue #50), area session; text and checkbox state kept.
