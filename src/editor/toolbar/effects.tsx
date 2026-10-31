import { useEditor, useSelection } from '../context'
import { DEFAULT_GLOW, DEFAULT_HIGHLIGHT, DEFAULT_OUTLINE, DEFAULT_SHADOW } from '../engine/objects/effects'
import { DEFAULT_EXTRUDE, EXTRUDE_MAX_DEPTH } from '../engine/objects/extrude'
import { readFill } from '../engine/objects/fills'
import { DEFAULT_WARP, MESH_COLS, MESH_ROWS, WARP_STYLES, presetToMesh } from '../engine/objects/warp'
import { WarpMeshEditor } from './WarpMeshEditor'
import { CURVE_MAX } from '../engine/text/curve'
import { t } from '../strings'
import { Button } from '../ui/Button'
import { ColorButton } from '../ui/ColorButton'
import { Slider } from '../ui/Slider'
import { Switch } from '../ui/Switch'
import type { ObjectEffects } from '@/types/document'
import { PopoverStack } from './parts'

function EffectBlock({ label, enabled, onToggle, children }: { label: string; enabled: boolean; onToggle: (on: boolean) => void; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Switch label={label} checked={enabled} onChange={onToggle} />
      {enabled ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 2 }}>{children}</div> : null}
    </div>
  )
}

