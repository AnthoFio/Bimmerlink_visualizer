// A strip over each axis gutter: dragging it zooms that axis, a double click makes it automatic.
import type { Range } from '../../lib/yRange.ts'

/** Dragging this many pixels up halves the span. */
const HALVE_PX = 120

interface AxisTarget {
  range: (slot: number) => Range | undefined
  setRange: (slot: number, range: Range | null) => void
}

export function createAxisStrips(count: number, target: AxisTarget) {
  let endDrag: (() => void) | undefined

  const strips = Array.from({ length: count }, (_, slot) => {
    const strip = document.createElement('div')
    strip.className = 'axis-drag'
    strip.hidden = true
    strip.title = 'Drag to zoom this axis, double-click for auto'

    strip.addEventListener('pointerdown', (event) => {
      if (event.button) return
      const start = target.range(slot)
      if (!start) return
      event.preventDefault()
      endDrag?.()
      const from = event.clientY
      const middle = (start[0] + start[1]) / 2
      const move = (moved: PointerEvent) => {
        const factor = 2 ** ((moved.clientY - from) / HALVE_PX)
        const half = ((start[1] - start[0]) / 2) * factor
        if (half > 0 && Number.isFinite(half)) target.setRange(slot, [middle - half, middle + half])
      }
      const stop = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
        window.removeEventListener('pointercancel', stop)
        endDrag = undefined
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
      window.addEventListener('pointercancel', stop)
      endDrag = stop
    })
    strip.addEventListener('dblclick', () => target.setRange(slot, null))
    return strip
  })

  return {
    strips,
    destroy: () => {
      endDrag?.()
      for (const strip of strips) strip.remove()
    },
  }
}
