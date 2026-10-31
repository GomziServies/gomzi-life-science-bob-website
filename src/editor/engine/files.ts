/** Opens the system file picker; resolves with the chosen files, or `[]` when the dialog is cancelled. */
export function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    let settled = false
    const finish = (files: File[]): void => {
      if (settled) return
      settled = true
      input.remove()
      resolve(files)
    }
    input.addEventListener('change', () => finish([...(input.files ?? [])]))
    input.addEventListener('cancel', () => finish([]))
    document.body.appendChild(input)
    input.click()
  })
}

/** Image files out of a drop/paste `DataTransfer`. */
export function imageFilesFrom(data: DataTransfer | null): File[] {
  if (!data) return []
  return [...data.files].filter((f) => f.type.startsWith('image/'))
}

export const ALL_UPLOAD_ACCEPT = 'image/*,audio/*,.pdf,.svg,.png,.jpg,.jpeg,.webp,.gif,.avif,.mp3,.wav,.ogg,.m4a,.webm,.weba,.flac,.aac,.ttf,.otf,.woff,.woff2'

export type MediaFileKind = 'image' | 'audio' | 'pdf' | 'font' | 'unknown'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'svg', 'bmp', 'ico'])
const AUDIO_EXTS = new Set(['mp3', 'ogg', 'oga', 'opus', 'wav', 'm4a', 'weba', 'webm', 'flac', 'aac'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])
const PDF_EXTS = new Set(['pdf', 'ai', 'eps'])

/** Classifies an incoming file by MIME type and filename extension fallback (handling Windows empty MIME types). */
export function classifyFile(file: { name?: string; type?: string }): MediaFileKind {
  const type = (file.type ?? '').toLowerCase().split(';')[0].trim()
  const name = file.name ?? ''
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''

  if (type.startsWith('image/') || IMAGE_EXTS.has(ext)) {
    return 'image'
  }
  if (type.startsWith('audio/') || AUDIO_EXTS.has(ext) || (type.startsWith('video/webm') && AUDIO_EXTS.has(ext))) {
    return 'audio'
  }
  if (type === 'application/pdf' || PDF_EXTS.has(ext)) {
    return 'pdf'
  }
  if (type.startsWith('font/') || FONT_EXTS.has(ext)) {
    return 'font'
  }
  return 'unknown'
}

/** Extracts all recognized media files (images, audio, pdf, font) from drop/file transfers. */
export function allMediaFilesFrom(data: DataTransfer | FileList | null | undefined): File[] {
  const files = data && 'files' in data ? Array.from(data.files) : data ? Array.from(data as FileList) : []
  return files.filter((f) => classifyFile(f) !== 'unknown')
}

