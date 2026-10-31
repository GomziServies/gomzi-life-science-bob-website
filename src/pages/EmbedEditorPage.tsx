import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createGuestAdapter } from '@/features/editor/adapters'
import { EditorProblemPage, EditorSkeleton } from '@/features/editor/EditorStates'
import { LazyEditor } from '@/features/editor/LazyEditor'
import { templatesApi } from '@/lib/api'
import { createBlankDocument } from '@/lib/document'
import { createLocalDesign, getLocalDesign, type LocalDesign } from '@/lib/local'
import { usePageMeta } from '@/lib/usePageMeta'
import type { EditorHandle } from '@/types/adapter'
import type { DoryDocument } from '@/types/document'
import { Button } from '@/ui'

type Load = { kind: 'loading' } | { kind: 'ready'; design: LocalDesign } | { kind: 'error'; notFound: boolean }

/** Default banner canvas when a product opens without a template: 1200 x 628 px. */
const BLANK = { width: 1200, height: 628 }

/** Origins allowed to host the editor in an iframe and receive the saved banner (comma separated; localhost always allowed in dev). */
const PARENT_ORIGINS = String(import.meta.env.VITE_EMBED_PARENT_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

/** Loads a saved design JSON; only https (or http on localhost in dev) so the page cannot be pointed at arbitrary schemes. */
async function fetchDocument(url: string): Promise<DoryDocument> {
  const u = new URL(url)
  if (u.protocol !== 'https:' && !(import.meta.env.DEV && u.protocol === 'http:')) throw new Error('Unsupported document URL')
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`Could not load the banner (${res.status})`)
  return (await res.json()) as DoryDocument
}

/** Asks the host page (the CRM) for the design and waits for it: no CORS, and the host decides what it may read. */
function documentFromParent(product: string): Promise<DoryDocument> {
  const target = parentOrigin()
  if (!target) return Promise.reject(new Error('This editor can only be used from the admin panel.'))
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error('The banner design did not arrive. Please close and open it again.'))
    }, 30_000)
    function onMessage(ev: MessageEvent) {
      const msg = ev.data as { source?: string; type?: string; productId?: string; doc?: DoryDocument } | null
      if (ev.origin !== target || msg?.source !== 'doory-host' || msg.type !== 'load' || msg.productId !== product || !msg.doc) return
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve(msg.doc)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ source: 'doory-editor', type: 'ready', productId: product }, target)
  })
}

function parentOrigin(): string | null {
  if (window.parent === window) return null
  try {
    const origin = new URL(document.referrer).origin
    if (origin === window.location.origin || PARENT_ORIGINS.includes(origin) || (import.meta.env.DEV && /^https?:\/\/localhost(:\d+)?$/.test(origin))) return origin
  } catch {
    /* no usable referrer */
  }
  return null
}

/**
 * `/embed/editor`: the guest editor for another site's iframe (the banner website). The visitor edits a template and
 * presses Save; the PNG preview, the PDF and the design JSON go to the parent page with postMessage.
 *   ?template=<slug>   start from a gallery template (otherwise a blank banner)
 *   &product=<id>      echoed back so the parent knows which product the banner belongs to
 *   ?local=<id>        open a design already made in this browser (the AI banner from /embed/studio)
 *   ?doc=<url>         open a saved design JSON (the CRM team re-editing a customer's banner); wins over `template`
 *   ?doc=message       the same, but the design comes from the parent page: this page posts `ready` and waits for `load`
 */
export default function EmbedEditorPage() {
  usePageMeta({ title: 'Design your banner', noindex: true })
  const [params] = useSearchParams()
  const template = params.get('template')
  const docUrl = params.get('doc')
  const localParam = params.get('local')
  const product = params.get('product') ?? ''
  const navigate = useNavigate()
  const [load, setLoad] = useState<Load>({ kind: 'loading' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const editorRef = useRef<EditorHandle>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void (async () => {
      try {
        const resumeKey = `embed-design:${product}:${localParam ?? docUrl ?? template ?? 'blank'}`
        const existingId = docUrl === 'message' ? null : sessionStorage.getItem(resumeKey)
        const existing = existingId ? await getLocalDesign(existingId) : undefined
        if (existing) return setLoad({ kind: 'ready', design: existing })
        if (localParam) {
          const own = await getLocalDesign(localParam)
          if (own) return setLoad({ kind: 'ready', design: own })
        }
        let created: LocalDesign
        if (docUrl === 'message') {
          created = await createLocalDesign({ title: 'Banner', document: await documentFromParent(product) })
        } else if (docUrl) {
          created = await createLocalDesign({ title: 'Banner', document: await fetchDocument(docUrl) })
        } else if (template) {
          const t = await templatesApi.get(template)
          created = await createLocalDesign({ title: t.title, document: { ...t.document, meta: { ...t.document.meta, presetId: t.document.meta?.presetId ?? (t.preset || undefined) } } })
        } else {
          created = await createLocalDesign({ title: 'Banner', document: createBlankDocument(BLANK.width, BLANK.height, { unit: 'px' }) })
        }
        sessionStorage.setItem(resumeKey, created.id)
        setLoad({ kind: 'ready', design: created })
      } catch (error) {
        started.current = false
        setLoad({ kind: 'error', notFound: typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 404 })
      }
    })()
  }, [template, product, docUrl, localParam])

  // Guest storage only; there is no account to move to, so the sign-in hooks do nothing.
  const adapter = useMemo(
    () =>
      createGuestAdapter({
        localId: load.kind === 'ready' ? load.design.id : '',
        maxUploadBytes: 10 * 1024 * 1024,
        ensureSignedIn: async () => false,
        onMigrationStart: () => undefined,
        onMigrationProgress: () => undefined,
        onMigrationWarning: () => undefined,
        onMigrated: () => undefined,
        onMigrationError: () => undefined,
      }),
    [load],
  )

  const initialMeta = useMemo(() => (load.kind === 'ready' ? { id: load.design.id, title: load.design.title, mode: 'guest' as const } : null), [load])

  async function save() {
    const target = parentOrigin()
    const handle = editorRef.current
    if (!handle) return
    if (!target) {
      setMessage('This editor can only be used from the banner website.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await handle.saveNow().catch(() => undefined)
      const [png, pdf] = await Promise.all([handle.exportFile('png'), handle.exportFile('pdf')])
      window.parent.postMessage(
        { source: 'doory-editor', type: 'saved', productId: product, origin: params.get('mode') === 'ai' ? 'ai' : template || docUrl ? 'template' : 'blank', templateSlug: template ?? undefined, png, pdf, doc: handle.getDocument() },
        target,
      )
    } catch {
      setMessage('We could not save your banner. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (load.kind === 'loading') return <EditorSkeleton label="Opening your banner" />
  if (load.kind === 'error') return <EditorProblemPage problem={load.notFound ? 'not-found' : 'error'} onRetry={() => setLoad({ kind: 'loading' })} />
  if (!initialMeta) return null

  return (
    <LazyEditor
      editorRef={editorRef}
      document={load.design.document}
      meta={initialMeta}
      adapter={adapter}
      topBarStart={
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back to templates
        </Button>
      }
      topBarEnd={
        <>
          {message ? <span role="alert">{message}</span> : null}
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save banner'}
          </Button>
        </>
      }
    />
  )
}
