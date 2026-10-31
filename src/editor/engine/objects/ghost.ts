/**
 * "Hidden until edited" texts.
 *
 * A picture made editable keeps the picture itself untouched. Each text read from it is a real text layer placed exactly over the
 * letters in the picture, but hidden (`opacity: 0`, `ghost: true`), with a clean patch image (the picture's pixels with that text
 * painted out, also hidden, `ghostFor: <text id>`). Nothing shows until the user touches a text: the first edit, move or style
 * change reveals its patch (covering the old letters) and the live text above it. Only that spot of the picture changes.
 */
import type { Canvas, FabricObject } from 'fabric'
import { asDory } from './dory'

export const isGhost = (obj: FabricObject): boolean => asDory(obj).ghost === true

/** Shows a hidden text and its clean patch. Returns whether anything was hidden (so the caller knows a change was made). */
export function revealGhost(canvas: Canvas, text: FabricObject): boolean {
  const d = asDory(text)
  if (d.ghost !== true) return false
  const id = d.id
  delete d.ghost
  text.set('opacity', 1)
  for (const other of canvas.getObjects()) {
    if (id && asDory(other).ghostFor === id) other.set('opacity', 1)
  }
  canvas.requestRenderAll()
  return true
}

/** Reveals every hidden text among `objects` (a selection may hold several, or a group). Returns how many were revealed. */
export function revealGhosts(canvas: Canvas, objects: readonly FabricObject[]): number {
  let n = 0
  for (const obj of objects) if (revealGhost(canvas, obj)) n += 1
  return n
}
