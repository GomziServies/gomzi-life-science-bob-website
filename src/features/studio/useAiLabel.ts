import { useCallback, useEffect, useRef, useState } from 'react'
import { type LayeredJob, type LayeredRequest, getLayeredDesign, makeLabelEditable, startLayeredDesign } from './api'

const POLL_MS = 1500

export interface AiLabelState {
  job: LayeredJob | null
  error: string | null
  running: boolean
  start: (request: LayeredRequest) => Promise<LayeredJob | null>
  /** Turns the drawn label into editable layers and follows that job. */
  makeEditable: (drawnJobId: string) => Promise<LayeredJob | null>
  reset: () => void
}

/** Starts an AI-image label job and follows it until it is done or has failed. */
export function useAiLabel(): AiLabelState {
  const [job, setJob] = useState<LayeredJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const finished = (j: LayeredJob): boolean => j.status === 'done' || j.status === 'failed'

  const wait = useCallback(
    (ms: number): Promise<void> =>
      new Promise((resolve) => {
        timer.current = setTimeout(resolve, ms)
      }),
    [],
  )

  const follow = useCallback(
    async (first: () => Promise<LayeredJob>): Promise<LayeredJob | null> => {
      setError(null)
      try {
        let current = await first()
        if (!alive.current) return null
        setJob(current)
        while (!finished(current)) {
          await wait(POLL_MS)
          if (!alive.current) return null
          current = await getLayeredDesign(current.id)
          if (!alive.current) return null
          setJob(current)
        }
        return current
      } catch (e) {
        if (alive.current) setError(e instanceof Error && e.message ? e.message : 'Lost contact with the server. Check your connection and try again.')
        return null
      }
    },
    [wait],
  )

  const start = useCallback(
    (request: LayeredRequest): Promise<LayeredJob | null> => {
      setJob(null)
      return follow(() => startLayeredDesign(request))
    },
    [follow],
  )

  const makeEditable = useCallback((drawnJobId: string): Promise<LayeredJob | null> => follow(() => makeLabelEditable(drawnJobId)), [follow])

  const reset = useCallback((): void => {
    if (timer.current) clearTimeout(timer.current)
    setJob(null)
    setError(null)
  }, [])

  return { job, error, running: job !== null && !finished(job) && error === null, start, makeEditable, reset }
}
