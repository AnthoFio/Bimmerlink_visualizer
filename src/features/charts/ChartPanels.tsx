import { useMemo } from 'react'
import { axisGutters } from '../../lib/axes.ts'
import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import { panelContent } from '../../lib/panelContent.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { addPanel, panelOf } from '../../lib/view.ts'
import type { View } from '../../lib/view.ts'
import type { ViewportStore } from '../../lib/viewport.ts'
import { PanelCard } from './PanelCard.tsx'

interface Props {
  dataset: LogDataset
  channels: readonly Channel[]
  view: View
  viewport: ViewportStore
  onChange: (update: (view: View) => View) => void
  colours: ReadonlyMap<string, string>
  theme: Theme
}

export function ChartPanels(props: Props) {
  const { channels, colours, view, onChange } = props
  const { left, right } = useMemo(
    () =>
      axisGutters(
        view.panels.map((panel) => {
          const ids = new Set(view.selected.filter((id) => panelOf(view, id) === panel.id))
          return panelContent(channels, ids, colours, panel.normalise !== 'off').axes
        }),
      ),
    [channels, colours, view],
  )
  const gutters = useMemo(() => ({ left, right }), [left, right])

  return (
    <>
      {view.panels.map((panel, index) => (
        <PanelCard key={panel.id} panel={panel} index={index} gutters={gutters} {...props} />
      ))}
      <button type="button" onClick={() => onChange(addPanel)}>
        Add panel
      </button>
    </>
  )
}
