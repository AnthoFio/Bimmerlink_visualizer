---
id: 6
type: story
title: "Handle logs' ramp-up artefacts"
parent: epic-csv-upload-and-parsing
after: [2]
hitl: false
---

# Handle logs' ramp-up artefacts

## Description

As a BimmerLink user, I want initial zero values before a channel reports to be recognised so that charts do not show misleading spikes at t=0.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Detect the leading staggered-zero region per channel (value held at 0 until first change)
- [x] Option 'trim to first complete row' (default on) with an indicator of how much was trimmed
- [x] Documented behaviour and test on `Example/2026-10-25_09-33-22.csv`

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-csv-upload-and-parsing/epic-csv-upload-and-parsing.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S18 (GitHub issue #18), area ingest; text and checkbox state kept.
- Decision: 2026-11-22 — kept from the original issue: "Example: columns appear one after another in the first ~0.3 s of every log."
