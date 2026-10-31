import { getLayeredDesign, makeLabelEditable } from '@/features/studio/api'
import { migrateDocument } from '../engine/migrations'

const POLL_MS = 1500

/**
 * Reads the AI-drawn picture of a design with our own text and object recognition and returns the editable document (the picture
 * stays whole, every text it holds is a live text layer). Used by the "Make editable" button and by the professional print PDF, which
 * needs real text to print. `onStep` hears what the server is doing and how far it is (0..100).
 */
export async function readPictureAsEditable(jobId: string, onStep: (message: string, percent: number) => void = () => undefined, signal?: AbortSignal): Promise<ReturnType<typeof migrateDocument>> {
  onStep('Starting…', 0)
  let job = await makeLabelEditable(jobId)
  while (job.status !== 'done' && job.status !== 'failed') {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
    onStep(job.stage_message || 'Working', job.progress)
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    job = await getLayeredDesign(job.id)
  }
  if (job.status === 'failed' || !job.document) throw new Error(job.error || 'The label could not be made editable.')
  // The picture keeps the link to the drawn label, so "Retry make editable" is still offered (the server also sets it).
  const pages = (job.document.pages ?? []) as Array<{ objects?: Array<Record<string, unknown>> }>
  const picture = pages[0]?.objects?.find((o) => o.type === 'image' && o.name === 'Picture') ?? pages[0]?.objects?.[0]
  if (picture && !picture.drawnLabelJob) picture.drawnLabelJob = jobId
  return migrateDocument(job.document as never)
}
