# Dependencies and execution waves

Hard dependencies between stories, derived from their acceptance criteria. The same data lives in each story front matter (`depends_on`, `blocks`); this file is the overview for dispatching work to several agents.

Rules:

- A story is **ready** when every story in its `depends_on` is `Done`. Take only ready stories.
- Stories in the same wave never depend on each other, so they can run in parallel, one agent and one git worktree each.
- Several stories of one wave still touch shared integration points (the app store, `App.tsx`): keep those edits small and rebase often.
- When a dependency changes, update the front matter of both stories and this file in the same PR.

## Ready now (snapshot 2026-11-22)

S11 Static deployment (GitHub Pages) with PR previews; S13 Landing page inviting a CSV upload; S14 Parse CSV into a column-oriented dataset; S20 Bundle the catalog as typed app data.

## Wave 0

| Story                                                                                                                        | Title                                             | Status  | Depends on |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------- | ---------- |
| [S11](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S11-static-deployment-github-pages-with-pr-previews.md) | Static deployment (GitHub Pages) with PR previews | Backlog | -          |
| [S13](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S13-landing-page-inviting-a-csv-upload.md)                    | Landing page inviting a CSV upload                | Backlog | -          |
| [S14](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S14-parse-csv-into-a-column-oriented-dataset.md)              | Parse CSV into a column-oriented dataset          | Backlog | -          |
| [S20](E01-bimmerlink-log-visualizer/F19-parameter-catalog-enrichment/S20-bundle-the-catalog-as-typed-app-data.md)            | Bundle the catalog as typed app data              | Backlog | -          |

## Wave 1

| Story                                                                                                                     | Title                                             | Status  | Depends on |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------- | ---------- |
| [S15](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S15-parse-in-a-web-worker-with-progress.md)                | Parse in a Web Worker with progress               | Backlog | S14        |
| [S16](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S16-validation-and-friendly-error-messages.md)             | Validation and friendly error messages            | Backlog | S14        |
| [S17](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S17-file-summary-and-loading-another-file.md)              | File summary and loading another file             | Backlog | S13, S14   |
| [S18](E01-bimmerlink-log-visualizer/F12-csv-upload-and-parsing/S18-handle-logs-ramp-up-artefacts.md)                      | Handle logs' ramp-up artefacts                    | Backlog | S14        |
| [S21](E01-bimmerlink-log-visualizer/F19-parameter-catalog-enrichment/S21-match-log-columns-to-catalog-entries.md)         | Match log columns to catalog entries              | Backlog | S14, S20   |
| [S25](E01-bimmerlink-log-visualizer/F24-dynamic-chart-rendering/S25-render-selected-parameters-on-a-time-series-chart.md) | Render selected parameters on a time-series chart | Backlog | S14        |

## Wave 2

| Story                                                                                                                     | Title                                 | Status  | Depends on    |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------- | ------------- |
| [S10](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S10-e2e-smoke-test-with-playwright.md)               | E2E smoke test with Playwright        | Backlog | S13, S14, S25 |
| [S26](E01-bimmerlink-log-visualizer/F24-dynamic-chart-rendering/S26-multiple-chart-panels.md)                             | Multiple chart panels                 | Backlog | S25           |
| [S27](E01-bimmerlink-log-visualizer/F24-dynamic-chart-rendering/S27-multiple-y-axes-by-unit.md)                           | Multiple Y axes by unit               | Backlog | S21, S25      |
| [S28](E01-bimmerlink-log-visualizer/F24-dynamic-chart-rendering/S28-downsampling-for-large-series.md)                     | Downsampling for large series         | Backlog | S25           |
| [S29](E01-bimmerlink-log-visualizer/F24-dynamic-chart-rendering/S29-step-vs-linear-line-style.md)                         | Step vs linear line style             | Backlog | S21, S25      |
| [S31](E01-bimmerlink-log-visualizer/F30-parameter-selection-and-grouping/S31-parameter-list-with-show-hide-toggles.md)    | Parameter list with show/hide toggles | Backlog | S14, S25      |
| [S43](E01-bimmerlink-log-visualizer/F42-chart-exploration-interactions/S43-zoom-and-pan-on-the-time-axis.md)              | Zoom and pan on the time axis         | Backlog | S25           |
| [S45](E01-bimmerlink-log-visualizer/F42-chart-exploration-interactions/S45-hover-tooltip-with-all-visible-values.md)      | Hover tooltip with all visible values | Backlog | S25           |
| [S55](E01-bimmerlink-log-visualizer/F53-ux-quality-performance-accessibility-theming-privacy/S55-light-and-dark-theme.md) | Light and dark theme                  | Backlog | S25           |

## Wave 3

