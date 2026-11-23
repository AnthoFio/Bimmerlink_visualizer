// User Timing measures for the performance budgets (docs/performance.md); the perf test reads
// them with performance.getEntriesByType('measure'). No DOM: `performance` exists in workers too.

/** From the file being received to the dataset arriving from the worker. */
export const PARSE = 'log-parse'
/** From the dataset arriving to the first chart draw with series. */
export const FIRST_PAINT = 'log-first-chart-paint'

let parsedAt: number | undefined

/** The start of a load; pass it to `logParsed`. */
export const logReceived = (): number => performance.now()

export function logParsed(start: number): void {
  parsedAt = performance.now()
  performance.measure(PARSE, { start, end: parsedAt })
}

/** Call on every chart draw with series: only the first after a parse is measured. */
export function chartDrawn(): void {
  if (parsedAt === undefined) return
  performance.measure(FIRST_PAINT, { start: parsedAt, end: performance.now() })
  parsedAt = undefined
}
