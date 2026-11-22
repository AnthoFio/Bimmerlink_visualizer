# Ramp-up at the start of a log

BimmerLink samples one channel per row. At the start of a recording the channels therefore arrive one after another, and until a channel has its first sample its cells hold a placeholder `0`. Drawn as data, those zeros are false spikes at the start of the chart.

## What the app does

- A placeholder is the bare text `0`. A sampled zero is written with decimals (`0.00`), so the detection reads the cell text: after parsing, both are the same number.
- For each channel, the leading region ends at its first cell that is neither a placeholder nor blank.
- The first complete row is the row in which the last channel reports. "Trim to first complete row" is on by default, leaves out the rows before it, and shows how many rows and seconds that was.
- Time is not shifted: a trimmed log starts at the time of its first complete row.
- Switching the option off shows every row again, as it is in the file.

## Limits

- A channel still at `0` after two sampling rounds (twice the channel count, plus two rows) is taken to be really zero, so it cannot trim away minutes of data.
- A log whose rows had to be sorted or left out because of a bad time is not trimmed: its row numbers no longer match the text.

## Example

`Example/2026-10-25_09-33-22.csv` has 11 channels, which report in rows 0 to 10. The trim removes 10 rows (0.30 s), and the log then starts at 0.300 s. `src/lib/rampUp.test.ts` pins this, and the same rule for the other example logs.
