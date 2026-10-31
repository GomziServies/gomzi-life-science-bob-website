import {
  CloudUpload,
  Image as ImageIcon,
  Music,
  Pause,
  Play,
  Plus,
  Replace,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import type { AssetRef } from '@/types/adapter'
import type { Asset } from '@/types/api'
import { formatSeconds } from '../animation/timelineMath'
import { audioRuntime, usePreview } from '../audio/runtime'
import { uploadsOf, useUploads } from '../audio/uploads'
import { useEditor, useEditorState, useEditorStateShallow } from '../context'
import { ALL_UPLOAD_ACCEPT, allMediaFilesFrom } from '../engine/files'
import { useAsyncList } from '../hooks/useAsyncList'
import { useDebounced } from '../hooks/useDebounced'
import { useResolvedSrc } from '../hooks/useResolvedSrc'
import type { PanelProps } from '../panels/registry'
import { Skeleton } from '../ui/Skeleton'
import { t } from '../strings'
import { uploadUniversalFiles } from './uploads'
import styles from './UploadsDrawer.module.css'

type UploadTab = 'all' | 'images' | 'audio'

function formatBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

function assetExtension(name: string, kind: string): string {
  const dot = name.lastIndexOf('.')
  if (dot >= 0) {
    const ext = name.slice(dot + 1).toUpperCase()
    if (ext.length <= 4) return ext
  }
  return kind.toUpperCase()
}

/** Unified asset reference for universal list rendering. */
interface UnifiedItem {
  id: string
  name: string
  kind: 'image' | 'svg' | 'audio'
  url: string
  thumbUrl: string
  width: number
  height: number
  durationMs?: number | null
  size?: number
  assetRef: AssetRef
}

function toUnifiedItem(a: Asset): UnifiedItem {
  const ref: AssetRef = {
    id: a.id,
    url: a.url,
    thumbUrl: a.thumb_url,
    width: a.width,
    height: a.height,
    name: a.name,
    kind: a.kind,
  }
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    url: a.url,
    thumbUrl: a.thumb_url,
    width: a.width,
    height: a.height,
    durationMs: a.duration_ms ?? null,
    size: a.size,
    assetRef: ref,
  }
}

