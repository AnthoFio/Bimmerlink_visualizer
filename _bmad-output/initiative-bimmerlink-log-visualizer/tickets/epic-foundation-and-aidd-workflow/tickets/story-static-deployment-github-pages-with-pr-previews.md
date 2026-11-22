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
- [x] Preview build artifact per PR (or documented alternative)

## Definition of done

- [x] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [x] Lint, typecheck, tests and build pass in CI
- [x] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S11 (GitHub issue #11), area foundation; text and checkbox state kept.
- Decision: 2026-11-22 — the PR preview criterion is proven: the Deploy run of PR #72 uploaded the artifact `preview-pr-72`.
- Open question: the deploy criterion is still unproven. The first Deploy run on `main` (1eb9515) built and uploaded the Pages artifact but failed creating the deployment with 404, because GitHub Pages is not enabled on the repository (Settings > Pages > Source = GitHub Actions). Re-run the Deploy workflow after enabling it, then tick the criterion and mark the plan done.
