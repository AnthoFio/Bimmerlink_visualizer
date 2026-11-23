export const CSV_ACCEPT = '.csv,text/csv'

/** Why these files cannot be opened as a log, or `undefined` when they can. */
export function fileSelectionProblem(
  files: readonly { name: string; type: string }[],
): string | undefined {
  if (files.length > 1) return 'Open one log at a time.'
  const file = files[0]
  if (!file) return 'No file was received. Drop a CSV file saved by BimmerLink.'
  // Windows often reports application/vnd.ms-excel or nothing for a CSV, so the name counts too.
  if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') return undefined
  return `"${file.name}" is not a CSV file. Choose the .csv log saved by BimmerLink.`
}