| Story                                                                                                                                             | Title                                             | Status  | Depends on    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------- | ------------- |
| [S22](E01-bimmerlink-log-visualizer/F19-parameter-catalog-enrichment/S22-show-unit-category-and-description-on-parameters.md)                     | Show unit, category and description on parameters | Backlog | S21, S25, S31 |
| [S23](E01-bimmerlink-log-visualizer/F19-parameter-catalog-enrichment/S23-role-aware-defaults.md)                                                  | Role-aware defaults                               | Backlog | S21, S31      |
| [S32](E01-bimmerlink-log-visualizer/F30-parameter-selection-and-grouping/S32-search-and-filter-parameters.md)                                     | Search and filter parameters                      | Backlog | S21, S31      |
| [S33](E01-bimmerlink-log-visualizer/F30-parameter-selection-and-grouping/S33-group-by-category-with-bulk-toggle.md)                               | Group by category with bulk toggle                | Backlog | S21, S31      |
| [S34](E01-bimmerlink-log-visualizer/F30-parameter-selection-and-grouping/S34-series-colours-and-legend.md)                                        | Series colours and legend                         | Backlog | S25, S31      |
| [S35](E01-bimmerlink-log-visualizer/F30-parameter-selection-and-grouping/S35-presets-from-the-catalog.md)                                         | Presets from the catalog                          | Backlog | S21, S31      |
| [S37](E01-bimmerlink-log-visualizer/F36-axis-and-scale-control/S37-manual-y-axis-min-max-per-axis.md)                                             | Manual Y-axis min/max per axis                    | Backlog | S27           |
| [S38](E01-bimmerlink-log-visualizer/F36-axis-and-scale-control/S38-auto-fit-modes.md)                                                             | Auto-fit modes                                    | Backlog | S25, S43      |
| [S39](E01-bimmerlink-log-visualizer/F36-axis-and-scale-control/S39-normalised-overlay-mode.md)                                                    | Normalised overlay mode                           | Backlog | S27           |
| [S40](E01-bimmerlink-log-visualizer/F36-axis-and-scale-control/S40-move-series-between-axes-and-panels.md)                                        | Move series between axes and panels               | Backlog | S26, S27      |
| [S41](E01-bimmerlink-log-visualizer/F36-axis-and-scale-control/S41-time-window-control.md)                                                        | Time-window control                               | Backlog | S43           |
| [S44](E01-bimmerlink-log-visualizer/F42-chart-exploration-interactions/S44-synchronised-zoom-and-cursor-across-panels.md)                         | Synchronised zoom and cursor across panels        | Backlog | S26, S43      |
| [S46](E01-bimmerlink-log-visualizer/F42-chart-exploration-interactions/S46-range-selection-with-statistics.md)                                    | Range selection with statistics                   | Backlog | S43           |
| [S47](E01-bimmerlink-log-visualizer/F42-chart-exploration-interactions/S47-overview-minimap-with-brush.md)                                        | Overview minimap with brush                       | Backlog | S43           |
| [S49](E01-bimmerlink-log-visualizer/F48-session-persistence-and-export/S49-persist-view-configuration-locally.md)                                 | Persist view configuration locally                | Backlog | S31           |
| [S52](E01-bimmerlink-log-visualizer/F48-session-persistence-and-export/S52-export-visible-data-range-as-csv.md)                                   | Export visible data range as CSV                  | Backlog | S31, S43      |
| [S54](E01-bimmerlink-log-visualizer/F53-ux-quality-performance-accessibility-theming-privacy/S54-performance-budget-and-automated-measurement.md) | Performance budget and automated measurement      | Backlog | S10, S15, S28 |
| [S56](E01-bimmerlink-log-visualizer/F53-ux-quality-performance-accessibility-theming-privacy/S56-accessibility-baseline-wcag-2-2-aa.md)           | Accessibility baseline (WCAG 2.2 AA)              | Backlog | S10, S25, S31 |
| [S57](E01-bimmerlink-log-visualizer/F53-ux-quality-performance-accessibility-theming-privacy/S57-responsive-layout.md)                            | Responsive layout                                 | Backlog | S10, S25, S31 |
| [S58](E01-bimmerlink-log-visualizer/F53-ux-quality-performance-accessibility-theming-privacy/S58-privacy-by-design-no-data-leaves-the-browser.md) | Privacy by design: no data leaves the browser     | Backlog | S10, S13      |

## Wave 4

| Story                                                                                                                       | Title                                        | Status  | Depends on    |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------- | ------------- |
| [S50](E01-bimmerlink-log-visualizer/F48-session-persistence-and-export/S50-export-chart-as-png-svg.md)                      | Export chart as PNG/SVG                      | Backlog | S25, S26, S34 |
| [S51](E01-bimmerlink-log-visualizer/F48-session-persistence-and-export/S51-export-and-import-view-configuration-as-json.md) | Export and import view configuration as JSON | Backlog | S49           |

## Already done

| Story                                                                                                                       | Title                                              | Status | Depends on |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------ | ---------- |
| [S03](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S03-scaffold-react-typescript-vite-app.md)             | Scaffold React + TypeScript + Vite app             | Done   | -          |
| [S04](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S04-spike-choose-the-charting-library-adr.md)          | Spike: choose the charting library (ADR)           | Done   | -          |
| [S05](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S05-write-agents-md-claude-md-agent-context.md)        | Write AGENTS.md / CLAUDE.md agent context          | Done   | -          |
| [S06](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S06-quality-gates-lint-format-typecheck-unit-tests.md) | Quality gates: lint, format, typecheck, unit tests | Done   | -          |
| [S07](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S07-ci-pipeline-on-github-actions.md)                  | CI pipeline on GitHub Actions                      | Done   | -          |
| [S08](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S08-issue-and-pr-templates-plus-label-taxonomy.md)     | Issue and PR templates plus label taxonomy         | Done   | -          |
| [S09](E01-bimmerlink-log-visualizer/F02-foundation-and-aidd-workflow/S09-test-fixtures-derived-from-the-example-logs.md)    | Test fixtures derived from the example logs        | Done   | -          |
