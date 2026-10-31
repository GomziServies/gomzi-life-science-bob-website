import { AlertTriangle, CheckCircle2, Download, Wand2 } from 'lucide-react'
import type { LayeredJob } from '../api'
import styles from './LabelPicture.module.css'

interface Props {
  job: LayeredJob
  working: boolean
  /** While the picture is being turned into layers: how far it has got. */
  progress?: { percent: number; message: string } | null
  error?: string | null
  onMakeEditable: () => void
  /** Opens the picture in the editor as a new project; the editor's top bar then offers "Convert to editable". */
  onOpenPicture?: () => void
  onAgain: () => void
}

const heading = (key: string): string => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

/**
 * The label exactly as the AI drew it, with a proofread against the user's own words. If it is right, download it;
 * if a word is wrong, or the user wants to change something, one button turns the same picture into editable layers
 * (which repairs spelling from the user's words). Nothing is drawn again, so nothing is paid for twice.
 */
export function LabelPicture({ job, working, progress, error, onMakeEditable, onOpenPicture, onAgain }: Props) {
  const proof = job.proof
  const issues = proof?.issues ?? []
  const missing = proof?.missing ?? []
  const suggested = Object.keys(job.suggested ?? {})

  return (
    <section className={styles.card} aria-label="Your label as the AI drew it" data-testid="label-picture">
      <header className={styles.head}>
        {proof?.clean ? <CheckCircle2 size={22} aria-hidden="true" /> : <AlertTriangle size={22} aria-hidden="true" />}
        <div>
          <h2 className={styles.title}>{proof?.clean ? 'The AI drew your label, and every word matches yours' : 'The AI drew your label: check the lines below'}</h2>
          <p className={styles.sub}>
            {proof ? `${proof.lines_read} lines read and checked against the text you gave.` : 'This is the picture exactly as drawn.'}
          </p>
        </div>
      </header>

      {job.artwork_url ? <img className={styles.picture} src={job.artwork_url} alt="The label exactly as the AI drew it" /> : null}

      {suggested.length > 0 ? (
        <div className={`${styles.block} ${styles.warn}`} data-testid="label-suggested">
          <h3 className={styles.h3}>Written for your product: {suggested.map(heading).join(', ')}</h3>
          <p className={styles.note}>
            You did not give these, so they were written from what is known about this kind of product (and the web where needed). Nutrition numbers are typical values: check every section against your lab report and licence before printing.
          </p>
          <details className={styles.note}>
            <summary>Show the text that was written</summary>
            {suggested.map((key) => (
              <p key={key}>
                <strong>{heading(key)}</strong>: {job.suggested?.[key]}
              </p>
            ))}
          </details>
        </div>
      ) : null}

      {proof ? (
        <div className={`${styles.block} ${proof.clean ? styles.ok : styles.warn}`} role="status" data-testid="label-proof">
          <h3 className={styles.h3}>{proof.clean ? 'Spelling matches your text' : `${issues.length} line${issues.length === 1 ? '' : 's'} to check${missing.length ? ` and ${proof.missing_count} missing word${proof.missing_count === 1 ? '' : 's'}` : ''}`}</h3>
          {issues.length > 0 ? (
            <ul className={styles.list}>
              {issues.map((issue, index) => (
                <li key={`${issue.x}-${issue.y}-${index}`}>
                  <span className={styles.bad}>{issue.found}</span> <span aria-hidden="true">→</span> <span className={styles.good}>{issue.expected}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {missing.length > 0 ? (
            <ul className={styles.list}>
              {missing.map((gap) => (
                <li key={gap.key}>
                  <strong>{heading(gap.key)}</strong>: not found in the picture — <span className={styles.bad}>{gap.missing.join(', ')}</span>
                  {gap.missing_count > gap.missing.length ? ` and ${gap.missing_count - gap.missing.length} more` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          <p className={styles.note}>
            {proof.clean
              ? 'You can use the picture as it is.'
              : 'The reader can slip on very small print, so look at these lines in the picture. “Make editable” sets your own words in the label, so spelling is repaired for you.'}
          </p>
        </div>
      ) : null}

      {working && progress ? (
        <div className={styles.block} role="status" data-testid="editable-progress">
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-label="Making the label editable" className={styles.bar}>
            <div style={{ width: `${Math.max(4, progress.percent)}%` }} />
          </div>
          <p className={styles.note}>{progress.message || 'Making it editable…'}</p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className={`${styles.block} ${styles.warn}`}>
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onMakeEditable} disabled={working}>
          <Wand2 size={16} aria-hidden="true" /> {working ? 'Making it editable…' : 'Make editable'}
        </button>
        {onOpenPicture ? (
          <button type="button" className={styles.secondary} onClick={onOpenPicture} disabled={working}>
            Open in editor
          </button>
        ) : null}
        {job.artwork_url ? (
          <a className={styles.secondary} href={job.artwork_url} download="label.png">
            <Download size={16} aria-hidden="true" /> Download the picture
          </a>
        ) : null}
        <button type="button" className={styles.secondary} onClick={onAgain} disabled={working}>
          Draw again
        </button>
      </div>
    </section>
  )
}
