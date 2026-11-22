---
id: S58
type: story
title: 'Privacy by design: no data leaves the browser'
issue: 58
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/58
status: 'Backlog'
github_state: open
parent: 53
area: nfr
mvp: false
labels: ['user-story', 'area:nfr']
depends_on: [S10, S13]
blocks: []
created: 2026-11-18
---

# Privacy by design: no data leaves the browser

## User story

As a BimmerLink user, I want certainty that my log stays on my machine so that I can load logs from my own car without concern.

## Acceptance criteria

- [ ] No network requests carry log data (verified by an e2e test that blocks the network after load)
- [ ] Strict Content-Security-Policy in the deployed build
- [ ] Privacy statement visible on the landing page
- [ ] No third-party analytics by default

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed
