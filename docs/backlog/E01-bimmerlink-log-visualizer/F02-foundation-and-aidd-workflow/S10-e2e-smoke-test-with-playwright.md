---
id: S10
type: story
title: 'E2E smoke test with Playwright'
issue: 10
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/10
status: 'Backlog'
github_state: open
parent: 2
area: foundation
mvp: false
labels: ['user-story', 'area:foundation']
depends_on: [S13, S14, S25]
blocks: [S54, S56, S57, S58]
created: 2026-11-18
---

# E2E smoke test with Playwright

## User story

As a developer or agent, I want a browser-level smoke test so that an agent can self-verify a change end to end.

## Acceptance criteria

- [ ] Playwright installed and runnable headless in CI
- [ ] Smoke test: open page, upload an example log, assert at least one chart canvas/SVG renders
- [ ] Screenshot artifact uploaded on failure

## Notes

Becomes meaningful once upload + first chart stories land; scaffold the harness early.

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
