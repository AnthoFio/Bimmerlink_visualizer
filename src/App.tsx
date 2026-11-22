import { useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { LoadStatus } from './features/upload/LoadStatus.tsx'
import { loadLogInWorker } from './features/upload/loadLog.ts'
import type { LoadLog } from './features/upload/loadLog.ts'
import { RampUpToggle } from './features/upload/RampUpToggle.tsx'
import { UploadPanel } from './features/upload/UploadPanel.tsx'
import { useLogLoader } from './features/upload/useLogLoader.ts'
import { trimLeadingRows } from './lib/rampUp.ts'

interface Props {
  /** Replaced in tests, as jsdom has no Worker. */
  loadLog?: LoadLog
}

export default function App({ loadLog = loadLogInWorker }: Props) {
  const { log, error, pending, open, cancel } = useLogLoader(loadLog)
  const [trim, setTrim] = useState(true)
  const shown = useMemo(
    () => log && (trim ? trimLeadingRows(log.dataset, log.rampUp.rows) : log.dataset),
    [log, trim],
  )

  return (
    <main className="app">
      <UploadPanel onFile={open}>
        {pending && <LoadStatus {...pending} onCancel={cancel} />}
        {error && (
          <p role="alert" className="message message-error">
            {error}
          </p>
        )}
        {log && shown && (
          <ErrorBoundary resetKey={log}>
            <div role="status">
              <p>
                Loaded {log.fileName}: {shown.time.length} rows, {shown.columns.length} channels.
              </p>
              {log.warnings.map((warning) => (
                <p key={warning.code} className="message message-warning">
                  {warning.message}
                </p>
              ))}
            </div>
            <RampUpToggle
              rows={log.dataset.time.length - shown.time.length}
              seconds={shown.time[0]! - log.dataset.time[0]!}
              checked={trim}
              onChange={setTrim}
            />
          </ErrorBoundary>
        )}
      </UploadPanel>
    </main>
  )
}
