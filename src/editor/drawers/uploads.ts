import type { AssetRef } from '@/types/adapter'
import { uploadsOf } from '../audio/uploads'
import { classifyFile } from '../engine/files'
import type { EditorEngine } from '../engine/editor'
import { t } from '../strings'

export interface UniversalUploadResult {
  addedImages: AssetRef[]
  addedAudio: AssetRef[]
  failed: number
}

/**
 * Universal multi-format uploader: accepts any supported file format (images, audio, vector/svg, fonts).
 * Automatically classifies each file and routes it to the correct ingestion pipeline,
 * updating the active session stores and notifying the user on any failure.
 */
export async function uploadUniversalFiles(
  editor: EditorEngine,
  files: readonly File[],
): Promise<UniversalUploadResult> {
  const result: UniversalUploadResult = { addedImages: [], addedAudio: [], failed: 0 }
  if (editor.readOnly || files.length === 0) return result

  const { store } = editor
  store.setState((s) => ({ uploading: s.uploading + files.length }))

  for (const file of files) {
    const kind = classifyFile(file)
    try {
      if (kind === 'audio') {
        const { ref, durationMs } = await editor.audio.upload(file)
        uploadsOf(editor).add({ ref, durationMs, size: file.size })
        result.addedAudio.push(ref)
      } else if (kind === 'font') {
        const fontService = editor.adapter.services.fonts?.mine
        if (fontService) {
          const family = file.name.replace(/\.[^/.]+$/, '').trim() || 'CustomFont'
          await fontService.upload({
            family,
            files: [file],
          })
          editor.toast(`Font "${family}" added to your library`, 'info')
        } else {
          throw new Error('Font upload is not available for this session.')
        }
      } else {
        // Image, SVG, or general graphic
        const ref = await editor.adapter.uploadAsset(file, { name: file.name })
        store.setState((s) => ({ uploads: [ref, ...s.uploads.filter((u) => u.id !== ref.id)] }))
        result.addedImages.push(ref)
      }
    } catch (err) {
      result.failed++
      const message = err instanceof Error && err.message ? err.message : t.errors.upload
      editor.toast(`${file.name}: ${message}`, 'error')
    } finally {
      store.setState((s) => ({ uploading: Math.max(0, s.uploading - 1) }))
    }
  }

  return result
}

/**
 * Uploads dropped files to the library without placing them on the page.
 * Universally supports all media formats.
 */
export async function uploadToLibrary(editor: EditorEngine, files: readonly File[]): Promise<void> {
  await uploadUniversalFiles(editor, files)
}

