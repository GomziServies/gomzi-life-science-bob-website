import { CheckCircle2, CircleAlert, Clock, Layers, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { authApi, templatesApi } from '@/lib/api'
import type { BulkJob } from '@/lib/api/templates'
import { t } from '../strings'
import { formatDuration, remainingMs } from './bulkEta'
import styles from './BulkLibraryUpload.module.css'

interface Row {
  filename: string
  jobId: string | null
  job: BulkJob | null
  refused?: string
}

const POLL_MS = 3000
/** Files per request. */
const BATCH = 4

/** Staff may add to the library; so may anybody on the local development server, which lets everyone through (the server decides the same way). */
function allowed(isStaff: boolean | undefined): boolean {
  return isStaff === true || import.meta.env.DEV === true
}
const FINISHED = new Set(['done', 'failed', 'missing'])

/**
 * Staff add the company's label files to the template library here: pick any number of PDFs, and each one is read on
 * the server and saved as a published template that every user then sees in this panel. While the files are read it
 * shows how many are done and how much time is really left (from the pace so far, not a fixed guess).
 * Shown only to staff; the grid of templates refreshes as files finish.
 */
export function BulkLibraryUpload({ onAdded, pollMs = POLL_MS }: { onAdded: () => void; pollMs?: number }) {
  const [staff, setStaff] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [publish, setPublish] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [estimate, setEstimate] = useState<{ ms: number | null; at: number }>({ ms: null, at: 0 })
  const [took, setTook] = useState<number | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const alive = useRef(true)
  const added = useRef(0)
  const started = useRef(0)

  useEffect(() => {
    alive.current = true
    authApi
      .me()
      .then((res) => alive.current && setStaff(allowed(res.user?.is_staff)))
      .catch(() => alive.current && setStaff(allowed(false)))
    return () => {
      alive.current = false
    }
  }, [])

  // The countdown moves every second between the server's answers.
  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [busy])

  if (!staff) return null

  /** Files go to the server a few at a time (a request with hundreds of files is refused by browsers and servers alike). */
  const send = async (files: File[], jobs: { filename: string; job_id: string }[], publishNow: boolean): Promise<void> => {
    for (let i = 0; i < files.length; i += BATCH) {
      if (!alive.current) return
      const group = files.slice(i, i + BATCH)
      const sent = await templatesApi.bulkUpload(group, { publish: publishNow })
      jobs.push(...sent.jobs)
      const byName = new Map(sent.jobs.map((j) => [j.filename, j.job_id]))
      const refused = new Map(sent.refused.map((r) => [r.filename, r.message]))
      setRows((current) => current.map((row) => (row.jobId === null && (byName.has(row.filename) || refused.has(row.filename)) ? { ...row, jobId: byName.get(row.filename) ?? null, refused: refused.get(row.filename) } : row)))
    }
  }

  /** Follows every file sent so far until all are sent and all are finished. */
  const follow = async (jobs: { filename: string; job_id: string }[], total: number, sending: () => boolean): Promise<void> => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, pollMs))
      if (!alive.current) return
      const ids = jobs.map((j) => j.job_id)
      const states = ids.length > 0 ? (await templatesApi.bulkStatus(ids)).jobs : []
      const byId = new Map(states.map((s) => [s.job_id, s]))
      setRows((current) => current.map((row) => (row.jobId ? { ...row, job: byId.get(row.jobId) ?? row.job } : row)))
      const finished = states.filter((s) => FINISHED.has(s.status)).length
      const running = states.filter((s) => !FINISHED.has(s.status)).map((s) => s.progress ?? 0)
      setEstimate({ ms: remainingMs({ total, finished, running, elapsedMs: Date.now() - started.current }), at: Date.now() })
      const done = states.filter((s) => s.status === 'done').length
      if (done !== added.current) {
        added.current = done
        onAdded() // the new templates show in the grid as they are saved
      }
      if (!sending() && states.every((s) => FINISHED.has(s.status))) return
    }
  }

  const choose = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    setTook(null)
    setEstimate({ ms: null, at: Date.now() })
    added.current = 0
    started.current = Date.now()
    setRows(files.map((f) => ({ filename: f.name, jobId: null, job: null })))
    const jobs: { filename: string; job_id: string }[] = []
    let sending = true
    try {
      const sendAll = send(files, jobs, publish).finally(() => {
        sending = false
      })
      await Promise.all([sendAll, follow(jobs, files.length, () => sending)])
      onAdded()
      if (alive.current) setTook(Date.now() - started.current)
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : ''
      setError(t.templates.bulk.uploadFailed + detail)
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  const text = t.templates.bulk
  const finished = rows.filter((r) => r.refused || (r.job && FINISHED.has(r.job.status)))
  const ok = rows.filter((r) => r.job?.status === 'done').length
  const failed = finished.length - ok
  const left = estimate.ms === null ? null : Math.max(0, estimate.ms - (now - estimate.at))
  const words = { lessThanAMinute: text.lessThanAMinute, minutes: text.minutes, hours: text.hours }

  return (
    <section className={styles.box} data-testid="bulk-library">
      <div className={styles.head}>
        <Layers size={20} aria-hidden="true" />
        <div>
          <strong>{text.title}</strong>
          <p>{text.desc}</p>
        </div>
      </div>
      <input ref={input} type="file" multiple accept=".pdf,.cdr,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={(e) => void choose(e)} data-testid="bulk-input" />
      <div className={styles.actions}>
        <button type="button" className={styles.choose} disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : null}
          {busy ? text.working(finished.length, rows.length) : text.choose}
        </button>
        <label className={styles.publish}>
          <input type="checkbox" checked={publish} disabled={busy} onChange={(e) => setPublish(e.target.checked)} />
          {text.publish}
        </label>
      </div>
      {busy && rows.length > 0 ? (
        <div className={styles.progress}>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={finished.length} aria-label={text.title} className={styles.bar}>
            <div style={{ width: `${Math.max(2, (finished.length / rows.length) * 100)}%` }} />
          </div>
          <p role="status" data-testid="bulk-eta">
            {left === null ? text.estimating : text.left(formatDuration(left, words))}
          </p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <>
          {!busy ? (
            <p className={styles.summary}>
              {text.summary(ok, failed)}
              {took !== null ? ` · ${text.finishedIn(formatDuration(took, words))}` : ''}
            </p>
          ) : null}
          <ul className={styles.list} aria-label={text.title}>
            {rows.map((row) => {
              const status = row.refused ? 'failed' : (row.job?.status ?? 'waiting')
              const icon =
                status === 'done' ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : status === 'failed' || status === 'missing' ? (
                  <CircleAlert size={14} aria-hidden="true" />
                ) : status === 'waiting' || status === 'queued' ? (
                  <Clock size={14} aria-hidden="true" />
                ) : (
                  <Loader2 size={14} className={styles.spin} aria-hidden="true" />
                )
              const note = row.refused ?? (status === 'failed' || status === 'missing' ? row.job?.error || text.failed : status === 'done' ? text.added : row.job?.message || text.waiting)
              return (
                <li key={row.filename + (row.jobId ?? '')} data-status={status}>
                  {icon}
                  <span className={styles.name} title={row.filename}>
                    {row.job?.template?.title ?? row.filename}
                  </span>
                  <small>{note}</small>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </section>
  )
}
