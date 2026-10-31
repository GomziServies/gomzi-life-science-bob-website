import type { DocObject, DoryDocument } from '@/types/document'

export const TEXT_TYPES = new Set(['textbox', 'itext'])

/**
 * The document with each fixed text replaced by what the company library says, and shown (a hidden text from the picture goes
 * live, with its clean patch). Pure: the design is returned, nothing is mutated.
 */
export function applyLibraryFixes(doc: DoryDocument, fixes: readonly { id: string; replacement: string }[]): DoryDocument {
  const byId = new Map(fixes.map((f) => [f.id, f.replacement]))
  const reveal = (o: DocObject): DocObject => {
    const replacement = byId.get(o.id)
    if (replacement !== undefined && TEXT_TYPES.has(o.type)) {
      const { ghost: _ghost, ...rest } = o
      void _ghost
      return { ...rest, text: replacement, opacity: 1 }
    }
    const target = typeof o.ghostFor === 'string' ? o.ghostFor : null
    if (target && byId.has(target)) return { ...o, opacity: 1 }
    return o
  }
  return { ...doc, pages: doc.pages.map((page) => ({ ...page, objects: page.objects.map(reveal) })) }
}
