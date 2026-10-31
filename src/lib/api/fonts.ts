import type { FontFamily, FontQuery, Page, UserFontUploadInput, UserFontUploadOptions } from '@/types/api'
import { http, resolveMediaUrl } from './client'

/**
 * Variant files come back as same-origin `/media/fonts/…` paths. FontFace resolves a relative URL
 * against the page, so point them at the media host before anything downstream uses them.
 */
function withResolvedFiles(family: FontFamily): FontFamily {
  if (!Array.isArray(family.variants)) return family
  return {
    ...family,
    variants: family.variants.map((variant) => ({
      ...variant,
      url: resolveMediaUrl(variant.url),
      subsets: Array.isArray(variant.subsets) ? variant.subsets.map((s) => ({ ...s, url: resolveMediaUrl(s.url) })) : variant.subsets,
    })),
  }
}

/** A user can keep 50 families (50 per page), so one page is the norm; the loop only guards against a change of limits. */
const MAX_MINE_PAGES = 10
/** The catalogue has a few hundred families (a few thousand with `sync_fonts --all`); 100 per page, so this stops at 5000. */
const MAX_CATALOGUE_PAGES = 50

export const fontsApi = {
  list: async (query: FontQuery = {}, signal?: AbortSignal): Promise<Page<FontFamily>> => {
    const result = await http.get<Page<FontFamily>>('/fonts/', { query: { ordering: 'popularity', ...query }, signal })
    return { ...result, results: result.results.map(withResolvedFiles) }
  },
  /** Every family of the catalogue, by name (all pages, for a list the user picks from). */
  all: async (signal?: AbortSignal): Promise<FontFamily[]> => {
    const families: FontFamily[] = []
    for (let page = 1; page <= MAX_CATALOGUE_PAGES; page++) {
      const result = await http.get<Page<FontFamily>>('/fonts/', { query: { ordering: 'family', page, page_size: 100 }, signal })
      families.push(...result.results.map(withResolvedFiles))
      if (!result.next) break
    }
    return families
  },
  /** Every family the signed-in user has uploaded. */
  mine: async (signal?: AbortSignal): Promise<FontFamily[]> => {
    const families: FontFamily[] = []
    for (let page = 1; page <= MAX_MINE_PAGES; page++) {
      const result = await http.get<Page<FontFamily>>('/fonts/mine/', { query: { page }, signal })
      families.push(...result.results.map(withResolvedFiles))
      if (!result.next) break
    }
    return families
  },
  upload: (input: UserFontUploadInput, options: UserFontUploadOptions = {}) => {
    const form = new FormData()
    for (const file of input.files) form.append('files', file, file.name)
    if (input.family) form.append('family', input.family)
    if (input.category) form.append('category', input.category)
    return http.post<FontFamily>('/fonts/mine/', { form, signal: options.signal, onUploadProgress: options.onProgress }).then(withResolvedFiles)
  },
  removeMine: (id: string) => http.delete<void>(`/fonts/mine/${id}/`),
}
