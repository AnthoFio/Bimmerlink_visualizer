---
id: S05
type: story
title: 'Write AGENTS.md / CLAUDE.md agent context'
issue: 5
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/5
status: 'Done'
github_state: closed
parent: 2
area: foundation
mvp: true
labels: ['user-story', 'mvp', 'area:foundation']
created: 2026-11-18
---

# Write AGENTS.md / CLAUDE.md agent context

## User story

As a developer working with AI agents, I want a single, accurate context file for agents so that they build, test and contribute consistently without re-asking.

## Acceptance criteria

- [x] Documents commands (install, dev, test, lint, typecheck, build, e2e)
- [x] Documents architecture, naming, folder layout and testing conventions
- [x] Documents the log format and catalog facts (see epic) and where fixtures live
- [x] Documents the story workflow: read issue > write failing tests from acceptance criteria > implement > open PR with `Closes #n`
- [x] Documents the existing skills in `.claude/skills` and `.agents/skills`

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed
