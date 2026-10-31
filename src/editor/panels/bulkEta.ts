/** The time left for a bulk upload, worked out from how far the work has really got. */

export interface BulkProgress {
  /** Files in the upload. */
  total: number
  /** Files that have finished (added or failed). */
  finished: number
  /** Percent done (0–100) of each file that is being read right now. */
  running: readonly number[]
  /** Time since the files were sent. */
  elapsedMs: number
}

/** Needs a little real progress before it will guess: a first guess from nothing is worse than none. */
const MIN_FRACTION = 0.02
const MIN_ELAPSED_MS = 4000

/** Milliseconds left at the pace so far, or null while it is too early to tell. */
export function remainingMs({ total, finished, running, elapsedMs }: BulkProgress): number | null {
  if (total <= 0 || finished >= total) return 0
  const partial = running.reduce((sum, percent) => sum + Math.max(0, Math.min(100, percent)) / 100, 0)
  const fraction = (finished + partial) / total
  if (fraction < MIN_FRACTION || elapsedMs < MIN_ELAPSED_MS) return null
  return (elapsedMs * (1 - fraction)) / fraction
}

/** "less than a minute", "7 minutes", "2 h 5 min" (the words come from the caller, so they can be translated). */
export function formatDuration(ms: number, words: { lessThanAMinute: string; minutes: (n: number) => string; hours: (h: number, m: number) => string }): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes <= 1 && ms < 60_000) return words.lessThanAMinute
  if (minutes < 60) return words.minutes(minutes)
  return words.hours(Math.floor(minutes / 60), minutes % 60)
}
