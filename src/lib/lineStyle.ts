import type { Channel } from './channels.ts'
import type { LineStyle } from './view.ts'

const GEAR_KEY = /(^|_)gear(_|$)/

/** Whether a channel is drawn as sample-and-hold steps. */
export function isStepped(channel: Channel, style: LineStyle): boolean {
  if (style !== 'auto') return style === 'step'
  return channel.role === 'flag' || channel.role === 'counter' || GEAR_KEY.test(channel.key ?? '')
}
