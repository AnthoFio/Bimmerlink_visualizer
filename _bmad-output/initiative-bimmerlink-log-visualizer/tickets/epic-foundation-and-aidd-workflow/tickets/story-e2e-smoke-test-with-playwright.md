---
id: 8
type: story
title: 'E2E smoke test with Playwright'
parent: epic-foundation-and-aidd-workflow
after: [2.1, 2.2, 4.1]
hitl: false
---

# E2E smoke test with Playwright

## Description

As a developer or agent, I want a browser-level smoke test so that an agent can self-verify a change end to end.

## Requirements

Verify: Every acceptance criterion below holds.

- [ ] Playwright installed and runnable headless in CI
- [ ] Smoke test: open page, upload an example log, assert at least one chart canvas/SVG renders
- [ ] Screenshot artifact uploaded on failure

## Definition of done

- [ ] Tests added/updated (unit and, where relevant, e2e on the `Example/` logs)
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Docs / AGENTS.md updated if conventions changed

## References

- parent — _bmad-output/initiative-bimmerlink-log-visualizer/tickets/epic-foundation-and-aidd-workflow/epic-foundation-and-aidd-workflow.md, section Description

## Notes

- Decision: 2026-11-22 — migrated from docs/backlog story S10 (GitHub issue #10), area foundation; text and checkbox state kept.
- Decision: 2026-11-22 — kept from the original issue: "Becomes meaningful once upload + first chart stories land; scaffold the harness early."
