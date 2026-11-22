import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { UploadPanel } from './features/upload/UploadPanel.tsx'
import { useLogLoader } from './features/upload/useLogLoader.ts'

export default function App() {
  const { log, error, open } = useLogLoader()

  return (
    <main className="app">
      <UploadPanel onFile={open}>
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
