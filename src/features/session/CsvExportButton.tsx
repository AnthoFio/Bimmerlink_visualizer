import { useState } from 'react'
import { baseName, saveFile } from '../../components/download.ts'
import type { Channel } from '../../lib/channels.ts'
import { exportCsv } from '../../lib/csvExport.ts'
import type { LogDataset } from '../../lib/parseLog.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'

interface Props {
  fileName: string
  dataset: LogDataset
  /** The visible series. */
  channels: readonly Channel[]
  /** Read at the click, so it is the window on screen. */
  window: () => TimeWindow
}

export function CsvExportButton({ fileName, dataset, channels, window }: Props) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const columns = channels.map((channel) => ({
        name: channel.label,
        values: dataset.columns[channel.column]!.values,
      }))
      const parts = await exportCsv(dataset.time, columns, window())
      saveFile(`${baseName(fileName)}.selection.csv`, new Blob(parts, { type: 'text/csv' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" disabled={busy || channels.length === 0} onClick={() => void run()}>
      {busy ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
