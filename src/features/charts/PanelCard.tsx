import { useCallback, useMemo, useState } from 'react'
import type { Gutters } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import { PARAMETER_DRAG_TYPE } from '../../lib/dragParameter.ts'
import type { Theme } from '../../lib/palette.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import {
  assignPanel,
  axisRangeOf,
  movePanel,
  panelOf,
  removePanel,
  setAxisRange,
  updatePanel,
} from '../../lib/view.ts'
import type { Range } from '../../lib/yRange.ts'
import type { Panel, View } from '../../lib/view.ts'
import { setWindowOf } from '../../lib/viewport.ts'
import type { ViewportStore } from '../../lib/viewport.ts'
import { PanelToolbar } from './PanelToolbar.tsx'
import { TimeSeriesChart } from './TimeSeriesChart.tsx'

interface Props {
  panel: Panel
  index: number
  viewport: ViewportStore
  gutters: Gutters
  dataset: LogDataset
  channels: readonly Channel[]
  view: View
  onChange: (update: (view: View) => View) => void
  colours: ReadonlyMap<string, string>
  theme: Theme
}

export function PanelCard(props: Props) {
  const { panel, index, gutters, viewport, dataset, channels, view, onChange, colours, theme } =
    props
  const [dropping, setDropping] = useState(false)
  const rangeOf = useCallback((key: string) => axisRangeOf(view, panel.id, key), [view, panel.id])
  const setRange = useCallback(
    (key: string, range: Range | null) =>
      onChange((current) => setAxisRange(current, panel.id, key, range)),
    [onChange, panel.id],
  )
  const selected = useMemo(
    () => new Set(view.selected.filter((id) => panelOf(view, id) === panel.id)),
    [view, panel.id],
  )

  return (
    <section
      aria-label={`Panel ${index + 1}`}
      className={dropping ? 'panel is-dropping' : 'panel'}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(PARAMETER_DRAG_TYPE)) return
        event.preventDefault()
        setDropping(true)
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(event) => {
        setDropping(false)
        const id = event.dataTransfer.getData(PARAMETER_DRAG_TYPE)
        if (!id) return
        event.preventDefault()
        onChange((current) => assignPanel(current, id, panel.id))
      }}
    >
      <PanelToolbar
        panel={panel}
        number={index + 1}
        count={view.panels.length}
        onUpdate={(change) => {
          // A panel that leaves the others keeps the window it shows.
          if (change.synced === false) {
            setWindowOf(viewport, { id: panel.id, synced: false }, viewport.get().window)
          }
          onChange((current) => updatePanel(current, panel.id, change))
        }}
        onMove={(by) => onChange((current) => movePanel(current, panel.id, by))}
        onRemove={() => onChange((current) => removePanel(current, panel.id))}
      />
      <TimeSeriesChart
        dataset={dataset}
        channels={channels}
        selected={selected}
        colours={colours}
        theme={theme}
        panel={panel}
        gutters={gutters}
        number={index + 1}
        rangeOf={rangeOf}
        onRange={setRange}
        viewport={viewport}
      />
    </section>
  )
}
