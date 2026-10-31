import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eraser, Minus, Plus, RotateCcw, Sparkles, Undo2, Wand2, X } from 'lucide-react'
import { useEditor, usePortalRoot } from '../context'
import { t } from '../strings'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import styles from './BackgroundEraser.module.css'

/** The longest side the hand-erased picture keeps; larger pictures are scaled down so painting stays smooth. */
const MAX_SIDE = 3000
const MAX_UNDO = 20

type Tool = 'erase' | 'restore'

/** First step of "Remove Background": the person picks the AI eraser or paints the background away by hand. */
export function BackgroundEraserDialog() {
  const editor = useEditor()
  const [manual, setManual] = useState(false)
  const url = editor.style.selectedImageUrl()

  if (manual && url) return <ManualEraser url={url} onClose={() => editor.closeDialog()} />

  return (
    <Dialog title={t.errors.bgEraser.title} onClose={() => editor.closeDialog()} width={560} description={t.errors.bgEraser.pick}>
      <div className={styles.choices}>
        <button type="button" className={`${styles.choice} ${styles.ai}`} data-testid="bg-choice-ai" onClick={() => editor.openDialog('background-removal')}>
          <span className={styles.badge}>
            <Sparkles size={22} />
          </span>
          <strong>{t.errors.bgEraser.aiName}</strong>
          <span>{t.errors.bgEraser.aiDesc}</span>
        </button>
        <button type="button" className={`${styles.choice} ${styles.hand}`} data-testid="bg-choice-manual" disabled={!url} onClick={() => setManual(true)}>
          <span className={styles.badge}>
            <Wand2 size={22} />
          </span>
          <strong>{t.errors.bgEraser.manualName}</strong>
          <span>{t.errors.bgEraser.manualDesc}</span>
        </button>
      </div>
    </Dialog>
  )
}

