# Matching log columns to the catalog

`src/lib/channels.ts` links each column of a log to an entry of the parameter catalog.

- Matching is by label, never by position: smaller logs reorder the columns.
- An exact label (ignoring case and repeated whitespace) wins. Otherwise case, whitespace and punctuation are ignored, so `Engine speed` matches `Engine Speed`.
- A label that occurs twice in the catalog is given out in catalog order, one entry per copy in the log.
- A column without a match has the category `Other` and no unit, and works as a plain series. The file summary counts these columns.

## Expected split of the example logs

| Log (`Example/`)            | Columns | Matched | Unmatched |
| --------------------------- | ------- | ------- | --------- |
| `2026-09-06_09-23-14.csv`   | 12      | 12      | none      |
| `2026-09-06_10-09-49.csv`   | 12      | 12      | none      |
| `2026-10-24_12-29-08.csv`   | 9       | 9       | none      |
| `2026-10-24_12-29-08 2.csv` | 9       | 9       | none      |
| `2026-10-25_09-33-22.csv`   | 11      | 11      | none      |
| `2026-11-14_10-12-17.csv`   | 13      | 13      | none      |

`src/lib/channels.test.ts` holds the same table and fails when the split changes.