/** Shadow, outline, glow and highlight controls (text); shadow only for shapes and images. */
export function EffectsPanel({ text }: { text: boolean }) {
  const editor = useEditor()
  const sel = useSelection()
  const effects = (sel.objects[0]?.effects ?? {}) as ObjectEffects
  const patch = (p: ObjectEffects, key?: string): void => editor.style.setEffects(p, key)
  const curve = typeof sel.objects[0]?.curveAmount === 'number' ? (sel.objects[0].curveAmount as number) : 0
  const fill = readFill(sel.objects[0]?.fill, '#000000')
  const hollow = !!effects.outline && fill.type === 'solid' && fill.color === 'transparent'

  /** Hollow text: the letters become see-through and the colour they had moves to the outline (and back). One undo step. */
  const toggleHollow = (on: boolean): void => {
    const size = Number(sel.objects[0]?.fontSize ?? 36)
    if (on) {
      const color = fill.type === 'solid' ? fill.color : (fill.stops[0]?.color ?? DEFAULT_OUTLINE.color)
      editor.style.text({ fill: { type: 'solid', color: 'transparent' } }, t.history.hollowText, 'hollow')
      patch({ outline: { color, width: Math.max(2, Math.round(size * 0.04)) } }, 'hollow')
    } else {
      const color = effects.outline?.color ?? DEFAULT_OUTLINE.color
      editor.style.text({ fill: { type: 'solid', color } }, t.history.hollowText, 'hollow')
      patch({ outline: undefined }, 'hollow')
    }
  }

  return (
    <PopoverStack width={264}>
      <EffectBlock label={t.toolbar.shadow} enabled={!!effects.shadow} onToggle={(on) => patch({ shadow: on ? DEFAULT_SHADOW : undefined, glow: on ? undefined : effects.glow })}>
        {effects.shadow ? (
          <>
            <ColorSwatchRow label={t.tools.color} value={effects.shadow.color} onChange={(color) => patch({ shadow: { ...effects.shadow!, color } }, 'shadow-c')} />
            <Slider label={t.toolbar.blur} value={effects.shadow.blur} min={0} max={60} onChange={(blur) => patch({ shadow: { ...effects.shadow!, blur } }, 'shadow-b')} display={String(effects.shadow.blur)} />
            <Slider label={t.tools.offsetX} value={effects.shadow.offsetX} min={-40} max={40} onChange={(offsetX) => patch({ shadow: { ...effects.shadow!, offsetX } }, 'shadow-x')} display={String(effects.shadow.offsetX)} />
            <Slider label={t.tools.offsetY} value={effects.shadow.offsetY} min={-40} max={40} onChange={(offsetY) => patch({ shadow: { ...effects.shadow!, offsetY } }, 'shadow-y')} display={String(effects.shadow.offsetY)} />
          </>
        ) : null}
      </EffectBlock>
      {text ? (
        <>
          <Switch label={t.toolbar.hollow} checked={hollow} onChange={toggleHollow} />
          <EffectBlock label={t.toolbar.outline} enabled={!!effects.outline} onToggle={(on) => patch({ outline: on ? DEFAULT_OUTLINE : undefined })}>
            {effects.outline ? (
              <>
                <ColorSwatchRow label={t.tools.color} value={effects.outline.color} onChange={(color) => patch({ outline: { ...effects.outline!, color } }, 'outline-c')} />
                <Slider label={t.tools.thickness} value={effects.outline.width} min={1} max={20} onChange={(width) => patch({ outline: { ...effects.outline!, width } }, 'outline-w')} display={String(effects.outline.width)} />
              </>
            ) : null}
          </EffectBlock>
          <EffectBlock label={t.toolbar.glow} enabled={!!effects.glow} onToggle={(on) => patch({ glow: on ? DEFAULT_GLOW : undefined })}>
            {effects.glow ? (
              <>
                <ColorSwatchRow label={t.tools.color} value={effects.glow.color} onChange={(color) => patch({ glow: { ...effects.glow!, color } }, 'glow-c')} />
                <Slider label={t.tools.intensity} value={effects.glow.blur} min={2} max={80} onChange={(blur) => patch({ glow: { ...effects.glow!, blur } }, 'glow-b')} display={String(effects.glow.blur)} />
              </>
            ) : null}
          </EffectBlock>
          <EffectBlock
            label={t.toolbar.warp}
            enabled={!!effects.warp}
            onToggle={(on) => patch({ warp: on ? DEFAULT_WARP : undefined })}
          >
            {effects.warp ? (
              <>
                <div role="group" aria-label={t.toolbar.warpShape} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {WARP_STYLES.map((w) => (
                    <Button key={w.id} size="sm" variant={effects.warp!.style === w.id ? 'primary' : 'ghost'} aria-pressed={effects.warp!.style === w.id} onClick={() => patch({ warp: { style: w.id, amount: effects.warp!.style === 'custom' ? DEFAULT_WARP.amount : effects.warp!.amount } }, 'warp-s')}>
                      {w.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={effects.warp.style === 'custom' ? 'primary' : 'ghost'}
                    aria-pressed={effects.warp.style === 'custom'}
                    onClick={() => {
                      const w = effects.warp!
                      if (w.style === 'custom') return
                      patch({ warp: { style: 'custom', amount: w.amount, mesh: presetToMesh(w.style, w.amount) } }, 'warp-s')
                    }}
                  >
                    {t.toolbar.warpCustom}
                  </Button>
                </div>
                {effects.warp.style === 'custom' ? (
                  <>
                    <WarpMeshEditor spec={effects.warp} onChange={(mesh, key) => patch({ warp: { ...effects.warp!, mesh } }, key)} />
                    <Button size="sm" variant="ghost" onClick={() => patch({ warp: { ...effects.warp!, mesh: { dx: new Array<number>(MESH_COLS * MESH_ROWS).fill(0), dy: new Array<number>(MESH_COLS * MESH_ROWS).fill(0) } } }, 'warp-mesh-reset')}>
                      {t.toolbar.reset}
                    </Button>
                  </>
                ) : (
                  <Slider label={t.toolbar.warpAmount} value={effects.warp.amount} min={-100} max={100} step={5} onChange={(amount) => patch({ warp: { ...effects.warp!, amount } }, 'warp-a')} display={String(effects.warp.amount)} />
                )}
              </>
            ) : null}
          </EffectBlock>
          <EffectBlock label={t.toolbar.extrude} enabled={!!effects.extrude} onToggle={(on) => patch({ extrude: on ? DEFAULT_EXTRUDE : undefined })}>
            {effects.extrude ? (
              <>
                <ColorSwatchRow label={t.tools.color} value={effects.extrude.color} onChange={(color) => patch({ extrude: { ...effects.extrude!, color } }, 'ext-c')} />
                <ColorSwatchRow label={t.toolbar.shade} value={effects.extrude.color2 ?? effects.extrude.color} onChange={(color2) => patch({ extrude: { ...effects.extrude!, color2 } }, 'ext-c2')} />
                <Slider label={t.toolbar.depth} value={effects.extrude.depth} min={1} max={EXTRUDE_MAX_DEPTH} onChange={(depth) => patch({ extrude: { ...effects.extrude!, depth } }, 'ext-d')} display={String(effects.extrude.depth)} />
                <Slider label={t.toolbar.direction} value={effects.extrude.angle} min={0} max={359} step={5} onChange={(angle) => patch({ extrude: { ...effects.extrude!, angle } }, 'ext-a')} display={`${effects.extrude.angle}°`} />
              </>
            ) : null}
          </EffectBlock>
          <EffectBlock label={t.toolbar.highlight} enabled={!!effects.background} onToggle={(on) => patch({ background: on ? DEFAULT_HIGHLIGHT : undefined })}>
            {effects.background ? <ColorSwatchRow label={t.tools.color} value={effects.background.color} onChange={(color) => patch({ background: { color } }, 'bg-c')} /> : null}
          </EffectBlock>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Slider label={t.toolbar.curve} value={curve} min={-CURVE_MAX} max={CURVE_MAX} step={5} onChange={(v) => editor.style.setCurve(v)} display={curve === 0 ? t.toolbar.none : String(curve)} />
            {curve !== 0 ? (
              <Button size="sm" variant="ghost" onClick={() => editor.style.setCurve(0)}>
                {t.toolbar.reset}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </PopoverStack>
  )
}

function ColorSwatchRow({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ font: '500 var(--text-xs) / 1 var(--font-sans)', color: 'var(--color-text-muted)' }}>{label}</span>
      <ColorButton label={`${label} color`} value={{ type: 'solid', color: value }} solidOnly onChange={(f) => (f.type === 'solid' ? onChange(f.color) : undefined)} />
    </div>
  )
}
