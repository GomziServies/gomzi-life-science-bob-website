import type { Design, Page, TemplateCategory, TemplateDetail, TemplateQuery, TemplateSummary } from '@/types/api'
import { http } from './client'
import { toList } from './pagination'

export interface VectorUploadResult {
  /** `success` with the design, or `processing` with a `job_id` to follow (a JPG or PNG is read in the background). */
  status: string
  title: string
  document?: Record<string, unknown>
  job_id?: string
  width?: number
  height?: number
  objects_count?: number
  /** What the import could not match exactly (PDF imports). */
  report?: { fontsMissing?: string[]; rasterLayers?: string[]; warnings?: string[] } | null
}

/** One file of a bulk upload, as the server reports it. */
export interface BulkJob {
  job_id: string
  status: 'queued' | 'designing' | 'done' | 'failed' | 'missing' | string
  progress?: number
  message?: string
  error?: string
  template?: { id: string; slug: string; title: string; published: boolean; category: string | null } | null
  info?: { via?: string; texts?: number } | null
}

export const templatesApi = {
  categories: async (signal?: AbortSignal): Promise<TemplateCategory[]> => toList(await http.get<TemplateCategory[] | Page<TemplateCategory>>('/template-categories/', { signal })),
  list: (query: TemplateQuery = {}, signal?: AbortSignal) => http.get<Page<TemplateSummary>>('/templates/', { query, signal }),
  get: (slug: string, signal?: AbortSignal) => http.get<TemplateDetail>(`/templates/${encodeURIComponent(slug)}/`, { signal }),
  /** Creates an account design from the template (login required). */
  use: (slug: string) => http.post<Design>(`/templates/${encodeURIComponent(slug)}/use/`),
  /** Adds many label files to the library at once (staff). Each file is read in the background; follow them with `bulkStatus`. */
  bulkUpload: (files: File[], options: { publish?: boolean } = {}) => {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    form.append('publish', options.publish === false ? '0' : '1')
    return http.post<{ jobs: { filename: string; job_id: string }[]; refused: { filename: string; message: string }[] }>('/templates/bulk-upload/', { form })
  },
  bulkStatus: (ids: string[], signal?: AbortSignal) => http.get<{ jobs: BulkJob[] }>('/templates/bulk-upload/status/', { query: { ids: ids.join(',') }, signal }),
  /** Uploads a CDR, PDF, or SVG packaging file and converts it natively to an editable Dory document. */
  uploadVector: (file: File, title?: string, options: { editableText?: boolean } = {}) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    // PDFs only: read text that was converted to outlines and make it live text again.
    form.append('editable_text', options.editableText === false ? '0' : '1')
    return http.post<VectorUploadResult>('/templates/upload-vector/', { form })
  },
}
