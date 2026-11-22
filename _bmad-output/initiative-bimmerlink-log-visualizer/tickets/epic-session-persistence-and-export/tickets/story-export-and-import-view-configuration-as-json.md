---
id: 3
type: story
title: 'Export and import view configuration as JSON'
parent: epic-session-persistence-and-export
after: [1]
hitl: false
---

# Export and import view configuration as JSON

## Description

As a BimmerLink user, I want to save my view to a file and load it on another log so that I can reuse an analysis setup or share it.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Versioned JSON schema (`version`, panels, series, axes, window)
- [x] Import validates the schema and reports unknown parameters
- [x] Round-trip test: export > import yields identical view state

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-session-persistence-and-export/epic-session-persistence-and-export.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S51 (GitHub issue #51), area session; text and checkbox state kept.
