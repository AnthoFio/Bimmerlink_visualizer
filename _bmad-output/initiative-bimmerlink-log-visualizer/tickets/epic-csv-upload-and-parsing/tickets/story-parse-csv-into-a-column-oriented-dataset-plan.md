---
title: 'Parse CSV into a column-oriented dataset'
ticket: 2
status: done
---

## Code Review

### 2026-11-22 — Code review complete. 0 `decision-needed`, 7 `patch`, 0 `defer`, 7 rejected.

- [x] [Review][Patch] Record boundaries: treat a lone CR as a line break and document that quoted cells cannot span lines (decided 2026-11-22: option 1, was decision-needed; a lone-CR file parsed silently into garbage columns and 0 rows) [src/lib/parseLog.ts line scan]
- [x] [Review][Patch] toNumber accepts hex, octal and binary literals as numbers (0x10 gives 16) [src/lib/parseLog.ts:toNumber]
- [x] [Review][Patch] Non-finite cells (Infinity, -Infinity, 1e999, NaN) are not pinned to NaN by any test [src/lib/parseLog.test.ts]
- [x] [Review][Patch] Example/ test expectations are derived from the parser's own rules or weak (literal counts, 1.03 and 90.50 by column, BOM case, parseLog(File) on a real log) [src/lib/parseLog.test.ts]
- [x] [Review][Patch] The BOM constant is an invisible literal character; write it as an escape [src/lib/parseLog.ts:44]
- [x] [Review][Patch] Dataset contract gaps undocumented and unpinned (NaN or unordered time, empty header label, Time-only header, second Time column) [src/lib/parseLog.ts, src/lib/parseLog.test.ts]
- [x] [Review][Patch] LogParseError.code is mutable; make it readonly [src/lib/parseLog.ts]

#### Rejected

- Performance claim untested (2 raw findings): false alarm for the claim, measured 172 ms for 51,019 rows; a timing assertion would be flaky and the budget belongs to the worker and performance stories.
- Peak memory about doubled by preallocate-then-slice: low, about 5 MB at the largest log; the fix adds complexity.
- Process artifacts thin (plan stub, Decision lines, worker-safety untested): false, the plan stub is what `tickets.py mark` creates and the notes are intended.
- Header valid but zero data rows: false, intended and pinned by a test; the header-only message belongs to S16.
- Non-UTF-8 bytes decoded with replacement: low, the Example logs have no non-ASCII bytes; a strict decoder needs our own decoding.
- Huge preallocation for wide or long files: low, allocation follows a valid Time header and sizes are far from limits.
- No upload wiring, UI or worker (intent reading B): false, scope belongs to S13, S15 and S17.
