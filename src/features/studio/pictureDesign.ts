import type { LayeredJob } from './api'

/**
 * A new project that holds the drawn label as one picture, the size of the label. The picture remembers the job it came
 * from (`drawnLabelJob`), so the editor's top bar offers "Convert to editable" for it.
 */
export function pictureDocument(job: LayeredJob, title: string): Record<string, unknown> {
  const [targetW, targetH] = job.target_size ?? [job.width ?? 1, job.height ?? 1]
  const naturalW = job.width ?? targetW
  const naturalH = job.height ?? targetH
  const id = (): string => crypto.randomUUID()
  return {
    schemaVersion: 1,
    width: targetW,
    height: targetH,
    meta: { title, presetId: 'layered-label', unit: job.unit ?? 'px', dpi: 300 },
    pages: [
      {
        id: id(),
        name: 'Page 1',
        background: { type: 'solid', color: '#ffffff' },
        objects: [
          {
            id: id(),
            name: 'AI label picture',
            type: 'image',
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            width: naturalW,
            height: naturalH,
            scaleX: targetW / naturalW,
            scaleY: targetH / naturalH,
            src: job.artwork_url,
            drawnLabelJob: job.id,
            visible: true,
            locked: false,
          },
        ],
      },
    ],
  }
}

/** Whether the design has already been made editable: besides the picture there are layers on its page (the hidden texts and their patches). */
export function isMadeEditable(doc: { pages?: ReadonlyArray<{ objects?: ReadonlyArray<Record<string, unknown>> }> }): boolean {
  return (doc.pages ?? []).some((page) => (page.objects?.length ?? 0) > 1)
}

/** The Studio job a document's picture was drawn by, when it has one. */
export function drawnLabelJobOf(doc: { pages?: ReadonlyArray<{ objects?: ReadonlyArray<Record<string, unknown>> }> }): string | null {
  for (const page of doc.pages ?? []) {
    for (const object of page.objects ?? []) {
      if (typeof object.drawnLabelJob === 'string' && object.drawnLabelJob) return object.drawnLabelJob
    }
  }
  return null
}
