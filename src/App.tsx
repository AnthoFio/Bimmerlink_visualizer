import { useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { LoadStatus } from './features/upload/LoadStatus.tsx'
import { loadLogInWorker } from './features/upload/loadLog.ts'
import type { LoadLog } from './features/upload/loadLog.ts'
import { ReplaceConfirm } from './features/upload/ReplaceConfirm.tsx'
import { UploadPanel } from './features/upload/UploadPanel.tsx'
import { useLogLoader } from './features/upload/useLogLoader.ts'
import { fileSelectionProblem } from './lib/fileType.ts'
import { Workspace } from './Workspace.tsx'

interface Props {
  /** Replaced in tests, as jsdom has no Worker. */
  loadLog?: LoadLog
}

export default function App({ loadLog = loadLogInWorker }: Props) {
  const { log, error, pending, open, cancel } = useLogLoader(loadLog)
  const [unsaved, setUnsaved] = useState(false)
  const [waiting, setWaiting] = useState<File>()
  const [rejected, setRejected] = useState<string>()

  const replace = (files: File[]) => {
    const problem = fileSelectionProblem(files)
    setRejected(problem)
    const file = files[0]
    if (problem || !file) return
    if (unsaved) setWaiting(file)
    else void open(file)
  }

  const problem = rejected ?? error
  const status = (
    <>
      {waiting && (
        <ReplaceConfirm
          fileName={waiting.name}
          onKeep={() => setWaiting(undefined)}
          onReplace={() => {
            setWaiting(undefined)
            void open(waiting)
          }}
        />
      )}
      {/* Mounted before a load starts, so that screen readers announce its text. */}
      <div role="status" aria-label="Loading">
        {pending && <LoadStatus {...pending} onCancel={cancel} />}
      </div>
      {problem && (
        <p role="alert" className="message message-error">
          {problem}
        </p>
      )}
    </>
  )

  const upload = (
    <main className="app">
      <UploadPanel onFile={open}>{status}</UploadPanel>
    </main>
  )
  if (!log) return upload

  return (
    <ErrorBoundary
      resetKey={log}
      // A log that cannot be displayed must still leave a way to open another one.
      fallback={upload}
    >
      <Workspace key={log.id} log={log} onFiles={replace} onUnsavedChange={setUnsaved}>
        {status}
      </Workspace>
    </ErrorBoundary>
  )
}
