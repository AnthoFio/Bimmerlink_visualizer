import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { LoadStatus } from './features/upload/LoadStatus.tsx'
import { loadLogInWorker } from './features/upload/loadLog.ts'
import type { LoadLog } from './features/upload/loadLog.ts'
import { UploadPanel } from './features/upload/UploadPanel.tsx'
import { useLogLoader } from './features/upload/useLogLoader.ts'

interface Props {
  /** Replaced in tests, as jsdom has no Worker. */
  loadLog?: LoadLog
}

export default function App({ loadLog = loadLogInWorker }: Props) {
  const { log, error, pending, open, cancel } = useLogLoader(loadLog)

  return (
    <main className="app">
      <UploadPanel onFile={open}>
        {pending && <LoadStatus {...pending} onCancel={cancel} />}
        {error && (
          <p role="alert" className="message message-error">
            {error}
          </p>
        )}
        {log && (
          <ErrorBoundary resetKey={log}>
            <div role="status">
              <p>
                Loaded {log.fileName}: {log.dataset.time.length} rows, {log.dataset.columns.length}{' '}
                channels.
              </p>
              {log.warnings.map((warning) => (
                <p key={warning.code} className="message message-warning">
                  {warning.message}
                </p>
              ))}
            </div>
          </ErrorBoundary>
        )}
      </UploadPanel>
    </main>
  )
}
