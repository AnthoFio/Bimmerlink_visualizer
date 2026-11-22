import { useState } from 'react'
import { UploadPanel } from './features/upload/UploadPanel.tsx'

export default function App() {
  const [file, setFile] = useState<File>()

  return (
    <main className="app">
      <UploadPanel onFile={setFile}>
        {file && <p role="status">Selected {file.name}</p>}
      </UploadPanel>
    </main>
  )
}
