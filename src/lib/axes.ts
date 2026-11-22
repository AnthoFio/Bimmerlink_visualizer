// Which Y axis each series of a panel uses.
//
// "Max 2 visible per side, extra axes stacked" (S27): the first four axes are drawn, stacked
// outwards two per side. Further axes keep a scale of their own and are stacked as a list
// with their range under the chart, where they cost no plot width.
import { unitLabel } from './units.ts'

export const VISIBLE_AXES = 4

export interface AxisMember {
  id: string
  name: string
  unit: string | undefined
  colour: string
}

export interface Axis {
  /** Stable while the panel keeps the unit; manual ranges hang on it. */
  key: string
  title: string
  side: 'left' | 'right'
  visible: boolean
  /** The colour of the series, when only one uses the axis. */
  colour: string | undefined
  /** Series ids. */
  members: string[]
}

export function layoutAxes(series: readonly AxisMember[]): Axis[] {
  const groups = new Map<string, AxisMember[]>()
  for (const member of series) {
    const key = member.unit === undefined ? `series:${member.id}` : `unit:${member.unit}`
    groups.set(key, [...(groups.get(key) ?? []), member])
  }
  return [...groups].map(([key, members], index) => {
    const { unit, name } = members[0]!
    return {
      key,
      title: unit === undefined ? `${name} (${unitLabel(unit)})` : unitLabel(unit),
      side: index % 2 ? 'right' : 'left',
      visible: index < VISIBLE_AXES,
      colour: members.length === 1 ? members[0]!.colour : undefined,
      members: members.map((member) => member.id),
    }
  })
}

export interface Gutters {
  left: number
  right: number
}

/** The most axes any panel shows per side, so that every plot area has the same left and right. */
export function axisGutters(panels: readonly (readonly Axis[])[]): Gutters {
  const most = (side: Axis['side']) =>
    panels.reduce(
      (max, axes) =>
        Math.max(max, axes.filter((axis) => axis.visible && axis.side === side).length),
      0,
    )
  return { left: most('left'), right: most('right') }
}
