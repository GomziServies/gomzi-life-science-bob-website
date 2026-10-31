/**
 * Studio API client and TanStack Query hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type {
  Brief,
  BriefSpec,
  DesignVariant,
  GenerationJob,
  GenerationJobParams,
  LogoAsset,
} from './types'

export const STUDIO_QUERY_KEYS = {
  brief: (id: string) => ['studio', 'brief', id] as const,
  job: (id: string) => ['studio', 'job', id] as const,
}

export async function createBrief(data: {
  raw_text?: string
  files?: File[]
  extracted?: Partial<BriefSpec>
}): Promise<Brief> {
  if (data.files && data.files.length > 0) {
    const formData = new FormData()
    if (data.raw_text) {
      formData.append('raw_text', data.raw_text)
    }
    if (data.extracted) {
      formData.append('extracted', JSON.stringify(data.extracted))
    }
    data.files.forEach((f) => formData.append('files', f))
    return http.post<Brief>('/studio/briefs/', { form: formData })
  }
  return http.post<Brief>('/studio/briefs/', {
    json: {
      raw_text: data.raw_text || '',
      extracted: data.extracted,
    },
  })
}

export async function getBrief(id: string): Promise<Brief> {
  return http.get<Brief>(`/studio/briefs/${id}/`)
}

export async function extractBrief(id: string): Promise<BriefSpec> {
  return http.post<BriefSpec>(`/studio/briefs/${id}/extract/`)
}

export async function updateBrief(id: string, patch: { extracted?: Partial<BriefSpec>; raw_text?: string; confirmed?: boolean }): Promise<Brief> {
  return http.patch<Brief>(`/studio/briefs/${id}/`, { json: patch })
}

export async function confirmBrief(id: string): Promise<Brief> {
  return http.post<Brief>(`/studio/briefs/${id}/confirm/`)
}

/** `clean: false` keeps the logo exactly as uploaded; by default the server removes its background and makes it crisp and large. */
export async function uploadLogo(data: { file?: File; removeBackground?: boolean; clean?: boolean }): Promise<LogoAsset> {
  if (data.file) {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.removeBackground) {
      formData.append('remove_background', 'true')
    }
    if (data.clean === false) {
      formData.append('clean', '0')
    }
    return http.post<LogoAsset>('/studio/logos/', { form: formData })
  }
  return http.post<LogoAsset>('/studio/logos/', { json: { remove_background: data.removeBackground } })
}

/** Uploads a finished label the client likes. The server keeps it as a style reference: the AI copies its look, never its words. */
export async function uploadReference(file: File): Promise<{ file_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<{ file_url: string }>('/studio/references/', { form: formData })
}

export async function createGenerationJob(briefId: string, params: GenerationJobParams): Promise<GenerationJob> {
  return http.post<GenerationJob>('/studio/jobs/', {
    json: {
      brief_id: briefId,
      params,
    },
  })
}

export async function getGenerationJob(id: string): Promise<GenerationJob> {
  return http.get<GenerationJob>(`/studio/jobs/${id}/`)
}

export async function regenerateVariant(jobId: string, label: string, instructions = ''): Promise<DesignVariant> {
  return http.post<DesignVariant>(`/studio/jobs/${jobId}/variants/${label}/regenerate/`, {
    json: { instructions },
  })
}

export async function openVariant(variantId: string): Promise<{ design_id: string }> {
  return http.post<{ design_id: string }>(`/studio/variants/${variantId}/open/`)
}

// React Query Hooks
export function useBrief(id: string | null) {
  return useQuery({
    queryKey: STUDIO_QUERY_KEYS.brief(id || ''),
    queryFn: () => getBrief(id!),
    enabled: Boolean(id),
  })
}

export function useCreateBrief() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBrief,
    onSuccess: (brief) => {
      queryClient.setQueryData(STUDIO_QUERY_KEYS.brief(brief.id), brief)
    },
  })
}

export function useUpdateBrief() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateBrief>[1] }) =>
      updateBrief(id, patch),
    onSuccess: (brief) => {
      queryClient.setQueryData(STUDIO_QUERY_KEYS.brief(brief.id), brief)
    },
  })
}

export function useConfirmBrief() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => confirmBrief(id),
    onSuccess: (brief) => {
      queryClient.setQueryData(STUDIO_QUERY_KEYS.brief(brief.id), brief)
    },
  })
}

export function useUploadLogo() {
  return useMutation({
    mutationFn: uploadLogo,
  })
}

export function useCreateGenerationJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ briefId, params }: { briefId: string; params: GenerationJobParams }) =>
      createGenerationJob(briefId, params),
    onSuccess: (job) => {
      queryClient.setQueryData(STUDIO_QUERY_KEYS.job(job.id), job)
    },
  })
}

