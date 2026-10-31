import { RefreshCw, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { drawnJobOfDesign } from '@/features/studio/api'
import { drawnLabelJobOf, isMadeEditable } from '@/features/studio/pictureDesign'
import { useEditor, useEditorState } from '../context'
import { readPictureAsEditable } from './readPicture'
import ed from './ed.module.css'

/**
 * For a label picture drawn by the AI (opened from the Studio): one button in the top bar makes the picture editable. The
 * design then opens exactly as the picture: the picture stays as the bottom layer and each text the reader matched is a hidden
 * text layer on top of it (see engine/objects/ghost.ts); the first edit of a text shows it. It reads the picture that is
 * already there: nothing is drawn again, so nothing is paid for twice.
 *
 * The button stays after the first time, as "Retry make editable": the picture remembers the drawn label it came from, so reading it
 * again is one click (it replaces the layers, so a design that was already made editable asks first).
 */
export function ConvertToEditable() {
  const editor = useEditor()
  const linked = useEditorState((s) => drawnLabelJobOf(s.doc as never))
  const again = useEditorState((s) => isMadeEditable(s.doc as never))
  const readOnly = useEditorState((s) => s.readOnly)
  const [progress, setProgress] = useState<string | null>(null)
  const [found, setFound] = useState<string | null>(null)
  const designId = editor.designId
  // A design made editable before the picture remembered its drawn label: the server finds it from the saved design.
  useEffect(() => {
    if (linked || !again || !designId) return
    let alive = true
    drawnJobOfDesign(designId)
      .then((id) => alive && setFound(id))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [linked, again, designId])
  const jobId = linked ?? found
  if (!jobId || readOnly) return null

  const run = async (): Promise<void> => {
    if (again && !window.confirm('Read the picture again? The layers are made again from the original picture, and the changes you made to them are lost.')) return
    setProgress('Starting…')
    try {
      const document = await readPictureAsEditable(jobId, (message, percent) => setProgress(`${message} ${percent}%`))
      editor.applyDocument(document, { label: again ? 'Retry make editable' : 'Make editable' })
      editor.toast('The label is editable and looks exactly as before. Click or double-click any text to change it.', 'success')
    } catch (error) {
      editor.toast(error instanceof Error && error.message ? error.message : 'The label could not be made editable. Try again.', 'error')
    } finally {
      setProgress(null)
    }
  }

  return (
    <button type="button" className={again ? ed.btn : `${ed.btn} ${ed.primary}`} disabled={progress !== null} onClick={() => void run()} data-testid="ed-convert-editable">
      {again ? <RefreshCw size={16} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />} {progress ?? (again ? 'Retry make editable' : 'Make editable')}
    </button>
  )
}
