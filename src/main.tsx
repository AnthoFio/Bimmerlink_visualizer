import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startParseWorker } from './features/upload/loadLog.ts'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

// Fetched now, with the page: opening a log later needs no network.
startParseWorker()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
