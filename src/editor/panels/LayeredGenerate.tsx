import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Layers, Loader2, Sparkles } from 'lucide-react'
import { getLayeredDesign, startLayeredDesign, type LayeredJob } from '@/features/studio/api'
import styles from './StudioAiPanel.module.css'

const SIZES = [
  { id: 'wide', label: 'Wide wrap label', width: 1536, height: 640 },
  { id: 'tub', label: 'Tub label', width: 1536, height: 1024 },
  { id: 'square', label: 'Square', width: 1024, height: 1024 },
  { id: 'pouch', label: 'Tall pouch', width: 1024, height: 1536 },
] as const

const POLL_MS = 2000

/**
 * "Generate an editable label": describe it, and the studio makes the artwork, splits it into layers (live text,
 * shapes, cut-outs, background), runs the design critic and saves the result as a new design to open.
 */
export function LayeredGenerate() {
  const [prompt, setPrompt] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState<(typeof SIZES)[number]['id']>('wide')
  const [job, setJob] = useState<LayeredJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const running = job !== null && job.status !== 'done' && job.status !== 'failed'

  const poll = (id: string): void => {
    timer.current = setTimeout(async () => {
      try {
        const next = await getLayeredDesign(id)
        if (!alive.current) return
        setJob(next)
        if (next.status !== 'done' && next.status !== 'failed') poll(id)
      } catch {
        if (alive.current) setError('Lost contact with the server. Reload the panel to check on your design.')
      }
    }, POLL_MS)
  }

  const generate = async (): Promise<void> => {
    const chosen = SIZES.find((s) => s.id === size) ?? SIZES[0]
    setError(null)
    setJob(null)
    try {
      const started = await startLayeredDesign({
        prompt: prompt.trim(),
        width: chosen.width,
        height: chosen.height,
        brand_name: brand.trim(),
        create_design: true,
      })
      if (!alive.current) return
      setJob(started)
      if (started.status !== 'done' && started.status !== 'failed') poll(started.id)
    } catch {
      if (alive.current) setError('The design could not be started. Check your connection and try again.')
    }
  }

  const failed = job?.status === 'failed'
  const done = job?.status === 'done'

  return (
    <div className={styles.section} data-testid="layered-generate">
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>
          <Layers size={14} /> Generate an editable label
        </h4>
      </div>
      <p className={styles.sectionDesc}>
        Describe your label. You get a new design where every text, badge and photo is its own layer you can edit.
      </p>
      <textarea
        aria-label="Describe your label"
        placeholder="Premium kulfi whey protein tub label, brown and cream, 24g protein badge…"
        rows={3}
        value={prompt}
        maxLength={2000}
        disabled={running}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: '100%', resize: 'vertical', font: 'inherit', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          aria-label="Brand name"
          placeholder="Brand (optional)"
          value={brand}
          maxLength={200}
          disabled={running}
          onChange={(e) => setBrand(e.target.value)}
          style={{ flex: 1, minWidth: 0, font: 'inherit', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <select aria-label="Label shape" value={size} disabled={running} onChange={(e) => setSize(e.target.value as typeof size)} style={{ font: 'inherit', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className={styles.heroAction} disabled={running || prompt.trim().length < 3} onClick={() => void generate()} data-testid="layered-run">
        {running ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
        {running ? 'Generating…' : 'Generate layered label'}
      </button>

      {running && job ? (
        <div role="status" aria-live="polite" data-testid="layered-progress">
          <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(4, job.progress)}%`, height: '100%', background: '#99c229', transition: 'width .3s' }} />
          </div>
          <small>{job.stage_message}</small>
        </div>
      ) : null}

      {error || failed ? (
        <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
          {error ?? job?.error ?? 'The design could not be produced.'}
        </p>
      ) : null}

      {done && job ? (
        <div data-testid="layered-result" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong>
            Design check: {Math.round(job.report?.score ?? 0)}/100 {job.report?.passed ? '· passed' : '· needs a look'}
          </strong>
          {job.layers ? (
            <small>
              {job.layers.text} texts · {job.layers.shapes} shapes · {job.layers.cutouts} cut-outs, all editable
            </small>
          ) : null}
          {(job.corrections ?? []).slice(0, 3).map((c) => (
            <small key={c.before}>
              Corrected text: “{c.before}” → “{c.after}”
            </small>
          ))}
          {(job.report?.fixes_applied ?? []).slice(0, 3).map((fix) => (
            <small key={fix}>Fixed: {fix}</small>
          ))}
          {(job.report?.critique_notes ?? []).slice(0, 3).map((note) => (
            <small key={note} style={{ color: '#92400e' }}>
              Check: {note}
            </small>
          ))}
          {job.design_id ? (
            <button type="button" className={styles.heroAction} data-testid="layered-open" onClick={() => window.open(`/design/${job.design_id}`, '_blank')}>
              <ExternalLink size={14} aria-hidden="true" /> Open the editable design
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
