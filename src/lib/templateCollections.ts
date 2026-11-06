/**
 * Template collections: groups of templates the gallery shows as a category of their own, although the server keeps them
 * inside another category. Each is a server category narrowed by the templates' preset.
 *
 * Peanut butter: its cup labels (the curved wrap with the round lid sticker) sit in "Food & Drink Labels" next to honey,
 * coffee and drink labels; they are the ones made with the layered-label preset.
 */
export interface TemplateCollection {
  /** The slug the gallery and the shop use for it, as if it were a category (?category=peanut-butter). */
  slug: string
  name: string
  /** The server category its templates are in, and the preset that picks them out. */
  category: string
  preset?: string
}

export const TEMPLATE_COLLECTIONS: readonly TemplateCollection[] = [{ slug: 'peanut-butter', name: 'Peanut Butter', category: 'food-labels', preset: 'layered-label' }]

export const collectionBySlug = (slug: string | null | undefined): TemplateCollection | undefined => TEMPLATE_COLLECTIONS.find((c) => c.slug === slug)

/** The collection a template belongs to (its server category and preset match one), if any. */
export const collectionOf = (template: { category?: { slug: string } | null; preset?: string | null }): TemplateCollection | undefined =>
  TEMPLATE_COLLECTIONS.find((c) => c.category === template.category?.slug && (!c.preset || c.preset === template.preset))

/** The server's filter for a category slug: a collection becomes its category and preset, any other slug is a category as it is. */
export function categoryFilter(slug: string | null | undefined): { category?: string; preset?: string } {
  const collection = collectionBySlug(slug)
  if (collection) return { category: collection.category, ...(collection.preset ? { preset: collection.preset } : {}) }
  return slug ? { category: slug } : {}
}
