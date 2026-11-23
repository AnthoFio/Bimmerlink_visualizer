import type { Channel } from './channels.ts'
import type { LineStyle } from './view.ts'

const GEAR_KEY = /(^|_)gear(_|$)/

/** Whether a channel is drawn as sample-and-hold steps. */
export function isStepped(channel: Channel, style: LineStyle): boolean {
  if (style !== 'auto') return style === 'step'
  return channel.role === 'flag' || channel.role === 'counter' || GEAR_KEY.test(channel.key ?? '')
}

/** Dash patterns for when colour must not be the only difference between series. */
export const DASHES: readonly (readonly number[])[] = [
  [],
  [8, 4],
  [2, 3],
  [10, 3, 2, 3],
  [4, 4],
  [14, 4],
  [2, 6],
  [10, 3, 2, 3, 2, 3],
]

export function dashOf(index: number, patterns: boolean): readonly number[] {
  return patterns ? DASHES[index % DASHES.length]! : DASHES[0]!
}
