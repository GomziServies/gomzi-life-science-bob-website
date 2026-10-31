import { BookCheck } from 'lucide-react'
import { useState } from 'react'
import { suggestLibraryFixes } from '@/features/studio/api'
import { useEditor, useEditorState } from '../context'
import ed from './ed.module.css'
import { applyLibraryFixes, TEXT_TYPES } from './libraryFixes'

/**
 * For a label made for one of the company's products: one button compares every text with the product's fixed texts (manufacturer,
 * FSSAI, advice blocks, tables) and replaces the ones that are only a misreading or a misspelling of them. The picture is never
 * changed silently: this runs only when the button is pressed, and it is one undo step.
 */
export function FixFromLibrary() {
  const editor = useEditor()
  const doc = useEditorState((s) => s.doc)
  const readOnly = useEditorState((s) => s.readOnly)
  const [busy, setBusy] = useState(false)
  const product = doc.meta?.studioProduct
  if (!product || readOnly) return null

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      const texts = doc.pages.flatMap((p) => p.objects).filter((o) => TEXT_TYPES.has(o.type) && typeof o.text === 'string').map((o) => ({ id: o.id, text: o.text as string }))
      const { fixes } = await suggestLibraryFixes({ product, flavour: doc.meta?.studioFlavour, texts })
      if (fixes.length === 0) {
        editor.toast('Every text already matches the company library.', 'success')
        return
      }
      editor.applyDocument(applyLibraryFixes(doc, fixes), { label: 'Fix from the company library' })
      editor.toast(`${fixes.length} text${fixes.length === 1 ? '' : 's'} corrected from the company library.`, 'success')
    } catch (error) {
      editor.toast(error instanceof Error && error.message ? error.message : 'The company library could not be checked. Try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className={ed.btn} disabled={busy} onClick={() => void run()} data-testid="ed-fix-from-library">
      <BookCheck size={16} aria-hidden="true" /> {busy ? 'Checking…' : 'Fix from the company library'}
    </button>
  )
}
