---
id: S03
type: story
title: 'Scaffold React + TypeScript + Vite app'
issue: 3
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/3
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
created: 2026-11-18
---

# Scaffold React + TypeScript + Vite app

## User story

As a developer, I want a working app skeleton on the latest stable React so that every following story starts from a runnable base.

## Acceptance criteria

- [x] `npm run dev`, `build` and `preview` work on a fresh clone
- [x] Uses latest stable React (19.x), TypeScript strict mode and Vite
- [x] Folder structure documented (`src/features/*`, `src/lib/*`, `src/data/*`)
- [x] `.gitignore`, `.editorconfig`, Node version pinned (`.nvmrc` / `engines`)

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed
