import { Link } from 'react-router-dom'
import { Badge, Thumbnail } from '@/ui'
import type { TemplateSummary } from '@/types/api'
import { resolveMediaUrl } from '@/lib/api/client'
import styles from './TemplateCard.module.css'

/** `frame` gives every card the same thumbnail box (the template sits inside it), for an even row; without it the card takes the template's own shape. */
export function TemplateCard({ template, to, frame }: { template: TemplateSummary; to?: string; frame?: number }) {
  const aspect = template.width > 0 && template.height > 0 ? template.width / template.height : 1
  const primaryThumb = template.thumbnail_url ? resolveMediaUrl(template.thumbnail_url) : ''
  const fallbackThumb = template.preview_url
    ? resolveMediaUrl(template.preview_url)
    : template.slug
      ? resolveMediaUrl(`/media/templates/previews/${encodeURIComponent(template.slug)}.webp`)
      : ''

  return (
    <Link to={to ?? `/templates/${template.slug}`} className={styles.card}>
      <Thumbnail
        src={primaryThumb || fallbackThumb}
        fallbackSrc={primaryThumb && fallbackThumb && primaryThumb !== fallbackThumb ? fallbackThumb : undefined}
        alt={`${template.title} template preview`}
        aspect={frame ?? Math.min(Math.max(aspect, 0.5), 2)}
        fit={frame ? 'contain' : 'cover'}
        className={styles.thumb}
      />
      <span className={styles.meta}>
        <span className={styles.title}>{template.title}</span>
        <span className={styles.sub}>
          {template.category ? <Badge>{template.category.name}</Badge> : null}
          <span className={styles.size}>
            {template.width} × {template.height}
          </span>
        </span>
      </span>
    </Link>
  )
}
