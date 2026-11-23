import { readFileSync } from 'node:fs'

/**
 * The biggest example log (51k rows, 11 channels) widened to `channels` columns: the added
 * ones repeat the real ones under the given labels, scaled a little so that the lines differ.
 */
export function widenLog(file: string, channels: number, labels: readonly string[] = []): string {
  const [header, ...rows] = readFileSync(`Example/${file}`, 'utf8').trimEnd().split('\n')
  const names = header!.split(',')
  const real = names.length - 1
  for (let i = real; i < channels; i++) names.push(`"${labels[i - real] ?? `Derived ${i}`}"`)

  const lines = rows.map((row) => {
    const cells = row.split(',')
    for (let i = real; i < channels; i++) {
      cells.push((Number(cells[(i % real) + 1]) * (1 + (i % 7) / 50)).toFixed(2))
    }
    return cells.join(',')
  })
  return `${[names.join(','), ...lines].join('\n')}\n`
}
