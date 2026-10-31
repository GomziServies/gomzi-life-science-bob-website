import { useState } from 'react'
import { Pencil, Loader2, Send } from 'lucide-react'
import { useEditor, useSelection } from '../../context'
import { PopoverTool } from '../parts'
import { generateStudioImage } from '@/features/studio/api'
import type { AssetRef } from '@/types/adapter'
import styles from './sections.module.css'

export function AiRegenerateImageTool() {
  const editor = useEditor()
  const sel = useSelection()
  const obj = sel.objects[0]
  const initialPrompt = (obj && 'name' in obj && typeof obj.name === 'string' ? obj.name : '') || 'commercial packaging artwork background'

  const [prompt, setPrompt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickPrompts = [
    'Mawa Kulfi with pistachios & saffron gold swirls',
    'Cold brew espresso vortex with splashing coffee beans',
    'Luxury obsidian background with gold dust',
    'Fiery Mexican chili smoke and vibrant spices',
    'Clean botanical herbal background with soft mint',
  ]

  async function handleRegenerate(close: () => void) {
    const activePrompt = (prompt.trim() || initialPrompt).trim()
    if (!activePrompt) return

    setLoading(true)
    setError(null)
    editor.toast('Generating AI asset and loading into place...', 'info')
    try {
      const res = await generateStudioImage({
        prompt: activePrompt,
        size: '1024x1024',
      })

      if (!res.image_url) {
        throw new Error('No image URL returned from AI generation.')
      }

      const ref: AssetRef = {
        id: crypto.randomUUID(),
        url: res.image_url,
        thumbUrl: res.image_url,
        width: 1024,
        height: 1024,
        name: activePrompt,
        kind: 'image',
      }

      await editor.insert.replaceSelectedImage(ref)
      editor.toast('Asset loaded into place!', 'info')
      close()
    } catch (err: unknown) {
      console.error('AI Regenerate failed:', err)
      const msg = err instanceof Error ? err.message : 'Generation failed. Check API credentials.'
      setError(msg)
      editor.toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PopoverTool
      label="AI Prompt Edit (Pencil)"
      testId="ed-ai-regenerate-image"
      width={340}
      trigger={<Pencil size={18} aria-hidden="true" />}
    >
      {(close) => (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pencil size={15} color="#16a34a" />
              <span>AI Prompt & Replace</span>
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
            Enter your prompt and click Send. The new asset will generate and load directly in place.
          </p>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              style={{
                flex: 1,
                boxSizing: 'border-box',
                padding: '8px 10px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              placeholder={initialPrompt}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleRegenerate(close)
                }
              }}
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              onClick={() => handleRegenerate(close)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className={styles.spin || ''} />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, color: '#166534' }}>
              <Loader2 size={14} className={styles.spin || ''} />
              <span>Generating AI artwork... replacing asset in place...</span>
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
              Quick Presets:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => setPrompt(qp)}
                >
                  {qp.split(' ')[0]} {qp.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: 6, borderRadius: 4 }}>
              {error}
            </div>
          )}
        </div>
      )}
    </PopoverTool>
  )
}
