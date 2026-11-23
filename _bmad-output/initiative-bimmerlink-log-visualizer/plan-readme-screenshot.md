---
title: 'Show a screenshot of the app in the README'
type: chore
ticket: ''
created: '2026-11-23'
status: built
baseline_revision: '16eca47dd39731761286895a72059cd0b7e498ff'
route: oneshot
route_source: auto
risk: low
review: quick
review_source: pinned
lenses_ran: [quick]
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The README describes the app in words only, so a visitor cannot see what it does before running it.

**Approach:** Capture a screenshot of the production build with a real example log loaded, commit it under `docs/images/`, and show it near the top of `README.md`; a Vitest check keeps the image link from going stale.

</frozen-after-approval>

## Implementation Notes

Oneshot: one image, a few README lines and one small test (well under 100 lines).

- Capture with the installed Playwright against `npm run preview`, loading `Example/2026-10-25_09-33-22.csv` the way `e2e/support.ts` `openLog` does; the capture script stays in the scratchpad (one-off, not committed).
- Test: extend the `README` describe in `src/test/deploy.test.ts` so every local image the README links exists on disk.
- Review fix: re-captured with Engine Speed, both rail pressures, accelerator pedal and oil temperature selected (the default preset led with a misfire counter that is flat at 0, which left the overview strip and two series empty).

## Verification

**Commands:**

- `npm run check` -- expected: green
- `npm run build` -- expected: green
- `npm run e2e` -- expected: green

**Manual checks (if no CLI):**

- The screenshot shows charts drawn from a real log and renders on the README.

## Review Triage Log

Quick lens: 1 medium, 1 low, 1 false.

- medium, patch: the screenshot led with flat misfire counters, so the overview strip showed a flat line and two of six series were empty. Re-captured with five live channels.
- low, defer: AGENTS.md folder layout does not list `docs/images/`. Fixing it means editing AGENTS.md, so it went to `deferred-work.md`.
- false: the untracked `pnpm-lock.yaml` is not part of this change; it is left out of the commit.
