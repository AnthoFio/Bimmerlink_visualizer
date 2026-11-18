# Spikes

Throwaway, time-boxed experiments that back an architecture decision. Each folder is an **isolated mini-project with its own
`package.json`** and its own `node_modules`. They are deliberately excluded from the app's `npm run check` / `npm run build`
(ESLint, Prettier, `tsc -b` and Vitest do not look here) and the app's `package.json` never depends on them.

## `charting-*` (ADR 0001, ticket #4)

Evidence for [`docs/adr/0001-charting-library.md`](../docs/adr/0001-charting-library.md). The log used is the real
`Example/2026-10-25_09-33-22.csv` (51,019 rows). It has 11 channels; two derived channels are added so the prototypes
render the 13 series of the performance target. `src/log.ts` in each spike is a trivial throwaway parser, **not** the real parser.

| Folder                | What it is                                                                                    | Ports |
| --------------------- | --------------------------------------------------------------------------------------------- | ----- |
| `charting-uplot/`     | React 19 + uPlot prototype (3 stacked, synced panels, 3 Y axes by unit, zoom/pan, export)     | 5301  |
| `charting-echarts/`   | React 19 + Apache ECharts prototype (one instance, 3 grids, dataZoom, tooltip, PNG/SVG export) | 5302  |
| `charting-baseline/`  | Bundle-size measurement of all four candidates + smoke render benchmark for Plotly and Recharts | 5303  |
| `scripts/`            | Shared throwaway helpers (copy the example log, Playwright bench harness)                      |       |

### Reproduce

```sh
cd spikes/charting-uplot        # or charting-echarts / charting-baseline
npm install
npm run build                   # copies Example/2026-10-25_09-33-22.csv into public/ (git-ignored) and builds
npm run bench                   # headless Chromium via playwright-core; writes bench-result*.json
npm run sizes                   # charting-baseline only: minimal-build gzip/brotli sizes -> results/bundle-sizes.json
```

The bench scripts look for the Playwright Chromium in `%LOCALAPPDATA%\ms-playwright` (revision 1217); set
`CHROMIUM_PATH` to use another executable. `VARIANT=raw|decimate` (uPlot) and `VARIANT=lttb|minmax|nosampling` (ECharts)
select the downsampling strategy. Raw results that back the ADR table are committed next to each spike
(`bench-result-*.json`, `results/*.json`).