export function useGenerationJob(id: string | null, polling = false) {
  return useQuery({
    queryKey: STUDIO_QUERY_KEYS.job(id || ''),
    queryFn: () => getGenerationJob(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!polling) return false
      const status = query.state.data?.status
      if (status === 'done' || status === 'failed') return false
      return 1500
    },
  })
}

export function useOpenVariant() {
  return useMutation({
    mutationFn: (variantId: string) => openVariant(variantId),
  })
}

export interface DigitizeResult {
  status: string
  clean_background_url: string
  width: number
  height: number
  detected_count: number
  text_elements: Array<{
    text: string
    left: number
    top: number
    width: number
    height: number
    fontSize: number
    confidence: number
  }>
  document: any
  design_id?: string
}

export async function digitizeLabel(file: File, createDesign = true): Promise<DigitizeResult> {
  const formData = new FormData()
  formData.append('image', file)
  if (createDesign) {
    formData.append('create_design', 'true')
  }
  return http.post<DigitizeResult>('/studio/digitize/', { form: formData })
}

export function useDigitizeLabel() {
  return useMutation({
    mutationFn: ({ file, createDesign = true }: { file: File; createDesign?: boolean }) =>
      digitizeLabel(file, createDesign),
  })
}

/** The picture engine: which provider and model are set up, and (with `live`) whether the key works now. */
export interface PixapiStatus {
  configured: boolean
  provider?: string
  provider_label?: string
  masked_key: string
  base_url: string
  model: string
  model_label?: string
  size?: string
  quality?: string
  timeout_seconds?: number
  live?: { ok: boolean; checked: boolean; credit_left?: number | null; credit_limit?: number | null; used?: number | null; error?: string }
}

export async function getPixapiStatus(live = false): Promise<PixapiStatus> {
  return http.get<PixapiStatus>('/studio/image/status/', { query: live ? { live: '1' } : undefined })
}

export function usePixapiStatus() {
  return useQuery({
    queryKey: ['studio', 'pixapi', 'status'],
    queryFn: () => getPixapiStatus(true),
    staleTime: 60_000,
  })
}

export function getVariantCdrxDownloadUrl(variantId: string): string {
  return `/api/v1/studio/variants/${variantId}/export-cdrx/`
}

export async function generateStudioImage(params: {
  prompt: string
  size?: string
  model?: string
}): Promise<{ image_url: string; status?: string }> {
  return http.post<{ image_url: string; status?: string }>('/studio/image/generate/', {
    json: params,
  })
}

export interface LayeredRequest {
  prompt: string
  width: number
  height: number
  brand_name?: string
  product_name?: string
  flavor?: string
  /**
   * The user's own texts (ingredients, directions, warnings, address, nutrition lines...). The small print in the
   * artwork is replaced with these exact words, so it is never misspelt.
   */
  copy?: Record<string, string | string[]>
  /** The label's real size in CSS pixels (96 per inch) and the unit to show it in; the design is sized to this. */
  target_width?: number
  target_height?: number
  unit?: 'px' | 'mm' | 'in'
  /** "auto" draws a wide label panel by panel (sharper small print); "off" draws it in one piece. */
  panels?: 'auto' | 'off'
  /** The print bleed in millimetres; recorded in the design so the editor's print export uses it. */
  bleed_mm?: number
  /** Save the result as a new design so it can be opened right away. */
  create_design?: boolean
  /** `image` draws the finished label and proofreads it (no layers yet); `layers` (default) also makes it editable. */
  mode?: 'image' | 'layers'
  /** The one-box flow: the words are expanded into a full brief and the picture is drawn whole (no panels, no sections of the studio's own). */
  simple?: boolean
  /** The client's own lines every label carries (they differ from client to client): marketed by (name and address), customer care number, email. */
  marketed_by?: string
  customer_care?: string
  email?: string
  /** A product of the company's range (see `getStudioProducts`): its fixed texts (FSSAI, manufacturer, standard blocks) are copied, not written. */
  product?: string
  /** A wide design drawn as three matched panels (the centre first, then each side around it) and joined into one picture. */
  seamless?: boolean
  /** The size as the user wrote it ("454 x 142 mm"), told to the brief writer. */
  size_label?: string
  /** The user's uploaded logo (a /media/ address). It is laid on the label exactly as uploaded; the AI never draws it. */
  logo_url?: string
  /** A finished label the client likes (a /media/studio/references/ address): its look is copied, never its words. */
  style_reference?: string
}

export interface CriticIssue {
  kind: string
  severity: 'error' | 'warn' | 'info'
  message: string
  object_id?: string | null
  fixed: boolean
}

export interface ReviewItem {
  severity: 'error' | 'warn' | 'info'
  kind: string
  message: string
  object_id: string | null
  name: string | null
}

/** What still needs a person before the label goes to print. */
export interface LabelReview {
  score: number
  ready: boolean
  counts: { error: number; warn: number; info: number }
  items: ReviewItem[]
  bleed_mm: number
}

