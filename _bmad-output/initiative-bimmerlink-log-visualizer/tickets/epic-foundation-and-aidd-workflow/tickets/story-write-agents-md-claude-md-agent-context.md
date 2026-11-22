---
id: 3
type: story
title: 'Write AGENTS.md / CLAUDE.md agent context'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Write AGENTS.md / CLAUDE.md agent context

## Description

As a developer working with AI agents, I want a single, accurate context file for agents so that they build, test and contribute consistently without re-asking.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] Documents commands (install, dev, test, lint, typecheck, build, e2e)
- [x] Documents architecture, naming, folder layout and testing conventions
- [x] Documents the log format and catalog facts (see epic) and where fixtures live
- [x] Documents the story workflow: read issue > write failing tests from acceptance criteria > implement > open PR with `Closes #n`
- [x] Documents the existing skills in `.claude/skills` and `.agents/skills`

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S05 (GitHub issue #5), area foundation, mvp; text and checkbox state kept.
