/**
 * Entry point of the vectorizer: `vectorize(raster, options)` traces a bitmap into SVG. It uses a worker when
 * the browser has one and falls back to tracing in place (tests, very old browsers).
 */
import type { TraceOptions, TraceResult } from './options'
import type { TraceReply, TraceRequest } from './worker'

export { TRACE_COLORS_RANGE, TRACE_PRESETS, type TraceOptions, type TracePresetId, type TraceResult } from './options'

/** The longest side the tracer is given: more pixels only add noise and time. */
export const TRACE_MAX_SIDE = 512
/** A traced SVG over this many characters is made lighter and traced again (the design has to stay saveable). */
export const MAX_TRACE_CHARS = 1_200_000

export interface Raster {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

let worker: Worker | null = null
let nextId = 1

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'doory-trace' })
  return worker
}

function viaWorker(w: Worker, raster: Raster, options: TraceOptions, signal?: AbortSignal): Promise<TraceResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const done = (): void => {
      w.removeEventListener('message', onMessage)
      signal?.removeEventListener('abort', onAbort)
    }
    const onMessage = (e: MessageEvent<TraceReply>): void => {
      if (e.data.id !== id) return
      done()
      if ('error' in e.data) reject(new Error(e.data.error))
      else resolve(e.data.result)
    }
    const onAbort = (): void => {
      // The worker cannot be interrupted mid-trace; drop it so the next trace starts clean.
      done()
      w.terminate()
      if (worker === w) worker = null
      reject(new DOMException('Trace cancelled', 'AbortError'))
    }
    w.addEventListener('message', onMessage)
    signal?.addEventListener('abort', onAbort)
    const request: TraceRequest = { id, width: raster.width, height: raster.height, pixels: raster.pixels, options }
    w.postMessage(request)
  })
}

async function once(raster: Raster, options: TraceOptions, signal?: AbortSignal): Promise<TraceResult> {
  if (signal?.aborted) throw new DOMException('Trace cancelled', 'AbortError')
  const w = getWorker()
  if (w) return viaWorker(w, raster, options, signal)
  const { traceImage } = await import('./tracer')
  return traceImage({ width: raster.width, height: raster.height, data: raster.pixels }, options)
}

/** Traces `raster`; when the result is too heavy to store it is traced again with fewer colours and less detail. */
export async function vectorize(raster: Raster, options: TraceOptions, signal?: AbortSignal): Promise<TraceResult> {
  let opts = options
  let result = await once(raster, opts, signal)
  for (let i = 0; i < 3 && result.size > MAX_TRACE_CHARS; i++) {
    opts = { ...opts, colors: Math.max(2, Math.round(opts.colors * 0.7)), detail: opts.detail * 0.7 }
    result = await once(raster, opts, signal)
  }
  return result
}
