/** How a unit is shown. The catalog writes `-` for a quantity without a unit. */
export function unitLabel(unit: string | undefined): string {
  if (unit === undefined) return 'unit unknown'
  return unit === '-' ? 'no unit' : unit
}
