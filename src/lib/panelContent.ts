import { layoutAxes } from './axes.ts'
import type { Axis } from './axes.ts'
import type { Channel } from './channels.ts'
import { PERCENT_AXIS } from './normalise.ts'

export interface PanelItem {
  channel: Channel
  colour: string
  /** Index into the axes of the panel. */
  axis: number
}

export interface PanelContent {
  /** The series of the panel, in log order. */
  items: PanelItem[]
  axes: Axis[]
}

export function panelContent(
  channels: readonly Channel[],
  selected: ReadonlySet<string>,
  colours: ReadonlyMap<string, string>,
  normalised = false,
): PanelContent {
  const shown = channels
    .filter((channel) => selected.has(channel.id))
    .map((channel) => ({ channel, colour: colours.get(channel.id) ?? '#808080' }))

  if (normalised && shown.length) {
    const members = shown.map(({ channel }) => channel.id)
    const axis: Axis = {
      ...PERCENT_AXIS,
      side: 'left',
      visible: true,
      colour: undefined,
      members,
    }
    return { items: shown.map((item) => ({ ...item, axis: 0 })), axes: [axis] }
  }

  const axes = layoutAxes(
    shown.map(({ channel: { id, name, unit }, colour }) => ({ id, name, unit, colour })),
  )
  const axisOf = new Map(axes.flatMap((axis, i) => axis.members.map((id) => [id, i] as const)))

  return {
    items: shown.map((item) => ({ ...item, axis: axisOf.get(item.channel.id)! })),
    axes,
  }
}
