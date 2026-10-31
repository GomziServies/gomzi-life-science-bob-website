/** Runs the tracer off the main thread: a large picture can take a second or two. */
import { type TraceOptions, type TraceResult, traceImage } from './tracer'

export interface TraceRequest {
  id: number
  width: number
  height: number
  pixels: Uint8ClampedArray
  options: TraceOptions
}

export type TraceReply = { id: number; result: TraceResult } | { id: number; error: string }

self.onmessage = (e: MessageEvent<TraceRequest>): void => {
  const { id, width, height, pixels, options } = e.data
  let reply: TraceReply
  try {
    reply = { id, result: traceImage({ width, height, data: pixels }, options) }
  } catch (err) {
    reply = { id, error: err instanceof Error ? err.message : String(err) }
  }
  ;(self as unknown as Worker).postMessage(reply)
}
