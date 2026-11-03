import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { simpleSizes } from '@/features/studio/aiLabel'
import { pictureDocument } from '@/features/studio/pictureDesign'
import { useAiLabel } from '@/features/studio/useAiLabel'
import { createLocalDesign } from '@/lib/local'
import { usePageMeta } from '@/lib/usePageMeta'
import { Button } from '@/ui'

const MAX_PROMPT = 600
/** The banner the customer asks for, in px. */
const BANNER = { width: 1600, height: 600 }

/**
 * `/embed/studio`: "Generate with AI" for the banner website. The visitor describes the banner, the AI draws it, and the
 * picture opens in `/embed/editor` (same iframe) where they can edit and save it. No account is needed.
 *   ?product=<id>&name=<product name>&brand=<brand name>&tag=<product tagline>
 */
export default function EmbedStudioPage() {
  usePageMeta({ title: 'Generate your label with AI', noindex: true })
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const aiLabel = useAiLabel()
  const product = params.get('product') ?? ''
  const name = params.get('name') ?? ''
  const brand = params.get('brand') ?? ''
  const tag = params.get('tag') ?? ''
  const [prompt, setPrompt] = useState(`A wide product banner for ${brand || 'my brand'} ${name}${tag ? ` (${tag.toLowerCase()})` : ''}. Bold, clean, premium supplement look.`)
  const [error, setError] = useState<string | null>(null)
  const busy = aiLabel.running

  async function generate() {
    setError(null)
    aiLabel.reset()
    const sizes = simpleSizes(BANNER.width, BANNER.height, 'px')
    const job = await aiLabel.start({
      prompt: prompt.trim().slice(0, MAX_PROMPT),
      width: sizes.artwork.width,
      height: sizes.artwork.height,
      target_width: sizes.target.width,
      target_height: sizes.target.height,
      unit: sizes.unit,
      panels: 'off',
      simple: true,
      brand_name: brand || undefined,
      product_name: name || undefined,
      mode: 'image',
      create_design: false,
    })
    if (job?.status === 'done' && job.mode === 'image') {
      const title = `${brand} ${name}`.trim() || 'Banner'
      const local = await createLocalDesign({ title, document: pictureDocument(job, title) as never })
      navigate(`/embed/editor?${new URLSearchParams({ local: local.id, product, mode: 'ai' })}`, { replace: true })
    } else {
      setError(job?.error || aiLabel.error || 'The label could not be made. Try again.')
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 28 }}>Generate a label with AI</h1>
      <p>Describe the label you want for <b>{name || 'your product'}</b>. You can edit everything afterwards.</p>
      <label htmlFor="prompt" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>What should it look like?</label>
      <textarea
        id="prompt"
        rows={5}
        maxLength={MAX_PROMPT}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={busy}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #d9ded4', font: 'inherit' }}
      />
      {error ? <p role="alert" style={{ color: '#c0392b' }}>{error}</p> : null}
      <p>
        <Button onClick={() => void generate()} disabled={busy || prompt.trim().length < 10}>
          {busy ? 'Drawing your label… this takes about a minute' : 'Generate label'}
        </Button>
      </p>
    </main>
  )
}
