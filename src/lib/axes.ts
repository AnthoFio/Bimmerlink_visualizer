// Which Y axis each series of a panel uses.
//
// "Max 2 visible per side, extra axes stacked" (S27): the first four axes are drawn, stacked
// outwards two per side. Further axes keep a scale of their own and are stacked as a list
// with their range under the chart, where they cost no plot width.
import { unitLabel } from './units.ts'

export const VISIBLE_AXES = 4

export const AXIS_CHOICES = ['left', 'right', 'new'] as const
/** The main left or right axis, or an axis of its own; without a choice the unit decides. */
export type AxisChoice = (typeof AXIS_CHOICES)[number]

export interface AxisMember {
  id: string
  name: string
  unit: string | undefined
  colour: string
  choice?: AxisChoice
}

export interface Axis {
  /** Stable while the panel keeps the unit; manual ranges hang on it. */
  key: string
  title: string
  side: 'left' | 'right'
  visible: boolean
  /** The colour of the series, when only one uses the axis. */
  colour: string | undefined
  /** Series ids. Empty for the unused left slot of a panel that only has a right axis. */
  members: string[]
}

function titleOf(members: readonly AxisMember[]): string {
  const titles = members.map(({ unit, name }) =>
    unit === undefined ? `${name} (${unitLabel(unit)})` : unitLabel(unit),
  )
  return [...new Set(titles)].join(' / ')
}

export function layoutAxes(series: readonly AxisMember[]): Axis[] {
  const groups: { key: string; members: AxisMember[] }[] = []
  const byKey = new Map<string, (typeof groups)[number]>()

  for (const member of series) {
    if (member.choice === 'left' || member.choice === 'right') continue
    const ownAxis = member.choice === 'new' || member.unit === undefined
    const key = ownAxis ? `series:${member.id}` : `unit:${member.unit}`
    let group = byKey.get(key)
    if (!group) {
      group = { key, members: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.members.push(member)
  }

  // The slots alternate left and right, so the main axes are the first two.
  for (const [slot, side] of (['left', 'right'] as const).entries()) {
    const joining = series.filter((member) => member.choice === side)
    if (!joining.length) continue
    while (groups.length <= slot) {
      groups.push({ key: groups.length === slot ? side : 'empty', members: [] })
    }
    const group = groups[slot]!
    group.members.push(...joining)
    group.members.sort((a, b) => series.indexOf(a) - series.indexOf(b))
  }

  return groups.map(({ key, members }, index) => ({
    key,
    title: titleOf(members),
    side: index % 2 ? 'right' : 'left',
    visible: index < VISIBLE_AXES && members.length > 0,
    colour: members.length === 1 ? members[0]!.colour : undefined,
    members: members.map((member) => member.id),
  }))
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
