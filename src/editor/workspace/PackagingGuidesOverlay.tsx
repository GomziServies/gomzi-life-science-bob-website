import type { CSSProperties } from 'react'
import { useEditorState } from '../context'
import { dielineById, panelRects, safeRect, zoneRectPx, type Dieline, type PxRect } from '../packaging/dielines'
import { usePackagingGuidesStore } from '../store/packagingGuidesStore'

interface PackagingGuidesOverlayProps {
  width: number
  height?: number
  /** Screen pixels per page pixel. */
  scale: number
}

const CREASE = '#0284c7'
const SAFE = '#10b981'
const BLEED = '#ef4444'
const ZONE = '#f59e0b'

const tag = (color: string, extra: CSSProperties = {}): CSSProperties => ({
  position: 'absolute',
  background: color,
  color: '#ffffff',
  fontSize: 10,
  fontWeight: 700,
  padding: '1px 5px',
  borderRadius: 3,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  whiteSpace: 'nowrap',
  ...extra,
})

const box = (r: PxRect, k: number): CSSProperties => ({ position: 'absolute', left: r.x * k, top: r.y * k, width: r.w * k, height: r.h * k, boxSizing: 'border-box' })

/** The panels, folds and seal zones of one dieline, in page pixels scaled to the screen. */
function Creases({ d, k }: { d: Dieline; k: number }) {
  const panels = panelRects(d)
  return (
    <>
      {d.panels.map((p) => (
        <div key={p.id} style={{ ...box(panels[p.id], k), border: `1.5px dashed ${CREASE}` }}>
          <span style={tag('rgba(2, 132, 199, 0.9)', { left: 4, bottom: 4 })}>{p.label}</span>
        </div>
      ))}
      {d.zones.map((z, i) => (
        <div key={`${z.kind}-${i}`} style={{ ...box(zoneRectPx(z), k), background: 'rgba(245, 158, 11, 0.18)', border: `1px dashed ${ZONE}` }}>
          <span style={tag(ZONE, { left: 2, top: 2, fontSize: 9 })}>{z.label}</span>
        </div>
      ))}
    </>
  )
}

export function PackagingGuidesOverlay({ scale }: PackagingGuidesOverlayProps) {
  const { showCreases, showBleed, showSafeMargin } = usePackagingGuidesStore()
  const dielineId = useEditorState((s) => s.doc.meta?.dielineId)
  const bleedPx = useEditorState((s) => s.doc.meta?.bleedPx ?? 24)
  const dieline = dielineById(dielineId)

  if (!showCreases && !showBleed && !showSafeMargin) return null
  const bleed = bleedPx * scale

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40, boxSizing: 'border-box', overflow: 'hidden' }} aria-hidden="true">
      {showCreases ? (
        dieline ? (
          <Creases d={dieline} k={scale} />
        ) : (
          [1, 2].map((n) => (
            <div key={n} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(n * 100) / 3}%`, borderLeft: `2px dashed ${CREASE}` }}>
              <span style={tag(CREASE, { top: 8, left: 6 })}>Fold crease {n}</span>
            </div>
          ))
        )
      ) : null}

      {showSafeMargin ? (
        dieline ? (
          dieline.panels.map((p) => (
            <div key={p.id} style={{ ...box(safeRect(dieline, p.id), scale), border: `1.5px dashed ${SAFE}` }} />
          ))
        ) : (
          <div style={{ position: 'absolute', inset: bleed, border: `1.5px dashed ${SAFE}` }}>
            <span style={tag(SAFE, { bottom: 4, left: 4, fontSize: 9 })}>Safe zone</span>
          </div>
        )
      ) : null}

      {showBleed ? (
        <div style={{ position: 'absolute', inset: 0, border: `${Math.max(2, bleed)}px solid rgba(239, 68, 68, 0.22)`, boxShadow: `inset 0 0 0 1.5px ${BLEED}` }}>
          <span style={tag(BLEED, { top: 4, right: 4, fontSize: 9 })}>Bleed {dieline ? `${dieline.bleedMm} mm` : ''}</span>
        </div>
      ) : null}
    </div>
  )
}
