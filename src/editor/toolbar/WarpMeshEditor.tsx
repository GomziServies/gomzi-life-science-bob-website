import { useRef } from 'react'
import { MESH_COLS, MESH_RANGE_X, MESH_RANGE_Y, MESH_ROWS, meshOf } from '../engine/objects/warp'
import type { WarpMesh, WarpSpec } from '@/types/document'

const W = 240
const H = 150
const PAD_X = 24
const BOX_TOP = 40
const BOX_W = W - 2 * PAD_X
const BOX_H = 70
const STEP = 0.02

const clamp = (v: number, range: number): number => Math.max(-range, Math.min(range, v))
const baseX = (c: number): number => PAD_X + (c * BOX_W) / (MESH_COLS - 1)
const baseY = (r: number): number => BOX_TOP + (r * BOX_H) / (MESH_ROWS - 1)

/**
 * Drag any dot to bend the text: the dots sit on a grid over the text (the dashed box) and pull it in both
 * directions. Arrow keys nudge the focused dot.
 */
export function WarpMeshEditor({ spec, onChange }: { spec: WarpSpec; onChange: (next: WarpMesh, key: string) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const mesh = meshOf(spec)
  const at = (r: number, c: number): number => r * MESH_COLS + c

  const move = (r: number, c: number, dx: number, dy: number): void => {
    const next = { dx: [...mesh.dx], dy: [...mesh.dy] }
    next.dx[at(r, c)] = Math.round(clamp(dx, MESH_RANGE_X) * 1000) / 1000
    next.dy[at(r, c)] = Math.round(clamp(dy, MESH_RANGE_Y) * 1000) / 1000
    onChange(next, `warp-mesh-${r}-${c}`)
  }

  const drag = (r: number, c: number) => (e: React.PointerEvent<SVGCircleElement>) => {
    const el = svg.current
    if (!el) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent): void => {
      const rect = el.getBoundingClientRect()
      const x = ((ev.clientX - rect.left) / rect.width) * W
      const y = ((ev.clientY - rect.top) / rect.height) * H
      move(r, c, (x - baseX(c)) / BOX_W, (y - baseY(r)) / BOX_H)
    }
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const px = (r: number, c: number): number => baseX(c) + mesh.dx[at(r, c)] * BOX_W
  const py = (r: number, c: number): number => baseY(r) + mesh.dy[at(r, c)] * BOX_H

  const lines: string[] = []
  for (let r = 0; r < MESH_ROWS; r++) lines.push(Array.from({ length: MESH_COLS }, (_, c) => `${c === 0 ? 'M' : 'L'}${px(r, c).toFixed(1)} ${py(r, c).toFixed(1)}`).join(''))
  for (let c = 0; c < MESH_COLS; c++) lines.push(Array.from({ length: MESH_ROWS }, (_, r) => `${r === 0 ? 'M' : 'L'}${px(r, c).toFixed(1)} ${py(r, c).toFixed(1)}`).join(''))

  const dots = []
  for (let r = 0; r < MESH_ROWS; r++) {
    for (let c = 0; c < MESH_COLS; c++) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={px(r, c)}
          cy={py(r, c)}
          r={5}
          role="slider"
          tabIndex={0}
          aria-label={`Row ${r + 1}, column ${c + 1}`}
          aria-valuetext={`${Math.round(mesh.dx[at(r, c)] * 100)}% across, ${Math.round(mesh.dy[at(r, c)] * 100)}% down`}
          aria-valuenow={Math.round(mesh.dy[at(r, c)] * 100)}
          data-testid={`warp-dot-${r}-${c}`}
          fill="var(--color-accent, #7a64e0)"
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: 'move', touchAction: 'none' }}
          onPointerDown={drag(r, c)}
          onKeyDown={(e) => {
            const step = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key]
            if (!step) return
            e.preventDefault()
            move(r, c, mesh.dx[at(r, c)] + step[0], mesh.dy[at(r, c)] + step[1])
          }}
        />,
      )
    }
  }

  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label="Warp mesh" style={{ display: 'block', background: 'var(--color-surface-sunken, #f3f1ec)', borderRadius: 8 }}>
      <rect x={PAD_X} y={BOX_TOP} width={BOX_W} height={BOX_H} fill="none" stroke="var(--color-border, #cfcac2)" strokeDasharray="3 3" />
      {lines.map((d) => (
        <path key={d} d={d} fill="none" stroke="var(--color-accent, #7a64e0)" strokeWidth={1} opacity={0.6} />
      ))}
      {dots}
    </svg>
  )
}
