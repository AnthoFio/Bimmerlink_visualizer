---
id: S18
type: story
title: "Handle logs' ramp-up artefacts"
issue: 18
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/18
status: 'Backlog'
github_state: open
parent: 12
area: ingest
mvp: false
labels: ['user-story', 'area:ingest']
depends_on: [S14]
blocks: []
created: 2026-11-18
---

# Handle logs' ramp-up artefacts

## User story

As a BimmerLink user, I want initial zero values before a channel reports to be recognised so that charts do not show misleading spikes at t=0.

## Acceptance criteria

- [ ] Detect the leading staggered-zero region per channel (value held at 0 until first change)
- [ ] Option 'trim to first complete row' (default on) with an indicator of how much was trimmed
- [ ] Documented behaviour and test on `Example/2026-10-25_09-33-22.csv`

## Notes

Example: columns appear one after another in the first ~0.3 s of every log.

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
