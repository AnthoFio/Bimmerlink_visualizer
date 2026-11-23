import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadFixtureText } from '../../test/fixtures.ts'
import { handleParseRequest } from './parseJob.ts'
import type { ParseMessage } from './parseJob.ts'
import { loadLogInWorker, startParseWorker, stopParseWorker } from './loadLog.ts'
import type { ParseWorker } from './loadLog.ts'

const LOG = loadFixtureText('trimmed_2026-11-14_10-12-17.csv')

function fakeWorker() {
  const worker: ParseWorker = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  }
  const send = (data: ParseMessage) => worker.onmessage?.({ data } as MessageEvent<ParseMessage>)
  return { worker, send }
}

describe('handleParseRequest (worker side)', () => {
  it('transfers every typed array instead of copying it', async () => {
    const post = vi.fn<(message: ParseMessage, transfer?: Transferable[]) => void>()
    await handleParseRequest(new Blob([LOG]), post)

    const [message, transfer] = post.mock.lastCall!
    if (message.type !== 'done') throw new Error('expected a done message')
    const { time, columns } = message.result.dataset
    expect(transfer).toEqual([time.buffer, ...columns.map((column) => column.values.buffer)])
    expect(new Set(transfer).size).toBe(14)

    structuredClone(message, { transfer })
    expect(time.byteLength).toBe(0)
    expect(columns.every((column) => column.values.byteLength === 0)).toBe(true)
  })

  it('reports progress that grows up to 1', async () => {
    const big = `Time,"A"\n${'0.030,1\n'.repeat(20_000)}`
    const seen: number[] = []
    await handleParseRequest(new Blob([big]), (message) => {
      if (message.type === 'progress') seen.push(message.value)
    })

    expect(seen.length).toBeGreaterThan(2)
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
    expect(seen.at(-1)).toBe(1)
  })

  it('sends the friendly message when the log cannot be used', async () => {
    const post = vi.fn<(message: ParseMessage, transfer?: Transferable[]) => void>()
    await handleParseRequest(new Blob(['']), post)

    expect(post.mock.lastCall?.[0]).toEqual({
      type: 'error',
      message: expect.stringContaining('file is empty'),
    })
  })
})

describe('loadLogInWorker (page side)', () => {
  it('posts the file to a worker and resolves with its result', async () => {
    const { worker, send } = fakeWorker()
    const file = new File([LOG], 'log.csv')
    const onProgress = vi.fn()
    const loading = loadLogInWorker(file, { onProgress }, () => worker)

    expect(worker.postMessage).toHaveBeenCalledWith(file)
    send({ type: 'progress', value: 0.5 })
    expect(onProgress).toHaveBeenCalledWith(0.5)

    const result = {
      dataset: { time: new Float64Array(1), columns: [] },
      warnings: [],
      rampUp: { channelRows: [], rows: 0 },
    }
    send({ type: 'done', result })
    await expect(loading).resolves.toBe(result)
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('rejects with the message of the worker', async () => {
    const { worker, send } = fakeWorker()
    const loading = loadLogInWorker(new File([''], 'a.csv'), {}, () => worker)

    send({ type: 'error', message: 'The file is empty.' })
    await expect(loading).rejects.toThrow('The file is empty.')
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('can be cancelled, which stops the worker', async () => {
    const { worker } = fakeWorker()
    const controller = new AbortController()
    const loading = loadLogInWorker(
      new File([LOG], 'a.csv'),
      { signal: controller.signal },
      () => worker,
    )

    controller.abort()
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('rejects when the worker crashes', async () => {
    const { worker } = fakeWorker()
    const loading = loadLogInWorker(new File([LOG], 'a.csv'), {}, () => worker)

    worker.onerror?.({} as ErrorEvent)
    await expect(loading).rejects.toThrow(/could not be read/)
  })

  it('rejects when no worker can be started', async () => {
    const loading = loadLogInWorker(new File([LOG], 'a.csv'), {}, () => {
      throw new Error('blocked')
    })

    await expect(loading).rejects.toThrow(/could not be read/)
  })
})

describe('the parse worker started with the page', () => {
  const result = {
    dataset: { time: new Float64Array(1), columns: [] },
    warnings: [],
    rampUp: { channelRows: [], rows: 0 },
  }

  // Each test starts without a started worker.
  beforeEach(() => stopParseWorker())

  it('serves log after log without starting another worker, so no network is needed', async () => {
    const { worker, send } = fakeWorker()
    const create = vi.fn(() => worker)
    startParseWorker(create)
    startParseWorker(create)
    expect(create).toHaveBeenCalledOnce()

    const first = loadLogInWorker(new File([LOG], 'a.csv'), {})
    send({ type: 'done', result })
    await expect(first).resolves.toBe(result)

    const second = loadLogInWorker(new File([LOG], 'b.csv'), {})
    send({ type: 'error', message: 'The file is empty.' })
    await expect(second).rejects.toThrow('The file is empty.')

    expect(worker.postMessage).toHaveBeenCalledTimes(2)
    expect(worker.terminate).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledOnce()

    // Cancelling stops that worker, and a new one is started at once, while still online.
    const next = fakeWorker()
    create.mockImplementation(() => next.worker)
    const controller = new AbortController()
    const third = loadLogInWorker(new File([LOG], 'c.csv'), { signal: controller.signal })
    controller.abort()
    await expect(third).rejects.toMatchObject({ name: 'AbortError' })
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledTimes(2)

    const fourth = loadLogInWorker(new File([LOG], 'd.csv'), {})
    expect(next.worker.postMessage).toHaveBeenCalledOnce()
    next.send({ type: 'done', result })
    await expect(fourth).resolves.toBe(result)
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('replaces a worker that crashes during a load', async () => {
    const first = fakeWorker()
    const next = fakeWorker()
    const create = vi.fn(() => first.worker)
    startParseWorker(create)
    create.mockImplementation(() => next.worker)

    const loading = loadLogInWorker(new File([LOG], 'a.csv'), {})
    first.worker.onerror?.({} as ErrorEvent)
    await expect(loading).rejects.toThrow(/could not be read/)
    expect(create).toHaveBeenCalledTimes(2)

    const again = loadLogInWorker(new File([LOG], 'b.csv'), {})
    expect(next.worker.postMessage).toHaveBeenCalledOnce()
    next.send({ type: 'done', result })
    await expect(again).resolves.toBe(result)
  })

  it('drops a worker that fails before its first log', async () => {
    const { worker } = fakeWorker()
    startParseWorker(() => worker)
    worker.onerror?.({} as ErrorEvent)
    expect(worker.terminate).toHaveBeenCalledOnce()

    const next = fakeWorker()
    startParseWorker(() => next.worker)
    const loading = loadLogInWorker(new File([LOG], 'a.csv'), {})
    expect(worker.postMessage).not.toHaveBeenCalled()
    next.send({ type: 'done', result })
    await expect(loading).resolves.toBe(result)
  })

  it('starts nothing when workers are unavailable', () => {
    expect(() =>
      startParseWorker(() => {
        throw new Error('blocked')
      }),
    ).not.toThrow()
  })
})
