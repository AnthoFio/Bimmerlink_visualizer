# Test fixtures

Small, committed inputs for parser and UI tests. Everything here is **byte-exact**: `.gitattributes`
marks `tests/fixtures/**` as `-text` (no line-ending conversion, no diff/merge), and Prettier and
ESLint ignore the folder. Do not open, format or "fix" these files in an editor that rewrites line
endings or strips a BOM. `src/test/fixtures.test.ts` asserts every property documented below
(including the raw bytes), so an accidental change fails `npm run check`.

Load them from tests with the helpers in `src/test/fixtures.ts`
(`loadFixtureBytes(name)`, `loadFixtureText(name)`, `loadExampleBytes(name)`).

## Real-format facts the fixtures preserve

- First column `Time` (seconds, 3 decimals), then quoted parameter labels; plain LF line endings, no BOM.
- Label casing differs between logs (`Engine speed` vs `Engine Speed`).
- Most channels start at `0` and ramp up as their first sample arrives, then sample-and-hold. A few start non-zero in row 0: the lambda adaptation factor `1.03` in `trimmed_2026-09-06_10-09-49.csv` and `Target Rail Pressure` `90.50` in `trimmed_2026-10-24_12-29-08.csv`.

## Trimmed logs (one per distinct example log)

Each file is the **header plus the first 150 data rows** of the matching `Example/` log, cut on a line
boundary and otherwise byte-for-byte identical (a prefix of the full file). The slice therefore contains
the staggered ramp-up region at the start of the recording.

| Fixture                              | Source log (`Example/`)   | Parameter columns |
| ------------------------------------ | ------------------------- | ----------------- |
| `trimmed_2026-09-06_09-23-14.csv`    | `2026-09-06_09-23-14.csv` | 12                |
| `trimmed_2026-09-06_10-09-49.csv`    | `2026-09-06_10-09-49.csv` | 12                |
| `trimmed_2026-10-24_12-29-08.csv`    | `2026-10-24_12-29-08.csv` | 9                 |
| `trimmed_2026-10-25_09-33-22.csv`    | `2026-10-25_09-33-22.csv` | 11                |
| `trimmed_2026-11-14_10-12-17.csv`    | `2026-11-14_10-12-17.csv` | 13                |

`Example/2026-10-24_12-29-08 2.csv` is a **byte-identical duplicate** of `Example/2026-10-24_12-29-08.csv`
(same SHA-256 and size), so it has no trimmed fixture of its own. The integrity test pins this.

## Edge cases

| Fixture                | What it is                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `empty.csv`            | 0 bytes.                                                                                                                                                                         |
| `header-only.csv`      | The real 9-parameter header of `2026-10-24_12-29-08.csv` plus its line break, no data rows.                                                                                      |
| `missing-time.csv`     | Header without a `Time` column (`"Engine speed","Oil Temperature"`) and three data rows.                                                                                         |
| `non-numeric-cell.csv` | `Time,"Engine speed","Oil Temperature"`, four data rows; exactly one cell (`Engine speed` on the third row) is the text `abc`.                                                   |
| `duplicate-columns.csv`| Header `Time,"Engine speed","Oil Temperature","Oil Temperature","Engine Speed"`: an exact duplicate (`Oil Temperature` twice) and a case-insensitive duplicate (`Engine speed`/`Engine Speed`). |
| `crlf.csv`             | Header plus 20 rows of `2026-10-24_12-29-08.csv` with **every** line break as `\r\n` (including the last one); no BOM.                                                           |
| `bom.csv`              | Same slice as `crlf.csv` but LF-only, prefixed with the UTF-8 BOM `EF BB BF`.                                                                                                   |

All other fixtures contain no `\r` and no BOM.

## Full logs

The complete logs stay in `Example/` (14k to 51k rows, also byte-exact) for e2e and performance tests;
use `loadExampleBytes(name)` rather than copying them here.
