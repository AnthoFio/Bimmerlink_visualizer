import { handleParseRequest } from './parseJob.ts'

self.onmessage = (event: MessageEvent<Blob>) => {
  void handleParseRequest(event.data, (message, transfer = []) =>
    self.postMessage(message, { transfer }),
  )
}