/** What the proofread of a drawn label found, compared with the user's own words. */
export interface LabelProof {
  lines_read: number
  /** Lines whose spelling is not the user's: what is drawn, what the user wrote, and where (picture pixels). */
  issues: Array<{ found: string; expected: string; x: number; y: number; w: number; h: number }>
  issue_count: number
  /** For each text the user gave: the words that appear nowhere in the drawing. */
  missing: Array<{ key: string; words: number; missing: string[]; missing_count: number }>
  missing_count: number
  words_checked: number
  clean: boolean
}

export interface LayeredJob {
  id: string
  /** `image`: the label was drawn and proofread, not yet split into layers. */
  mode?: 'image' | 'layers'
  /** For a drawn label: the picture itself and its proofread. */
  artwork_url?: string
  proof?: LabelProof
  /** Sections the user left out that were written for the product (about, ingredients, directions, nutrition...). */
  suggested?: Record<string, string>
  /** Names or looks of other people's characters that were swapped for original ones before drawing (they make the image model refuse). */
  renamed?: string[]
  /** The label's real size (CSS pixels) and the unit it is shown in, for a drawn label. */
  target_size?: [number, number] | null
  unit?: 'px' | 'mm' | 'in'
  status: 'queued' | 'designing' | 'done' | 'failed' | string
  progress: number
  stage_message: string
  error: string
  design_id: string | null
  /** The fields below arrive once `status` is `done`. */
  report?: { score: number; passed: boolean; critique_notes: string[]; fixes_applied: string[] }
  issues?: CriticIssue[]
  layers?: { text: number; shapes: number; cutouts: number; /** Flat cut-outs traced into vector icons. */ vectors?: number }
  /** Words the artwork misspelled that were fixed from the brief. */
  corrections?: Array<{ before: string; after: string }>
  /** Which of the user's texts were set into which blocks of the artwork, and which found no block. */
  typeset?: { placed: Array<{ key: string; before: string; after: string; font_size: number; lines: number; how: string }>; unplaced: string[] }
  width?: number
  height?: number
  /** The finished design (a Doory document) and the picture it was made from. */
  document?: Record<string, unknown>
  source_image_url?: string
  /** The panels a wide label was drawn in, left to right (empty when it was drawn whole). */
  panels?: Array<{ role: string; label: string; x: number; width: number }>
  review?: LabelReview | null
}

export function startLayeredDesign(body: LayeredRequest): Promise<LayeredJob> {
  return http.post<LayeredJob>('/studio/layered/', { json: body })
}

/** Turns a drawn label into editable layers. It reads the picture that was shown; nothing is drawn (or paid for) again. */
export function makeLabelEditable(id: string): Promise<LayeredJob> {
  return http.post<LayeredJob>(`/studio/layered/${id}/editable/`, { json: {} })
}

/** The drawn label a saved editable design was made from, or null when it is not known. */
export async function drawnJobOfDesign(designId: string): Promise<string | null> {
  const { job_id } = await http.get<{ job_id: string | null }>(`/studio/designs/${designId}/drawn-job/`)
  return job_id
}

/** One product of the company's range: its real banner size (from the old labels) and the order of its three zones. */
export interface StudioProduct {
  id: string
  label: string
  family: string
  width_mm: number
  height_mm: number
  bleed_mm: number
  pack: string
  zones: 'info-hero-facts' | 'facts-hero-info'
}

export interface StudioProducts {
  products: StudioProduct[]
  /** The details printed on every label (manufacturer, address, FSSAI number). */
  company: { manufacturer: string; address: string; fssai: string }
}

export function getStudioProducts(): Promise<StudioProducts> {
  return http.get<StudioProducts>('/studio/products/')
}

export function useStudioProducts() {
  return useQuery({ queryKey: ['studio', 'products'], queryFn: getStudioProducts, staleTime: 60 * 60 * 1000 })
}

/** A text of a design that is almost (but not exactly) one of the company's fixed texts, and what the library says instead. */
export interface LibraryFix {
  id: string
  text: string
  replacement: string
  ratio: number
}

/** Asks which texts are misreadings of the product's fixed texts. Changes nothing: the editor applies what it is told to. */
export function suggestLibraryFixes(body: { product: string; flavour?: string; texts: { id: string; text: string }[] }): Promise<{ fixes: LibraryFix[] }> {
  return http.post<{ fixes: LibraryFix[] }>('/studio/fix-text/', { json: body })
}

export function getLayeredDesign(id: string): Promise<LayeredJob> {
  return http.get<LayeredJob>(`/studio/layered/${id}/`)
}

export async function rewriteStudioText(params: {
  text: string
  instruction?: string
}): Promise<{ suggestions: string[] }> {
  return http.post<{ suggestions: string[] }>('/studio/text/rewrite/', {
    json: params,
  })
}

