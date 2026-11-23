# Performance budgets

The budgets of story S54 and how `npm run e2e:perf` measures them. The spec is `e2e/perf.spec.ts`; it runs against the production build (`npm run build` first) on one worker, with tracing off (tracing screenshots every frame, which is most of what would be measured).

## Budgets

| Budget                    | Limit                          | Measured as                                                                                       |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Parse, 50k rows x 13 cols | < 1 s                          | the `log-parse` measure: file received by the app until the dataset arrives from the parse worker |
| First chart paint         | < 1.5 s after parse            | the `log-first-chart-paint` measure: dataset arrived until the first uPlot draw that has series   |
| Pan                       | >= 30 fps                      | sideways wheel events, one per animation frame, 150 frames, zoomed to 95% and to 10% of the log   |
| App JavaScript            | < 300 kB gzip, chart lib apart | every same-origin `.js` the browser loads (page, chunks, worker), gzipped in Node, minus uPlot    |

The two measures are User Timing entries written by `src/lib/perfMarks.ts` (called from `src/features/upload/useLogLoader.ts` and the uPlot `draw` hook in `src/features/charts/ChartPanel.tsx`); the test reads them with `performance.getEntriesByName(..., 'measure')`. They cost two `performance.measure` calls per log and print nothing. The parse measure includes reading the file, the worker's parse and validation, and transferring the typed arrays back.

The bundle size is measured in the browser, from the served bodies, not from the build output. uPlot is built into a chunk of its own (`codeSplitting` in `vite.config.ts`); the test finds it by content (uPlot's class names `u-wrap` and `u-under`, and no app label) and reports it separately. The total including uPlot is reported too.

## Inputs

- `Example/2026-10-25_09-33-22.csv`, the biggest example log: 51,019 rows, 11 channels. Parse and first paint.
- That log widened to 13 channels (`wideLog(13)` in `e2e/support.ts`, which repeats real columns, scaled a little): parse, first paint, and pan with all 13 series selected.
- A synthetic log of 210 columns: the same log widened with the catalog labels it does not already have (`bimmerlink_n55_parameter_catalog.json`), so the whole app path runs: catalog matching, the default selection, hidden roles. It is about 70 MB, so the test writes it to its output folder and opens it from there. Checked: first paint < 1.5 s; the parse at the 13-column budget's time per cell (< 1 s x 210 / 13); pan >= 30 fps with the `Core only` preset (49 series). Also measured, without a budget: pan with `Select all` of the listed parameters (140 series in one chart).

## Latest local numbers

Windows 11, headless Chromium (Playwright 1.59), production build, 2026-11-23 (ranges are over three runs that day):

| Input                 | Parse          | First paint  | Pan                                   |
| --------------------- | -------------- | ------------ | ------------------------------------- |
| Example log, 51k x 11 | 79 to 96 ms    | 73 to 116 ms |                                       |
| 51k x 13, window 95%  | 85 to 115 ms   | 70 to 94 ms  | 60 fps                                |
| 51k x 13, window 10%  | 83 to 121 ms   | 69 to 101 ms | 60 fps                                |
| 51k x 210             | 1.11 to 1.12 s | 97 to 102 ms | 41 to 58 fps (49 series, `Core only`) |
| 51k x 210, select all |                |              | 15 to 18 fps (140 series, no budget)  |

JavaScript, gzip (1 kB = 1000 bytes, Node's default level): app 104.6 kB (main chunk 102.2 kB, parse worker 2.4 kB), uPlot 22.0 kB, total 126.6 kB.

## Caveats

- Headless Chromium rasterises the canvas in software. Line width matters a lot there: 1.5 px lines panned at 24 to 27 fps against 60 fps for the 1 px hairlines the charts use now (`ChartPanel.tsx`).
- 60 fps is the display's frame rate, so the pan numbers at 13 series are capped, not exact.
- Timings vary with the machine and its load. Run `npm run e2e:perf` alone on a quiet machine; never next to `npm run e2e` or the unit tests.
- CI runners are shared and slower than a desktop, so in CI the perf job (`perf` in `.github/workflows/ci.yml`) is non-blocking: it does not fail the required check `CI`, and it uploads every test's `perf.json` as the artifact `perf-results`. Make it blocking once its numbers have proven stable.
- Panning every listed parameter of a 210-column log (140 series) stays below 30 fps. The budget is for an analysis-sized selection; drawing 140 lines per frame is the known limit.
- `src/lib/readLog.perf.test.ts` checks the parse alone in Node (best of five), without the worker and the file read.
