/** `1 cell`, `1,204 cells`. */
export function plural(count: number, one: string, many: string): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`
}

export function formatCount(count: number): string {
  return count.toLocaleString('en-US')
}
