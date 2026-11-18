# ADR 0001: Charting library

Status: Accepted
Date: 2026-11-18
Ticket: #4 (spike), epic #1, unblocks the Charts, Scale, Interaction, Session and UX features (#24, #36, #42, #48, #53)

## Context

The app turns a BimmerLink datalog into explorable time-series charts, entirely in the browser. The data shape is unusual for a
"dashboard" chart and drives the choice:

- **Big, regular, columnar data.** The example logs have 14k to 51k rows and 9 to 13 channels (about 660k points for the biggest
  log), one shared time column, about 30 ms irregular sampling, sample-and-hold semantics. The epic's guardrail is
  **50k rows x 13 channels interactive in under 1 s after parse**, and #28 requires **>= 30 fps while panning 51k x 13**.
- **Several panels, several Y axes.** Stacked panels that share one time window and one cursor (#26, #44); inside a panel the
  channels are grouped on one Y axis per unit (rpm, %, degC, bar, count), up to three axes per panel (#27); manual Y ranges,
  fit-all / fit-visible, normalised overlay (#37 to #39).
- **Direct manipulation.** Wheel zoom centred on the cursor, drag pan, pinch, keyboard, synchronised cursor, tooltip with 13+
  values, shift-drag range selection with statistics, optional minimap (#43 to #47).
- **Output and polish.** PNG at 2x and, where possible, SVG export (#50); light and dark palettes (#55); step vs linear lines (#29).
- **Constraints.** React 19 + TypeScript strict + Vite, client-side only, small bundle (the app is a static page).

### Decision drivers

1. Performance headroom on the target data (the explicit epic guardrail).
2. Fit with the feature list above, i.e. how much of it exists out of the box and how much we would write.
3. Bundle size and runtime memory.
4. React 19 fit (we render imperatively into a ref, so "fit" means no wrapper lock-in and clean effect cleanup).
5. Licence and maintenance risk.

## Options considered

All four candidates named in the ticket were compared. The two that looked strongest on the evidence (uPlot and Apache
ECharts) were prototyped in full on the real example log; Plotly.js and Recharts got a smaller smoke benchmark that is enough to
show where they stand.

- **uPlot 1.6.32** (MIT). Tiny canvas 2D library written for exactly this workload: large aligned time series. Multiple scales and
  axes are first class; cursor sync across plots is built in; no built-in downsampling, wheel zoom, pan or SVG export.
- **Apache ECharts 6.1.0** (Apache-2.0). Feature-complete canvas (or SVG) charting framework: multi-grid layout, dataZoom,
  tooltip, brush, toolbox, PNG and SVG export, themes, built-in `sampling` (lttb, minmax, ...). Tree-shakeable but heavy.
- **Plotly.js 4.3.0** (MIT). Rich scientific charting with SVG (`scatter`) and WebGL (`scattergl`) traces, native zoom/pan and
  image export. Very large bundle; SVG traces do not scale to this data size.
- **Recharts 3.11.0** (MIT). Declarative, React-native SVG components. Convenient for small dashboards; no zoom/pan
  API beyond a `Brush`, no downsampling, and SVG rendering of every point.

How each one fits React 19: uPlot, ECharts and Plotly.js are framework-agnostic and are driven imperatively from a ref inside
`useEffect` (create on mount, `destroy`/`dispose`/`purge` in the cleanup, which also makes them StrictMode-safe). Optional
community wrappers exist (`uplot-react` 1.2.4, `echarts-for-react` 3.1.0, `react-plotly.js` 4.1.0 with a React `^18 || ^19`
peer range) but none is needed. Recharts is the only one that is itself React components; its peer range includes React 19
(`^16.8 || ... || ^19`).

## Evidence

### Method and machine

- Machine: Intel Core i7-1250U (12 logical cores), 15.6 GB RAM, Windows 11, Node 24.11.1, laptop on mains power, nothing else
  deliberately running.
- Browser: headless Chromium 147.0.7727.15 (Playwright `chromium-1217`) driven with `playwright-core`; viewport 1280x900,
  device pixel ratio 1; **software rasterisation** (no GPU flags). `rAF` is capped at 60 Hz, so 60 fps means "every frame met".
- Data: `Example/2026-10-25_09-33-22.csv`, **51,019 rows**. The file has 11 channels, so two derived channels (1 s moving average
  of engine speed, rail-pressure error) were added to reach the 13 series of the target. A trivial throwaway parser reads it
  (about 60 to 70 ms on this machine; this is **not** the real parser).
- Layout used by both prototypes: 3 stacked, synced panels. Panel 1 has 4 series on 3 Y axes (rpm; %; degC), panel 2 has 3
  series on 1 axis (bar), panel 3 has 6 step-style misfire counters. A real wheel zoom and drag pan were applied with the
  mouse through Playwright and all panels were checked to follow (all three scales equal).
- "Initial render" = destroy and recreate all panels from in-memory data until two `requestAnimationFrame`s later (median of 7).
  "Pan" = 240 frames of a sliding x window programmatically moved once per `rAF`, window = 10 % (zoomed in) or 95 % (almost
  full log) of the 1533 s log. "Update cost" = back-to-back updates without `rAF` pacing (CPU time of one all-panel redraw
  up to the canvas flush; compositing/raster is not included). "Hover" = real mouse moves across panel 1 with the tooltip or
  cursor sync active.
- Raw numbers are committed: `spikes/charting-uplot/bench-result-*.json`, `spikes/charting-echarts/bench-result-*.json`,
  `spikes/charting-baseline/results/*.json`. Re-run them with the commands in `spikes/README.md`.
- Caveats: one laptop; every library shows run-to-run variance (ECharts visibly, uPlot less but not zero, see below); software raster is a pessimistic
  and GPU-less lower bound; the Plotly.js and Recharts numbers come from a smaller harness (3 renders, 60 pan frames, no
  hover/zoom/export checks, one browser session each).

### Summary table

| Criterion                                                            | uPlot                                                                                                                                               | Apache ECharts                                                                                                                                                                 | Plotly.js                                                                                    | Recharts                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Version, licence                                                     | 1.6.32, MIT                                                                                                                                         | 6.1.0, Apache-2.0                                                                                                                                                              | 4.3.0, MIT                                                                                   | 3.11.0, MIT                                                           |
| Bundle, minimal build, minified / **gzip** / brotli (kB)             | 70 / **24.2** / 21.6 (+0.7 gzip CSS)                                                                                                                | 646 / **184.7** / 153 (line+grid+canvas); 778 / **221.9** / 183 as prototyped; full import 1484 / 420 / 330                                                                    | basic 1634 / **419**; cartesian 2038 / **524**; gl2d (needed for `scattergl`) 2020 / **518** | 576 / **140** / 113 (without React)                                   |
| Initial render 51k x 13 (median ms)                                  | **30** (min/max decimated), 66 to 89 (raw points)                                                                                                   | 123 to 143 (lttb), 126 to 131 (minmax), 139 (no sampling)                                                                                                                      | 890 (scattergl), 410 (SVG)                                                                   | **5,810** (5.2 to 7.1 s); 207 with data pre-decimated to 2,000 points |
| Pan, window 10 % (fps mean; p95 frame ms)                            | **60** (17 ms) in the committed runs; 33 to 60 over all runs, see notes                                                                             | 49 / 30 / 49 over 3 runs (lttb), 49 to 50 (minmax); p95 33 to 67 ms                                                                                                            | 44 (scattergl), 1.2 (SVG)                                                                    | did not finish within the 120 s budget; 3.1 with 2,000 points         |
| Pan, window 95 % (fps mean; p95 frame ms)                            | **60** (17 ms) in the committed runs; 33 to 60 over all runs, see notes                                                                             | 29 / 11 / 29 over 3 runs (lttb), 33 to 36 (minmax); p95 34 to 144 ms                                                                                                           | 49 (scattergl), 2.1 (SVG)                                                                    | did not finish; 7.0 with 2,000 points                                 |
| Cost of one all-panel update, 10 % / 95 % window (mean ms)           | 5 / 6 (decimated); 7 to 18 / 46 to 74 (raw points)                                                                                                  | 18 to 19 / 26 to 33 (lttb, minmax), 77 in the slow lttb run; no sampling 23 / 105                                                                                              | 11 / 6 (scattergl; GPU work is async so this under-reports), 774 / 277 (SVG)                 | 141 / 158 even with 2,000 points                                      |
| Hover with cursor sync / tooltip (fps; not like-for-like, see notes) | 60                                                                                                                                                  | 47 to 58 (lttb), 38 to 58 (minmax), 7 without sampling                                                                                                                         | not measured                                                                                 | not measured                                                          |
| JS heap after the run (MB; not like-for-like, see notes)             | 11 to 13                                                                                                                                            | 62 to 114                                                                                                                                                                      | 64 (scattergl), 363 (SVG)                                                                    | 126 with 2,000 points                                                 |
| Multiple Y axes by unit                                              | Native: one `scale` per unit, axes on `side` 1 or 3, extra axes stack outwards; axis colour is a function (3 axes in panel 1 worked first try)      | Native: `yAxis[]` with `position` and `offset`; each axis styled individually (3 axes in panel 1 worked)                                                                       | Works through `overlaying` y axes with manual `position` / domain bookkeeping                | `YAxis` with `yAxisId`, left/right only, offsets by hand              |
| Stacked synced panels (shared window + cursor)                       | N instances; `cursor.sync` shares the cursor; the x window we drive from one app-level store (programmatic `setScale` did not propagate on its own) | One instance, N `grid`s; `dataZoom.xAxisIndex` + `axisPointer.link` sync zoom and cursor declaratively (verified: all panels follow)                                           | Subplots with shared/matched x axes, or N plots plus relayout events                         | `syncId` shares tooltip only; no zoom                                 |
| Zoom / pan API                                                       | `setScale('x', {min,max})`, events via hooks; wheel zoom, drag pan, dblclick reset are **our code** (about 60 lines plugin, worked)                 | `dataZoom` (inside + slider): wheel, drag, pinch, `dispatchAction`, events; all built in                                                                                       | Built in (`relayout`, scroll zoom, drag modes)                                               | None (domain props + `Brush`); we would build it all                  |
| Tooltip with 13+ series, range selection, minimap                    | Live legend works out of the box; floating tooltip, select (`cursor.drag` + `setSelect`), minimap are small plugins / second instance               | `tooltip`, `brush`, slider minimap built in; observed: the default axis tooltip in the multi-grid layout skipped panel 1 (custom formatter needed)                             | Hover labels, box select, range slider built in                                              | `Tooltip` and `Brush` only                                            |
| Downsampling                                                         | None built in. App-side min/max per pixel bucket of the visible window: about 70 lines, 5 to 6 ms per update for 13 series (measured)               | Built in `sampling: 'lttb' \| 'minmax' \| ...` (re-applied to the dataZoom window)                                                                                             | None (scattergl handles 100k+ points on GPU)                                                 | None                                                                  |
| PNG / SVG export                                                     | PNG: compose the panel canvases ourselves (1.1 s for 2528x1380 here; see note). SVG: no support, would need our own writer                          | PNG `getDataURL({pixelRatio: 2})` 159 to 190 ms (one 482 ms outlier), 0.8 MB; SVG via the SVG renderer `renderToSVGString()` 132 to 183 ms (one 362 ms outlier), 177 to 201 kB | `toImage` / `downloadImage` PNG and SVG                                                      | No (serialise the DOM SVG ourselves)                                  |
| Light / dark theming                                                 | Axis/grid colours as functions + `redraw()`: 5 to 18 ms                                                                                             | `setOption` colour patch: 43 to 120 ms; `registerTheme` + re-init also available                                                                                               | `relayout` / templates                                                                       | CSS / props                                                           |
| React 19 fit                                                         | Imperative ref + effect; optional `uplot-react`                                                                                                     | Imperative ref + effect; optional `echarts-for-react`                                                                                                                          | Imperative; optional `react-plotly.js` (peer ^18 or ^19)                                     | Native components, peer range includes 19                             |

Notes on the table:

- The uPlot export prototype scales canvases that were drawn at device pixel ratio 1 up to 2x, so it is **not** a true 2x render.
  A real 2x export means re-creating the plots offscreen with `pxRatio: 2` (about 4x the initial render cost, still well under
  a second) and adding the title/legend with canvas text. ECharts re-renders at `pixelRatio: 2` natively.
- ECharts run-to-run variance was large on this laptop (one of three lttb runs: 30 fps zoomed, 11 fps at 95 %, the other two 49
  and 29 fps). uPlot with decimation was 60 fps in the two committed runs, which were taken on a quiet machine. It is not
  variance-free: in QA's independent runs on a loaded machine (same code) uPlot with decimation measured between 33 and 60 fps
  (for example 42 fps zoomed and 33 fps at the full window in one run). The observed uPlot range is therefore **33 to 60 fps
  across all runs, always at or above the 30 fps target of #28**, while ECharts (lttb or minmax) ranged from 11 to 50 fps and
  fell below 30 fps at the zoomed-out window in several runs (also in QA's runs). Treat the ECharts full-window figure (about 30
  fps) as borderline against #28, not as a failure or a pass.
- A fourth uPlot decimated run (`decimate.run1`) is **not committed**: it was taken before the benchmark script numbered its
  result files and was overwritten by the next run of the same variant (it showed 31 ms initial render and 60 / 59 fps at the
  10 % / 95 % windows, in line with runs 2 and 3, but there is no JSON for it, so it is not part of the evidence). The raw
  variant has runs 1 and 2, ECharts lttb runs 1 to 3.
- **Like-for-like caveat for the heap, hover and update numbers.** The two prototypes do not do identical work. The ECharts
  prototype carries a slider minimap (`dataZoom`) and `axisPointer` plus tooltip in every measured path, and builds its dataset
  from plain JS arrays (`Array.from`), while the uPlot prototype has no minimap or floating tooltip (only the live legend) and
  reads shared `Float64Array`s. Part of the heap, hover and update gap is therefore data representation and extra features, not
  library cost alone, and uPlot will gain cost when the tooltip and minimap plugins budgeted in this ADR are added. The direction
  of the result (a large performance gap, a thin ECharts margin against #28) is consistent across paired runs, but do not read
  the absolute ratios as precise.
- "uPlot raw" hands all 51k points to uPlot. uPlot still collapses points per pixel column while drawing, but it still walks every
  point: full-window redraws cost 46 to 74 ms (4 to 5 fps), so the zoomed-out view needs the app-side decimation either way.
- Plotly.js `scattergl` and Recharts were not prototyped with zoom/tooltip/export; their rows come from the smoke benchmark and
  documentation, not from a full prototype.

### Raw numbers (uPlot, decimated; two committed runs, `bench-result-decimate.run{2,3}.json`)

| Metric                                    | Run 2        | Run 3        |
| ----------------------------------------- | ------------ | ------------ |
| Time to chart ready after navigation (ms) | 376          | 362          |
| Initial render median (ms)                | 30           | 30.8         |
| Pan 10 %: fps / p95 frame ms              | 59.99 / 17.1 | 59.99 / 16.9 |
| Pan 95 %: fps / p95 frame ms              | 59.99 / 16.9 | 60.01 / 16.9 |
| Update cost 10 % / 95 % (ms)              | 5.07 / 6.34  | 4.69 / 6.03  |
| Hover fps                                 | 60.6         | 60.3         |
| JS heap (MB)                              | 12.9         | 12.9         |

### Raw numbers (uPlot, raw points; `bench-result-raw.run{1,2}.json`)

| Metric                       | Run 1        | Run 2        |
| ---------------------------- | ------------ | ------------ |
| Initial render median (ms)   | 65.8         | 88.5         |
| Pan 10 %: fps / p95 frame ms | 31.1 / 66.6  | 33.7 / 50    |
| Pan 95 %: fps / p95 frame ms | 4.83 / 333.3 | 4.04 / 333.6 |
| Update cost 10 % / 95 % (ms) | 6.6 / 45.6   | 17.9 / 73.7  |

### Raw numbers (ECharts; `spikes/charting-echarts/bench-result-<variant>.run<N>.json`)

| Variant, run  | Initial (ms) | Pan 10 % fps | Pan 95 % fps | Update 10 % / 95 % (ms) | Hover fps | Heap (MB) | Theme switch (ms) |
| ------------- | ------------ | ------------ | ------------ | ----------------------- | --------- | --------- | ----------------- |
| lttb, run 1   | 134.7        | 48.6         | 29.3         | 18.2 / 32.6             | 57.8      | 62        | 68                |
| lttb, run 2   | 142.8        | 29.6         | 11.3         | 18.8 / 76.7             | 46.9      | 114       | 43                |
| lttb, run 3   | 122.7        | 49.5         | 29.0         | 18.3 / 32.6             | 58.3      | 71        | 47                |
| minmax, run 1 | 131.1        | 50.2         | 35.7         | 18.2 / 26.0             | 37.8      | 107       | 121               |
| minmax, run 2 | 126.0        | 48.8         | 33.5         | 20.2 / 29.5             | 57.6      | 98        | 78                |
| nosampling    | 139.1        | 24.2         | 5.5          | 23.0 / 105.1            | 7.3       | 105       | 92                |

### Raw numbers (Plotly.js and Recharts smoke benchmark; `spikes/charting-baseline/results/perf-baseline.json`)

| Configuration                     | Initial render (ms; 3 runs) | Pan 10 % / 95 % fps | Update 10 % / 95 % (ms) | Heap (MB) |
| --------------------------------- | --------------------------- | ------------------- | ----------------------- | --------- |
| Plotly.js scattergl (gl2d bundle) | 890, 799, 901               | 44.4 / 48.6         | 11.1 / 5.9              | 64        |
| Plotly.js SVG scatter             | 387, 410, 442               | 1.18 / 2.07         | 774 / 277               | 363       |
| Recharts, 51k points              | 7,091, 5,810, 5,193         | timeout (> 120 s)   | n/a                     | n/a       |
| Recharts, pre-decimated to 2,000  | 224, 207, 205               | 3.1 / 7.0           | 141 / 158               | 126       |

### Bundle sizes

Measured, not quoted: a Vite 8 library build per candidate (minified, React and React DOM external) of the smallest import that
draws a line chart, then gzip level 9 and brotli of the output (`spikes/charting-baseline/measure-bundles.mjs`,
`results/bundle-sizes.json`). ECharts is shown tree-shaken (`echarts/core` plus only the chart/component/renderer modules used)
and as a full import.

## Decision

**Chosen library:** uPlot 1.6.32, wrapped behind a thin in-app chart-engine boundary.

Why:

1. **Performance headroom is the guardrail and uPlot is the only candidate that clears it with margin.** With the app-side
   min/max decimation of the visible window that #28 already asks for, uPlot held 60 fps (the `rAF` cap) while panning the full
   51k x 13 log in both committed runs and 33 to 60 fps across all runs including QA's loaded-machine runs (always at or above
   the 30 fps of #28), renders the first frame in about 30 ms and uses about 12 MB of heap. ECharts is in the same ballpark only
   after its own sampling and still measured 11 to 36 fps at the zoomed-out window with visible run-to-run variance, at a clearly
   higher heap (62 to 114 MB; partly data representation and extra minimap/tooltip work, see the like-for-like caveat under the
   table, so not a precise multiplier). Plotly.js needs the WebGL bundle (518 kB gzip) to be usable; Recharts cannot render the data.
2. **Size.** 24 kB gzip against 185 to 222 kB for ECharts and about 520 kB for Plotly.js, for a static client-side app.
3. **It already does the hard structural things we need**: one scale and axis per unit with sides and outward stacking, per-series
   `stepped` paths (#29), auto-ranging on the visible window (fit visible, #38) or a fixed `range` (#37), live legend values,
   drag-select hooks (#46), and cursor sync across panels (#44).
4. **The work uPlot leaves to us is bounded and was partly de-risked in the spike**: wheel zoom, drag pan, dblclick reset and
   cross-panel window sync (about 60 lines, worked, all three panels followed), min/max decimation (about 70 lines, measured),
   a floating tooltip, touch and keyboard gestures, minimap, and a PNG/SVG exporter. The decimation layer is needed in every
   option for #28 anyway, and the single x-window store that drives all panels is exactly the "single source of truth" that #41
   asks for.

ECharts remains the credible alternative: it provides most of the interaction and export features out of the box and wins on
engineering effort. It lost on the epic's primary requirement (performance margin and memory) and on size, not on features.

## Consequences

- Charts are canvas 2D. Accessibility (#53) cannot come from the DOM of the chart: provide the keyboard shortcuts from #43,
  a data-table / summary alternative and sufficient contrast, and test them in Playwright.
- We own the interaction layer. Budget for it inside #43 to #47 and keep it in one place (`src/features/charts/`), not scattered
  across components.
- Architecture rules that keep the choice cheap to reverse:
  - A library-independent data model in `src/lib/`: columnar `Float64Array`s per channel plus one shared time array, and a pure
    `downsample(window, pixels)` (min/max per pixel bucket, shared x as in the spike) with unit tests.
  - One app-level store owns the x window (start/end), per-axis ranges, the cursor time and the selection. Every panel is a
    function of that store; uPlot is only the renderer. Cross-panel sync is a consequence, not something to hand-wire per gesture.
  - A narrow `ChartPanel` component (props: series, axes, window, theme, callbacks) is the only place that imports `uplot`.
    The fallback below only has to reimplement that component.
- Add `uplot` as a runtime dependency only in the first chart story (#25), not in this spike. Pin the exact version.
- SVG export (#50) is a custom writer over the same scales and decimated data (the app already holds both). Treat "SVG when
  the library supports it" in #50 as "SVG via our exporter", and verify true 2x PNG by re-rendering offscreen with `pxRatio: 2`.
- uPlot is stable but slow-moving (last release 1.6.32, March 2025; a single primary maintainer). We pin it and accept
  that fixes may have to be patched locally.

## How this unblocks the charts, scale and interaction stories

- **#24 Dynamic chart rendering, #25 Render selected parameters**: one uPlot per panel, data as aligned `Float64Array`s, series
  added/removed with `setSeries`/`addSeries`/`delSeries` (no remount);
  mm:ss axis labels via the axis `values` function (done in the spike).
- **#26 Multiple chart panels**: a panel is a `ChartPanel` instance; heights from a layout store; a shared sync key plus the
  window store keep them aligned (3 stacked panels worked in the spike).
- **#27 Multiple Y axes by unit**: one `scale` per unit, `side` 3 for the first, 1 for the others, axis stroke = series colour when a
  single series uses the unit (implemented in the spike, three axes in one panel).
- **#28 Downsampling**: min/max per pixel bucket of the visible window, re-run on every window change (spike: 5 to 6 ms for 13
  series, 33 to 60 fps measured on 51k rows across all runs). Keep the pure function in `src/lib/` and measure it in the perf test.
- **#29 Step vs linear**: `uPlot.paths.stepped({align: 1})` vs the default linear paths, per series (misfire counters used steps
  in the spike).
- **#36 to #41 Axis and scale control**: `scales[unit].range` for manual min/max (#37) and padding (#38, auto-range on the visible
  window is the default behaviour); normalised overlay (#39) is a data transform with a separate tooltip formatter; moving series
  between axes/panels (#40) is a rebuild of the options builder output; time-window inputs (#41) write the window store.
- **#42, #43 Zoom and pan**: plugin with wheel zoom centred on the cursor, drag pan, dblclick reset (prototyped); pinch and keyboard
  are additions to the same plugin. Y-axis drag (#37) is an additional plugin.
- **#44 Synchronised zoom and cursor**: `cursor.sync` for the cursor plus the window store for the x window (do not rely on
  `sync.scales` for programmatic changes, it did not propagate in the spike).
- **#45 Hover tooltip**: the live legend works immediately; a floating/docked tooltip is a `setCursor` plugin using the nearest
  index (snap to sample).
- **#46 Range selection with statistics**: `cursor.drag` + `hooks.setSelect` provide the rectangle; statistics are computed on the
  columnar arrays.
- **#47 Minimap**: a second small uPlot with a brush plugin driving the window store; the ticket already marks it nice-to-have.
- **#50 Export**: PNG by compositing offscreen `pxRatio: 2` renders with title/legend text; SVG by our own writer (see
  Consequences).
- **#55 Light/dark theme**: axis, grid and series colours are functions evaluated at draw time; switching is `redraw()` (5 to 18 ms
  measured for 3 panels).

## Risks and fallback

| Risk                                                                                                                                               | Likelihood | Mitigation / trigger                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The custom interaction layer (touch, keyboard, minimap, tooltip) costs more than planned                                                           | Medium     | Build it incrementally behind the window store; the spike prototype of wheel/pan/sync is the starting point. Re-estimate after #43.                                                                                                    |
| uPlot maintenance stalls (slow release cadence, one maintainer)                                                                                    | Medium     | Pin the version; the code is MIT and small enough to vendor or patch; the `ChartPanel` boundary limits the blast radius.                                                                                                               |
| No SVG export                                                                                                                                      | Certain    | Own SVG writer over scales + decimated data; accept SVG as a later increment of #50 if time boxed (PNG is required, SVG is "when supported").                                                                                          |
| Real-device performance differs from this headless software-raster run                                                                             | Low        | The numbers are a pessimistic lower bound (no GPU); re-measure in the #28 perf test on the real app, in headed Chromium.                                                                                                               |
| Touch / pinch gestures (#43) and keyboard zoom are not prototyped (the spike only exercised mouse wheel, drag, dblclick, sync and the live legend) | Medium     | Budget them in #43 as new plugin code on top of the wheel/pan plugin; verify on a real touch device or emulated touch in Playwright before closing #43. If pinch proves costly, that counts toward the ECharts fallback trigger below. |
| Multi-instance sync drifts or double-redraws                                                                                                       | Low        | One store, one `applyWindow` entry point (as in the spike); never let a panel set another panel's scale.                                                                                                                               |

**Fallback: Apache ECharts 6.x** (tree-shaken, about 222 kB gzip as prototyped). Switch if, after the first chart stories, the
custom interaction/export work is clearly dominating the schedule, or uPlot cannot be made to satisfy a requirement. The spike
shows ECharts already provides the multi-grid layout, synced dataZoom/cursor, tooltip, brush and PNG/SVG export, so the
`ChartPanel` boundary and the library-independent data/window store make it a contained rewrite. Use `sampling: 'minmax'` (best
zoomed-out frame rate in the spike), prefer `filterMode: 'filter'`, and plan for a custom tooltip formatter in the multi-grid
layout. Plotly.js (bundle, SVG scaling) and Recharts (no zoom/pan, cannot render 51k x 13) are not considered fallbacks.

## References

- Spikes and raw results: `spikes/charting-uplot/`, `spikes/charting-echarts/`, `spikes/charting-baseline/`, `spikes/README.md`.
- Ticket #4, epic #1, stories #24 to #29, #36 to #47, #50, #55.
