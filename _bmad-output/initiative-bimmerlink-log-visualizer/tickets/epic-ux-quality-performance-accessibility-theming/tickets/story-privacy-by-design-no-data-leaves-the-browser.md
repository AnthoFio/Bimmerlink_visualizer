---
id: 5
type: story
title: 'Privacy by design: no data leaves the browser'
parent: epic-ux-quality-performance-accessibility-theming
after: [1.8, 2.1]
hitl: false
---

# Privacy by design: no data leaves the browser

## Description

As a BimmerLink user, I want certainty that my log stays on my machine so that I can load logs from my own car without concern.

## Requirements

Verify: Every acceptance criterion below holds.

- [x] No network requests carry log data (verified by an e2e test that blocks the network after load)
- [x] Strict Content-Security-Policy in the deployed build
- [x] Privacy statement visible on the landing page
- [x] No third-party analytics by default

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-ux-quality-performance-accessibility-theming/epic-ux-quality-performance-accessibility-theming.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S58 (GitHub issue #58), area nfr; text and checkbox state kept.
