import type { Channel } from '../../lib/channels.ts'
import type { Theme } from '../../lib/palette.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import { addPanel } from '../../lib/view.ts'
import type { View } from '../../lib/view.ts'
import { PanelCard } from './PanelCard.tsx'

interface Props {
  dataset: LogDataset
  channels: readonly Channel[]
  view: View
  onChange: (update: (view: View) => View) => void
  colours: ReadonlyMap<string, string>
  theme: Theme
}

export function ChartPanels(props: Props) {
  const { view, onChange } = props

  return (
    <>
      {view.panels.map((panel, index) => (
        <PanelCard key={panel.id} panel={panel} index={index} {...props} />
      ))}
      <button type="button" onClick={() => onChange(addPanel)}>
        Add panel
      </button>
    </>
  )
}
