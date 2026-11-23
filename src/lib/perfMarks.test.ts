import { beforeEach, describe, expect, it } from 'vitest'
import { chartDrawn, FIRST_PAINT, logParsed, logReceived, PARSE } from './perfMarks.ts'

const measures = (name: string) => performance.getEntriesByName(name, 'measure')

describe('performance marks', () => {
  beforeEach(() => {
    // Settles a parse that an earlier test left waiting for its paint.
    chartDrawn()
    performance.clearMeasures()
  })

  it('measures the parse from the file being received to the dataset arriving', () => {
    const start = logReceived()
    logParsed(start)

    expect(measures(PARSE)).toHaveLength(1)
    expect(measures(PARSE)[0]!.startTime).toBe(start)
  })

  it('measures the first chart paint once per parsed log, from the dataset arriving', () => {
    chartDrawn()
    expect(measures(FIRST_PAINT)).toHaveLength(0)

    logParsed(logReceived())
    chartDrawn()
    chartDrawn()
    const [parse] = measures(PARSE)
    expect(measures(FIRST_PAINT)).toHaveLength(1)
    expect(measures(FIRST_PAINT)[0]!.startTime).toBeCloseTo(parse!.startTime + parse!.duration)
  })
})
