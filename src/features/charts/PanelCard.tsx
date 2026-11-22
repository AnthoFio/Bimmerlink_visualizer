import { useMemo, useState } from 'react'
import type { Channel } from '../../lib/channels.ts'
import { PARAMETER_DRAG_TYPE } from '../../lib/dragParameter.ts'
import type { Theme } from '../../lib/palette.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { assignPanel, movePanel, panelOf, removePanel, updatePanel } from '../../lib/view.ts'
import type { Panel, View } from '../../lib/view.ts'
import { PanelToolbar } from './PanelToolbar.tsx'
import { TimeSeriesChart } from './TimeSeriesChart.tsx'

interface Props {
  panel: Panel
  index: number
  dataset: LogDataset
  channels: readonly Channel[]
  view: View
  onChange: (update: (view: View) => View) => void
  colours: ReadonlyMap<string, string>
  theme: Theme
}

export function PanelCard(props: Props) {
  const { panel, index, dataset, channels, view, onChange, colours, theme } = props
  const [dropping, setDropping] = useState(false)
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
        onUpdate={(change) => onChange((current) => updatePanel(current, panel.id, change))}
        onMove={(by) => onChange((current) => movePanel(current, panel.id, by))}
        onRemove={() => onChange((current) => removePanel(current, panel.id))}
      />
      <TimeSeriesChart
        dataset={dataset}
        channels={channels}
        selected={selected}
        colours={colours}
        theme={theme}
        height={panel.height}
      />
    </section>
  )
}
