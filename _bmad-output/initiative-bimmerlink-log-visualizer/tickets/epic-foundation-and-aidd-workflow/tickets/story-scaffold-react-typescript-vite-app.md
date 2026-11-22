---
id: 1
type: story
title: 'Scaffold React + TypeScript + Vite app'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Scaffold React + TypeScript + Vite app

## Description

As a developer, I want a working app skeleton on the latest stable React so that every following story starts from a runnable base.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] `npm run dev`, `build` and `preview` work on a fresh clone
- [x] Uses latest stable React (19.x), TypeScript strict mode and Vite
- [x] Folder structure documented (`src/features/*`, `src/lib/*`, `src/data/*`)
- [x] `.gitignore`, `.editorconfig`, Node version pinned (`.nvmrc` / `engines`)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S03 (GitHub issue #3), area foundation, mvp; text and checkbox state kept.
