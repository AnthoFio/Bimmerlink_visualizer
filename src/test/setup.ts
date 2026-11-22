import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Vitest globals are off, so Testing Library cannot register its own auto-cleanup.
afterEach(() => {
  cleanup()
})

// jsdom has no canvas (uPlot needs one) and no ResizeObserver.
vi.mock('uplot', async () => ({ default: (await import('./fakeUplot.ts')).FakeUplot }))

class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoResizeObserver as unknown as typeof ResizeObserver
