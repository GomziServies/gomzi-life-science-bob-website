import type { CSSProperties } from 'react'
import { useEditor } from '../context'
import { fillCssPreview } from '../engine/objects/fills'
import { layerColor, layerOffset } from '../engine/objects/extrude'
import { TITLE_STYLES, TITLE_STYLE_GROUPS, type TitleStyle } from '../engine/text/titleStyles'
import { PopoverStack } from './parts'

/** The preview is ~0.35x a typical headline, so depth and stroke are scaled the same way. */
const PREVIEW_SCALE = 0.35

function previewLayers(style: TitleStyle): { back: CSSProperties; front: CSSProperties | null } {
  const { fill, effects } = style
  const shadows: string[] = []
  const ex = effects.extrude
  if (ex) {
    const n = Math.min(12, Math.max(1, Math.round(ex.depth * PREVIEW_SCALE)))
    const step = ex.depth / n
    for (let i = 1; i <= n; i++) {
      const o = layerOffset(ex, i * step * PREVIEW_SCALE)
      shadows.push(`${o.x.toFixed(1)}px ${o.y.toFixed(1)}px 0 ${layerColor(ex, i - 1, n)}`)
    }
  }
  if (effects.glow) shadows.push(`0 0 ${Math.round(effects.glow.blur * PREVIEW_SCALE)}px ${effects.glow.color}`)
  else if (effects.shadow) {
    const s = effects.shadow
    shadows.push(`${s.offsetX * PREVIEW_SCALE}px ${s.offsetY * PREVIEW_SCALE}px ${s.blur * PREVIEW_SCALE}px ${s.color}`)
  }
  const gradient = fill.type === 'gradient'
  const back: CSSProperties = {
    color: gradient ? fill.stops[0].color : fill.color,
    textShadow: shadows.join(', ') || undefined,
    ...(effects.outline ? { WebkitTextStroke: `${Math.max(1, effects.outline.width * PREVIEW_SCALE)}px ${effects.outline.color}`, paintOrder: 'stroke fill' } : null),
    ...(effects.background ? { background: effects.background.color } : null),
  }
  const front: CSSProperties | null = gradient ? { backgroundImage: fillCssPreview(fill), WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : null
  return { back, front }
}

function Swatch({ style }: { style: TitleStyle }) {
  const { back, front } = previewLayers(style)
  const base: CSSProperties = {
    fontFamily: style.fontFamily ? `'${style.fontFamily}', var(--font-sans)` : 'var(--font-sans)',
    fontWeight: style.fontWeight ?? 700,
    fontSize: 26,
    lineHeight: 1.1,
    letterSpacing: style.charSpacing ? `${style.charSpacing / 1000}em` : undefined,
    textTransform: style.textCase === 'upper' ? 'uppercase' : undefined,
    whiteSpace: 'nowrap',
  }
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ ...base, ...back }}>Aa</span>
      {front ? (
        <span aria-hidden="true" style={{ ...base, ...front, position: 'absolute', inset: 0 }}>
          Aa
        </span>
      ) : null}
    </span>
  )
}

/** Grid of one-click headline looks, grouped by theme. */
export function TitleStylePicker() {
  const editor = useEditor()
  return (
    <PopoverStack width={300}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
        {TITLE_STYLE_GROUPS.map((group) => (
          <section key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h4 style={{ margin: 0, font: '600 var(--text-xs) / 1 var(--font-sans)', color: 'var(--color-text-muted)' }}>{group.label}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {TITLE_STYLES.filter((s) => s.group === group.id).map((style) => (
                <button
                  key={style.id}
                  type="button"
                  title={style.label}
                  aria-label={style.label}
                  data-testid={`title-style-${style.id}`}
                  onClick={() => editor.style.titleStyle(style)}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    height: 56,
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: style.on === 'dark' ? '#23232b' : '#f6f4ef',
                  }}
                >
                  <Swatch style={style} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PopoverStack>
  )
}
