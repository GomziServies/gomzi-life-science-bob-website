import { Spline } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useEditor } from '../../context'
import { TRACE_COLORS_RANGE, TRACE_PRESETS, type TraceOptions, type TracePresetId } from '../../engine/vectorize'
import { t } from '../../strings'
import { Button } from '../../ui/Button'
import { Slider } from '../../ui/Slider'
import { Switch } from '../../ui/Switch'
import { PopoverStack, PopoverTool } from '../parts'

const PRESET_LABELS: Record<TracePresetId, string> = {
  logo: t.toolbar.traceLogo,
  icon: t.toolbar.traceIcon,
  illustration: t.toolbar.traceIllustration,
}

/** "Trace to vector" for the selected picture: pick what it looks like, adjust if needed, trace. One undo step. */
export function TraceTool() {
  const editor = useEditor()
  const [opts, setOpts] = useState<TraceOptions>(TRACE_PRESETS.logo)
  const [preset, setPreset] = useState<TracePresetId | null>('logo')
  const [busy, setBusy] = useState(false)
  const running = useRef<AbortController | null>(null)

  // Leaving while a trace runs cancels it: the design stays as it was.
  useEffect(() => () => running.current?.abort(), [])

  const change = (patch: Partial<TraceOptions>): void => {
    setOpts((o) => ({ ...o, ...patch }))
    setPreset(null)
  }

  const run = async (): Promise<void> => {
    const ctl = new AbortController()
    running.current = ctl
    setBusy(true)
    try {
      await editor.vectorize.traceSelected(opts, ctl.signal)
    } catch {
      editor.toast(t.errors.trace, 'error')
    } finally {
      if (running.current === ctl) running.current = null
      setBusy(false)
    }
  }

  return (
    <PopoverTool label={t.toolbar.trace} trigger={<Spline size={18} aria-hidden="true" />} width={280} testId="ed-trace">
      <PopoverStack width={256}>
        <p style={{ margin: 0, font: '400 var(--text-xs) / 1.4 var(--font-sans)', color: 'var(--color-text-muted)' }}>{t.toolbar.traceHint}</p>
        <div role="group" aria-label={t.toolbar.tracePreset} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {(Object.keys(TRACE_PRESETS) as TracePresetId[]).map((id) => (
            <Button
              key={id}
              size="sm"
              variant={preset === id ? 'primary' : 'ghost'}
              aria-pressed={preset === id}
              data-testid={`trace-preset-${id}`}
              onClick={() => {
                setOpts(TRACE_PRESETS[id])
                setPreset(id)
              }}
            >
              {PRESET_LABELS[id]}
            </Button>
          ))}
        </div>
        <Slider label={t.toolbar.traceColors} value={opts.colors} min={TRACE_COLORS_RANGE[0]} max={TRACE_COLORS_RANGE[1]} onChange={(colors) => change({ colors })} display={String(opts.colors)} />
        <Slider label={t.toolbar.traceDetail} value={Math.round(opts.detail * 100)} min={0} max={100} onChange={(v) => change({ detail: v / 100 })} display={`${Math.round(opts.detail * 100)}%`} />
        <Slider label={t.toolbar.traceSmooth} value={Math.round(opts.smooth * 100)} min={0} max={100} onChange={(v) => change({ smooth: v / 100 })} display={`${Math.round(opts.smooth * 100)}%`} />
        <Switch label={t.toolbar.traceCutout} checked={opts.dropBackground} onChange={(dropBackground) => change({ dropBackground })} />
        <Button size="sm" variant="primary" disabled={busy} data-testid="trace-run" onClick={() => void run()}>
          {busy ? t.toolbar.traceBusy : t.toolbar.traceRun}
        </Button>
      </PopoverStack>
    </PopoverTool>
  )
}
