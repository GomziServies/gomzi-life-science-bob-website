import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DesignTile } from '@/features/dashboard/DesignTile'
import fgLogo from '@/assets/fg_group.webp'
import { createUrl, getPreset, presetParts, QUICK_PRESET_IDS } from '@/features/presets'
import { TemplateCard } from '@/features/templates/TemplateCard'
import { useDesignsList, useTemplatesList } from '@/lib/api/hooks'
import { usePageTitle } from '@/lib/usePageTitle'
import { Button, EmptyState, Skeleton } from '@/ui'
import styles from './pageStyles.module.css'
import homeStyles from './HomePage.module.css'

function TileSkeletons({ count }: { count: number }) {
  return (
    <ul className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.skeletonCard}>
          <Skeleton height="10rem" radius="var(--radius-lg)" />
          <Skeleton width="60%" height={16} />
        </li>
      ))}
    </ul>
  )
}

export default function HomePage() {
  usePageTitle('Home')
  const recent = useDesignsList({ ordering: '-updated_at', page_size: 8 })
  const starred = useDesignsList({ starred: true, ordering: '-updated_at', page_size: 4 })
  const templates = useTemplatesList({ page_size: 8 })
  const recentItems = recent.data?.pages[0]?.results ?? []
  const starredItems = starred.data?.pages[0]?.results ?? []
  const templateItems = templates.data?.pages[0]?.results ?? []

  return (
    <div className={styles.page}>
      <section aria-labelledby="quick-create" className={homeStyles.hero}>
        <div className={homeStyles.heroHead}>
          <h1 id="quick-create" className={homeStyles.heroTitle}>
            Create a design
          </h1>
          <div className={homeStyles.heroLinks}>
            <Link to="/studio/new" className={homeStyles.studioPill} id="hero-ai-studio-btn">
              <Sparkles size={16} aria-hidden="true" />
              <span>AI Packaging Studio</span>
            </Link>
            <Link to="/create">Custom size</Link>
            <Link to="/dashboard/templates">Start from a template</Link>
          </div>
        </div>
        <ul className={homeStyles.chips}>
          {QUICK_PRESET_IDS.map((id) => {
            const preset = getPreset(id)
            if (!preset) return null
            const { name, detail } = presetParts(preset)
            const wide = preset.width >= preset.height
            return (
              <li key={id}>
                <Link to={createUrl({ presetId: id })} className={homeStyles.chip}>
                  <span className={homeStyles.shapeBox} aria-hidden="true">
                    <span className={homeStyles.shape} style={{ aspectRatio: `${preset.width} / ${preset.height}`, ...(wide ? { width: '100%' } : { height: '100%' }) }} />
                  </span>
                  <span className={homeStyles.chipName}>{name}</span>
                  <span className={homeStyles.chipSize}>{detail}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <img className={homeStyles.bunny} src={fgLogo} alt="FG Group" width={320} height={320} draggable={false} />
      </section>

      {/* Direct AI Packaging Studio Launch Banner */}
      <section aria-label="AI Packaging Studio" className={homeStyles.studioBanner}>
        <div className={homeStyles.studioBannerContent}>
          <div className={homeStyles.studioBadge}>
            <Sparkles size={14} aria-hidden="true" />
            <span>AI Studio</span>
          </div>
          <h2 className={homeStyles.studioBannerTitle}>
            AI Packaging & Supplement Studio
          </h2>
          <p className={homeStyles.studioBannerText}>
            Direct 3D wrap dielines, automated logo background removal, multi-language prompt translation, and label photo OCR digitization.
          </p>
        </div>
        <div className={homeStyles.studioBannerActions}>
          <Link to="/studio/new" className={homeStyles.studioDirectBtn} id="dashboard-direct-studio-btn">
            <Sparkles size={18} aria-hidden="true" />
            <span>Launch Studio</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="recent" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 id="recent" className={styles.sectionTitle}>
            Recent designs
          </h2>
          <Link to="/dashboard/designs">View all</Link>
        </div>
        {recent.isPending ? (
          <TileSkeletons count={4} />
        ) : recent.isError ? (
          <EmptyState compact title="Your designs didn’t load" role="alert" action={<Button onClick={() => void recent.refetch()}>Try again</Button>} />
        ) : recentItems.length === 0 ? (
          <p className={homeStyles.none}>Designs you make show up here.</p>
        ) : (
          <ul className={`${styles.grid} ${styles.row}`}>
            {recentItems.map((design) => (
              <li key={design.id}>
                <DesignTile design={design} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {starredItems.length > 0 ? (
        <section aria-labelledby="starred" className={styles.section}>
          <h2 id="starred" className={styles.sectionTitle}>
            Starred
          </h2>
          <ul className={styles.grid}>
            {starredItems.map((design) => (
              <li key={design.id}>
                <DesignTile design={design} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {templateItems.length > 0 ? (
        <section aria-labelledby="start-template" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 id="start-template" className={styles.sectionTitle}>
              Start from a template
            </h2>
            <Link to="/dashboard/templates" className={homeStyles.more}>
              Browse templates <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul className={`${styles.grid} ${styles.row}`}>
            {templateItems.map((template) => (
              <li key={template.id}>
                <TemplateCard template={template} frame={4 / 3} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