/** Image card with responsive thumbnail, format badge, and quick hover actions. */
function ImageCard({
  item,
  canReplace,
  onPlace,
  onReplace,
  onDelete,
}: {
  item: UnifiedItem
  canReplace: boolean
  onPlace: () => void
  onReplace: () => void
  onDelete?: () => void
}) {
  const url = useResolvedSrc(item.thumbUrl || item.url)
  const ext = assetExtension(item.name, item.kind)

  const onDragStart = (e: React.DragEvent): void => {
    e.dataTransfer.setData('application/x-doory-asset', JSON.stringify(item.assetRef))
    e.dataTransfer.setData('text/plain', item.name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={onDragStart}
      onClick={onPlace}
      title={`${item.name} · ${t.uploadsDrawer.dragHint}`}
      data-testid={`upload-card-${item.id}`}
    >
      {url ? (
        <img src={url} alt={item.name} className={styles.cardImage} draggable={false} loading="lazy" />
      ) : (
        <Skeleton width="100%" height="100%" radius={8} />
      )}
      <span className={styles.cardTypeBadge}>{ext}</span>
      <div className={styles.cardOverlay}>
        <div className={styles.cardTopActions}>
          {canReplace ? (
            <button
              type="button"
              className={styles.cardBtn}
              title={t.uploadsDrawer.replaceImage}
              aria-label={t.uploadsDrawer.replaceImage}
              onClick={(e) => {
                e.stopPropagation()
                onReplace()
              }}
            >
              <Replace size={13} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.cardBtn}
            title={t.uploadsDrawer.addToPage}
            aria-label={t.uploadsDrawer.addToPage}
            onClick={(e) => {
              e.stopPropagation()
              onPlace()
            }}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
          {onDelete ? (
            <button
              type="button"
              className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
              title={t.uploadsDrawer.deleteConfirm}
              aria-label={t.uploadsDrawer.deleteConfirm}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className={styles.cardBottomInfo} title={item.name}>
          {item.name}
        </div>
      </div>
    </div>
  )
}

/** Audio row with live preview playback and insertion into timeline or page. */
function AudioRow({
  item,
  onAdd,
  onDelete,
}: {
  item: UnifiedItem
  onAdd: (scope: 'design' | 'page') => void
  onDelete?: () => void
}) {
  const editor = useEditor()
  const { previewer } = audioRuntime(editor)
  const preview = usePreview()
  const key = `up:${item.id}`
  const playing = preview.key === key && preview.status === 'playing'

  const togglePlay = (e: React.MouseEvent): void => {
    e.stopPropagation()
    void previewer.toggle(key, () => editor.assets.resolve(item.url), {
      durationMs: item.durationMs ?? 0,
    })
  }

  return (
    <li className={styles.audioRow} data-testid={`audio-row-${item.id}`}>
      <button
        type="button"
        className={styles.audioPlayBtn}
        data-playing={playing || undefined}
        title={playing ? t.uploadsDrawer.pausePreview : t.uploadsDrawer.playPreview}
        aria-label={playing ? t.uploadsDrawer.pausePreview : t.uploadsDrawer.playPreview}
        onClick={togglePlay}
      >
        {playing ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
      </button>
      <div className={styles.audioBody}>
        <span className={styles.audioName} title={item.name}>
          {item.name}
        </span>
        <span className={styles.audioMeta}>
          {item.durationMs ? formatSeconds(item.durationMs) : 'Audio'}
          {item.size ? ` · ${formatBytes(item.size)}` : ''}
        </span>
      </div>
      <div className={styles.audioActions}>
        <button
          type="button"
          className={styles.actionBtn}
          title={t.uploadsDrawer.addToDesign}
          onClick={() => onAdd('design')}
        >
          <Plus size={12} aria-hidden="true" />
          <span>Design</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          title={t.uploadsDrawer.addToPage}
          onClick={() => onAdd('page')}
        >
          <Plus size={12} aria-hidden="true" />
          <span>Page</span>
        </button>
        {onDelete ? (
          <button
            type="button"
            className={styles.deleteIconBtn}
            title={t.uploadsDrawer.deleteConfirm}
            aria-label={t.uploadsDrawer.deleteConfirm}
            onClick={onDelete}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </li>
  )
}

/**
 * Universal Uploads Drawer: upload anything (images, SVG, audio, vectors) via drag & drop or manual file picker,
 * browse your media library with real-time classification, instant preview, and one-click insertion.
 */
export function UploadsDrawer({ close }: PanelProps) {
  const editor = useEditor()
  const readOnly = useEditorState((s) => s.readOnly)
  const uploading = useEditorState((s) => s.uploading)
  const imageSession = useEditorStateShallow((s) => s.uploads)
  const audioSession = useUploads()

  const [tab, setTab] = useState<UploadTab>('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query.trim().toLowerCase(), 250)
  const [over, setOver] = useState(false)
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchInputId = useId()

  // Fetch images & audio from user library
  const imageLibrary = useAsyncList<Asset>(
    (page) => editor.adapter.services.assets.list({ page, page_size: 24 }),
    'universal-images',
  )
  const audioLibrary = useAsyncList<Asset>(
    (page) => editor.adapter.services.assets.list({ kind: 'audio', page, page_size: 24 }),
    'universal-audio',
  )

  // Session image items
  const sessionImages: UnifiedItem[] = useMemo(
    () =>
      imageSession.map((u) => ({
        id: u.id,
        name: u.name,
        kind: u.kind,
        url: u.url,
        thumbUrl: u.thumbUrl,
        width: u.width,
        height: u.height,
        assetRef: u,
      })),
    [imageSession],
  )

  // Session audio items
  const sessionAudios: UnifiedItem[] = useMemo(
    () =>
      audioSession.items.map((item) => ({
        id: item.ref.id,
        name: item.ref.name,
        kind: 'audio',
        url: item.ref.url,
        thumbUrl: '',
        width: 0,
        height: 0,
        durationMs: item.durationMs,
        size: item.size,
        assetRef: item.ref,
      })),
    [audioSession.items],
  )

  // Combine and deduplicate
  const imageItems = useMemo(() => {
    const sessionIds = new Set(sessionImages.map((i) => i.id))
    const serverItems = imageLibrary.items
      .filter((a) => !sessionIds.has(a.id))
      .map(toUnifiedItem)
    return [...sessionImages, ...serverItems].filter((i) => !removed.has(i.id))
  }, [sessionImages, imageLibrary.items, removed])

  const audioItems = useMemo(() => {
    const sessionIds = new Set(sessionAudios.map((i) => i.id))
    const serverItems = audioLibrary.items
      .filter((a) => !sessionIds.has(a.id))
      .map(toUnifiedItem)
    return [...sessionAudios, ...serverItems].filter((i) => !removed.has(i.id))
  }, [sessionAudios, audioLibrary.items, removed])

  // Filtered by search query
  const filteredImages = useMemo(
    () => (debouncedQuery ? imageItems.filter((i) => i.name.toLowerCase().includes(debouncedQuery)) : imageItems),
    [imageItems, debouncedQuery],
  )

  const filteredAudios = useMemo(
    () => (debouncedQuery ? audioItems.filter((i) => i.name.toLowerCase().includes(debouncedQuery)) : audioItems),
    [audioItems, debouncedQuery],
  )

  // Actions
  const handleUploadFiles = useCallback(
    async (files: readonly File[]) => {
      if (files.length === 0) return
      await uploadUniversalFiles(editor, files)
    },
    [editor],
  )

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) void handleUploadFiles(files)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent): void => {
    setOver(false)
    const files = allMediaFilesFrom(e.dataTransfer)
    if (files.length === 0) return
    e.preventDefault()
    void handleUploadFiles(files)
  }

  const placeImage = (item: UnifiedItem): void => {
    void editor.insert.imageFromAsset(item.assetRef)
    close()
  }

  const replaceImage = (item: UnifiedItem): void => {
    void editor.insert.replaceSelectedImage(item.assetRef)
    close()
  }

  const addAudio = (item: UnifiedItem, scope: 'design' | 'page'): void => {
    void (async () => {
      try {
        const duration = item.durationMs ?? (await editor.audio.measure(item.assetRef))
        const target =
          scope === 'design'
            ? ({ type: 'design' } as const)
            : ({ type: 'page', pageId: editor.state.activePageId } as const)
        editor.audio.addFromAsset(item.assetRef, 'upload', duration, target)
        editor.toast(`Added audio to ${scope === 'design' ? 'design' : 'page'}`, 'info')
      } catch {
        editor.toast('Could not read audio file', 'error')
      }
    })()
  }

  const removeAsset = async (item: UnifiedItem): Promise<void> => {
    try {
      await editor.adapter.services.assets.remove(item.id)
      setRemoved((prev) => new Set(prev).add(item.id))
      if (item.kind === 'audio') {
        uploadsOf(editor).remove(item.id)
      }
      editor.toast(t.uploadsDrawer.deleted, 'info')
    } catch {
      editor.toast(t.uploadsDrawer.deleteFailed, 'error')
    }
  }

  // Active canvas selection allows replacing if an image is selected
  const activeView = editor.activeView()
  const isImageSelected = Boolean(activeView && activeView.selectedObjects()[0]?.type === 'image')

  return (
    <div className={styles.container} data-testid="universal-uploads-drawer">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALL_UPLOAD_ACCEPT}
        hidden
        aria-label={t.uploadsDrawer.uploadFiles}
        data-testid="universal-file-input"
        onChange={onFileInputChange}
      />

      {/* Prominent Canva-Style Primary Action Button */}
      {!readOnly && (
        <button
          type="button"
          className={styles.uploadAction}
          data-testid="btn-upload-files"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>{t.uploadsDrawer.uploadFiles}</span>
        </button>
      )}

      {/* Universal Drag & Drop Zone */}
      {!readOnly && (
        <button
          type="button"
          className={styles.dropZone}
          data-over={over || undefined}
          data-testid="universal-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes('Files')) return
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <div className={styles.dropZoneIcon}>
            <CloudUpload size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className={styles.dropZoneTitle}>{t.uploadsDrawer.dropHere}</span>
          <span className={styles.dropZoneSub}>{t.uploadsDrawer.orBrowse}</span>
          <div className={styles.formatBadges}>
            <span className={styles.formatBadge}>PNG</span>
            <span className={styles.formatBadge}>JPG</span>
            <span className={styles.formatBadge}>SVG</span>
            <span className={styles.formatBadge}>WEBP</span>
            <span className={styles.formatBadge}>MP3</span>
            <span className={styles.formatBadge}>WAV</span>
            <span className={styles.formatBadge}>PDF</span>
          </div>
        </button>
      )}

      {/* Uploading Status Banner */}
      {uploading > 0 && (
        <div className={styles.statusBanner} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <span>{t.uploadsDrawer.uploading(uploading)}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className={styles.searchBox}>
        <Search size={14} className={styles.searchIcon} aria-hidden="true" />
        <input
          id={searchInputId}
          type="search"
          className={styles.searchInput}
          placeholder={t.uploadsDrawer.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="uploads-search-input"
        />
        {query ? (
          <button
            type="button"
            className={styles.clearSearch}
            aria-label="Clear search"
            onClick={() => setQuery('')}
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Upload categories">
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'all'}
          data-testid="tab-uploads-all"
          onClick={() => setTab('all')}
        >
          {t.uploadsDrawer.tabs.all} ({filteredImages.length + filteredAudios.length})
        </button>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'images'}
          data-testid="tab-uploads-images"
          onClick={() => setTab('images')}
        >
          {t.uploadsDrawer.tabs.images} ({filteredImages.length})
        </button>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'audio'}
          data-testid="tab-uploads-audio"
          onClick={() => setTab('audio')}
        >
          {t.uploadsDrawer.tabs.audio} ({filteredAudios.length})
        </button>
      </div>

      {/* Media Content */}
      {/* Tab: Images or All */}
      {(tab === 'images' || tab === 'all') && filteredImages.length > 0 && (
        <>
          {tab === 'all' && (
            <p style={{ margin: '4px 0 -4px', fontSize: 11, fontWeight: 600, color: 'var(--ed-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Images & Graphics
            </p>
          )}
          <div className={styles.imageGrid} data-testid="uploads-image-grid">
            {filteredImages.map((img) => (
              <ImageCard
                key={img.id}
                item={img}
                canReplace={isImageSelected}
                onPlace={() => placeImage(img)}
                onReplace={() => replaceImage(img)}
                onDelete={!readOnly ? () => void removeAsset(img) : undefined}
              />
            ))}
          </div>
          {imageLibrary.hasMore && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={imageLibrary.loadMore}
              disabled={imageLibrary.loading}
            >
              {t.uploadsDrawer.loadMore}
            </button>
          )}
        </>
      )}

      {/* Tab: Audio or All */}
      {(tab === 'audio' || tab === 'all') && filteredAudios.length > 0 && (
        <>
          {tab === 'all' && (
            <p style={{ margin: '10px 0 -2px', fontSize: 11, fontWeight: 600, color: 'var(--ed-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Audio Tracks
            </p>
          )}
          <ul className={styles.audioList} data-testid="uploads-audio-list">
            {filteredAudios.map((aud) => (
              <AudioRow
                key={aud.id}
                item={aud}
                onAdd={(scope) => addAudio(aud, scope)}
                onDelete={!readOnly ? () => void removeAsset(aud) : undefined}
              />
            ))}
          </ul>
          {audioLibrary.hasMore && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={audioLibrary.loadMore}
              disabled={audioLibrary.loading}
            >
              {t.uploadsDrawer.loadMore}
            </button>
          )}
        </>
      )}

      {/* Empty States */}
      {tab === 'all' && filteredImages.length === 0 && filteredAudios.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CloudUpload size={22} />
          </div>
          <span className={styles.emptyText}>
            {debouncedQuery ? t.uploadsDrawer.searchEmpty : t.uploadsDrawer.emptyAll}
          </span>
        </div>
      )}

      {tab === 'images' && filteredImages.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ImageIcon size={22} />
          </div>
          <span className={styles.emptyText}>
            {debouncedQuery ? t.uploadsDrawer.searchEmpty : t.uploadsDrawer.emptyImages}
          </span>
        </div>
      )}

      {tab === 'audio' && filteredAudios.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Music size={22} />
          </div>
          <span className={styles.emptyText}>
            {debouncedQuery ? t.uploadsDrawer.searchEmpty : t.uploadsDrawer.emptyAudio}
          </span>
        </div>
      )}
    </div>
  )
}
