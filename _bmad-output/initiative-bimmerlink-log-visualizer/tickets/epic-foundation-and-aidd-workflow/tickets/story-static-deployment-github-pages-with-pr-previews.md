---
id: 9
type: story
title: 'Static deployment (GitHub Pages) with PR previews'
parent: epic-foundation-and-aidd-workflow
after: []
hitl: false
---

# Static deployment (GitHub Pages) with PR previews

## Description

As a user, I want a public URL to use the tool so that I can use it without cloning the repo.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Production build deployed from `main` to GitHub Pages (base path configured)
- [x] Deployment status badge in README
- [ ] Preview build artifact per PR (or documented alternative)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S11 (GitHub issue #11), area foundation; text and checkbox state kept.
- Open question: the deploy and preview-artifact criteria are covered by tests of the workflow file and by the base-path build, but only a real run proves them: the first push to `main` (needs Settings > Pages > Source set to GitHub Actions) and the first pull request run. Tick them after those runs.