/** Full page to erase the background with a brush: the picture sits on a checkerboard, so what is gone shows as see-through. */
function ManualEraser({ url, onClose }: { url: string; onClose: () => void }) {
  const editor = useEditor()
  const root = usePortalRoot()
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const original = useRef<HTMLCanvasElement | null>(null)
  const history = useRef<ImageData[]>([])
  const last = useRef<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<Tool>('erase')
  const [size, setSize] = useState(48)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [undoable, setUndoable] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const blob = await (await fetch(url)).blob()
        const bitmap = await createImageBitmap(blob)
        if (cancelled) return
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
        const w = Math.max(1, Math.round(bitmap.width * scale))
        const h = Math.max(1, Math.round(bitmap.height * scale))
        const source = document.createElement('canvas')
        source.width = w
        source.height = h
        source.getContext('2d')?.drawImage(bitmap, 0, 0, w, h)
        original.current = source
        const view = canvas.current
        if (!view) return
        view.width = w
        view.height = h
        view.getContext('2d')?.drawImage(source, 0, 0)
        setReady(true)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url])

  const remember = (): void => {
    const view = canvas.current
    const ctx = view?.getContext('2d')
    if (!view || !ctx) return
    history.current.push(ctx.getImageData(0, 0, view.width, view.height))
    if (history.current.length > MAX_UNDO) history.current.shift()
    setUndoable(true)
  }

  const point = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * canvas.current!.width, y: ((e.clientY - rect.top) / rect.height) * canvas.current!.height }
  }

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }): void => {
    const view = canvas.current
    const ctx = view?.getContext('2d')
    if (!view || !ctx || !original.current) return
    // The brush is sized on screen, so it paints the same width at any zoom or picture size.
    const rect = view.getBoundingClientRect()
    const width = (size * view.width) / rect.width
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = width
    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000'
    } else {
      // Restoring paints with the untouched picture itself.
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = ctx.createPattern(original.current, 'no-repeat') ?? '#000'
    }
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x + 0.01, to.y)
    ctx.stroke()
    ctx.restore()
  }

  const onDown = (e: React.PointerEvent): void => {
    if (!ready) return
    e.currentTarget.setPointerCapture(e.pointerId)
    remember()
    const p = point(e)
    last.current = p
    stroke(p, p)
  }
  const onMove = (e: React.PointerEvent): void => {
    const rect = stage.current?.getBoundingClientRect()
    if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!last.current) return
    const p = point(e)
    stroke(last.current, p)
    last.current = p
  }
  const onUp = (): void => {
    last.current = null
  }

  const undo = useCallback((): void => {
    const view = canvas.current
    const previous = history.current.pop()
    if (view && previous) view.getContext('2d')?.putImageData(previous, 0, 0)
    setUndoable(history.current.length > 0)
  }, [])

  const reset = (): void => {
    const view = canvas.current
    if (!view || !original.current) return
    remember()
    const ctx = view.getContext('2d')
    ctx?.clearRect(0, 0, view.width, view.height)
    ctx?.drawImage(original.current, 0, 0)
  }

  const apply = async (): Promise<void> => {
    const view = canvas.current
    if (!view) return
    setSaving(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => view.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('empty')
      await editor.style.replaceSelectedWith(blob, 'cutout.png')
      editor.closeDialog()
      editor.toast(t.errors.bgEraser.done, 'success')
    } catch {
      setSaving(false)
      setFailed(true)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, undo])

  if (!root) return null
  const text = t.errors.bgEraser
  return createPortal(
    <div className={styles.page} role="dialog" aria-modal="true" aria-label={text.manualName}>
      <header className={styles.top}>
        <strong>{text.manualName}</strong>
        <span className={styles.hint}>{text.hint}</span>
        <button type="button" className={styles.close} aria-label={t.dialog.close} onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      <div ref={stage} className={styles.stage}>
        <div className={styles.paper} style={{ transform: `scale(${zoom})` }}>
          <canvas
            ref={canvas}
            className={styles.canvas}
            data-testid="bg-eraser-canvas"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={() => {
              onUp()
              setCursor(null)
            }}
          />
        </div>
        {cursor && ready ? <span className={styles.brush} style={{ width: size, height: size, left: cursor.x, top: cursor.y }} /> : null}
        {!ready && !failed ? <p className={styles.note}>…</p> : null}
        {failed ? (
          <p role="alert" className={styles.noteError}>
            {text.loadFailed}
          </p>
        ) : null}
      </div>

      <footer className={styles.bar}>
        <div className={styles.group} role="radiogroup" aria-label={text.manualName}>
          <button type="button" role="radio" aria-checked={tool === 'erase'} className={tool === 'erase' ? styles.on : ''} onClick={() => setTool('erase')}>
            <Eraser size={16} /> {text.erase}
          </button>
          <button type="button" role="radio" aria-checked={tool === 'restore'} className={tool === 'restore' ? styles.on : ''} onClick={() => setTool('restore')}>
            <RotateCcw size={16} /> {text.restore}
          </button>
        </div>
        <label className={styles.slider}>
          {text.brushSize}
          <input type="range" min={6} max={160} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <div className={styles.group}>
          <button type="button" aria-label={text.zoomOut} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
            <Minus size={16} />
          </button>
          <span className={styles.zoom}>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label={text.zoomIn} onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>
            <Plus size={16} />
          </button>
        </div>
        <div className={styles.group}>
          <button type="button" disabled={!undoable} onClick={undo}>
            <Undo2 size={16} /> {text.undo}
          </button>
          <button type="button" disabled={!ready} onClick={reset}>
            {text.reset}
          </button>
        </div>
        <span className={styles.spacer} />
        <Button onClick={onClose}>{t.dialog.cancel}</Button>
        <Button variant="primary" disabled={!ready || saving} onClick={() => void apply()}>
          {saving ? text.saving : text.apply}
        </Button>
      </footer>
    </div>,
    root,
  )
}
