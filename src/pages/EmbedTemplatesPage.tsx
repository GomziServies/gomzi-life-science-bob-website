import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { TemplatesBrowser } from '@/features/templates/TemplatesBrowser'
import { usePageMeta } from '@/lib/usePageMeta'
import type { TemplateSummary } from '@/types/api'
import aiStyles from './EmbedTemplatesPage.module.css'
import styles from './TemplatesPage.module.css'

/**
 * `/embed/templates`: the template gallery for another site's iframe (the banner website). Same browser as `/templates`,
 * but a card opens the template in `/embed/editor`, and "Generate with AI" leads to `/embed/studio`.
 *   ?product=<id>&name=<product name>&brand=<brand>&tag=<tagline>   carried on to the editor and the studio
 *   ?category=<slug>&q=<words>                                      the opening filter (the visitor can change it)
 */
export default function EmbedTemplatesPage() {
  usePageMeta({ title: 'Choose a banner template', noindex: true })
  const [params] = useSearchParams()
  // The browser rewrites the query string while filtering, so the product is read once.
  const [carry] = useState(() => {
    const keep = new URLSearchParams()
    for (const key of ['product', 'name', 'brand', 'tag']) if (params.get(key)) keep.set(key, params.get(key)!)
    return keep
  })
  const name = carry.get('name')

  const editorHref = (template: TemplateSummary) => `/embed/editor?${new URLSearchParams({ ...Object.fromEntries(carry), template: template.slug })}`

  return (
    <div className={styles.page}>
      <div className={aiStyles.head}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Your banner</p>
          <h1 className={styles.title}>{name ? `Choose a design for ${name}` : 'Choose a design'}</h1>
          <p className={styles.lead}>Open a template to change your logo, text and colours. Not what you wanted? Let our AI design it for you.</p>
        </header>
        <aside className={aiStyles.ai} aria-label="Generate with AI">
          <b>Want something new?</b>
          <span>Describe your banner and our AI studio will draw it. You can edit everything afterwards.</span>
          <Link className={aiStyles.aiButton} to="/studio/new">
            <Sparkles size={18} aria-hidden />
            Generate with AI
          </Link>
        </aside>
      </div>
      <TemplatesBrowser templateTo={editorHref} />
    </div>
  )
}
