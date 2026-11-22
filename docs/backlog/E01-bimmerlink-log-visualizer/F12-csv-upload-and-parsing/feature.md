---
id: F12
type: feature
title: 'CSV upload and parsing'
issue: 12
url: https://github.com/AnthoFio/Bimmerlink_visualizer/issues/12
status: 'Backlog'
github_state: open
parent: 1
area: ingest
mvp: true
labels: ['feature', 'mvp', 'area:ingest']
children: [13, 14, 15, 16, 17, 18]
created: 2026-11-18
---

# CSV upload and parsing

Open the page, get invited to upload a BimmerLink CSV, and have it parsed into a typed in-memory dataset driven by the header names. The parser must be tolerant, fast and run off the main thread.

**Outcome:** dropping any file from `Example/` produces a `Dataset` (time vector + named numeric columns) or a clear, actionable error.

## Stories

- [S13](S13-landing-page-inviting-a-csv-upload.md) Landing page inviting a CSV upload (Backlog)
- [S14](S14-parse-csv-into-a-column-oriented-dataset.md) Parse CSV into a column-oriented dataset (Backlog)
- [S15](S15-parse-in-a-web-worker-with-progress.md) Parse in a Web Worker with progress (Backlog)
- [S16](S16-validation-and-friendly-error-messages.md) Validation and friendly error messages (Backlog)
- [S17](S17-file-summary-and-loading-another-file.md) File summary and loading another file (Backlog)
- [S18](S18-handle-logs-ramp-up-artefacts.md) Handle logs' ramp-up artefacts (Backlog)
