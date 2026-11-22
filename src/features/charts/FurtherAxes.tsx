import type { Axis } from '../../lib/axes.ts'
import { formatValue } from '../../lib/format.ts'
import type { Range } from '../../lib/yRange.ts'

interface Props {
  axes: readonly Axis[]
  ranges: readonly Range[]
}

/** The axes that do not fit beside the plot, stacked under it. */
export function FurtherAxes({ axes, ranges }: Props) {
  if (axes.every((axis) => axis.visible)) return null
  return (
    <ul className="further-axes" aria-label="Further axes">
      {axes.map((axis, i) =>
        axis.visible ? null : (
          <li key={axis.key} style={{ borderLeftColor: axis.colour }}>
            {axis.title}: {formatValue(ranges[i]![0])} to {formatValue(ranges[i]![1])}
          </li>
        ),
      )}
    </ul>
  )
}
