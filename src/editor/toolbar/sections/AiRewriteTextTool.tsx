import { useState } from 'react'
import { Sparkles, Loader2, Pencil } from 'lucide-react'
import { IText } from 'fabric'
import { useEditor, useSelection } from '../../context'
import { PopoverTool } from '../parts'
import { rewriteStudioText } from '@/features/studio/api'
import ed from '../../chrome/ed.module.css'

export function AiRewriteTextTool() {
  const editor = useEditor()
  const sel = useSelection()
  const obj = sel.objects[0]
  const currentText = typeof obj?.text === 'string' ? obj.text : ''

  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const quickStyles = [
    { label: '🔥 Punchy Slogan', instruction: 'Make it a bold, high-impact commercial headline or slogan' },
    { label: '⚡ Short & Crisp', instruction: 'Make it short, crisp, 2-3 words for a packaging badge' },
    { label: '💎 Luxury & Premium', instruction: 'Elevate tone to ultra-luxury, sophisticated packaging terminology' },
    { label: '🇮🇳 Hindi / Hinglish', instruction: 'Translate or phrase in modern high-energy Indian packaging style' },
  ]

  async function handleRewrite(instruction: string) {
    if (!currentText.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await rewriteStudioText({
        text: currentText,
        instruction,
      })
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions)
      }
    } catch (err: unknown) {
      console.error('Rewrite failed:', err)
      setError(err instanceof Error ? err.message : 'Rewrite failed.')
    } finally {
      setLoading(false)
    }
  }

  function applySuggestion(newText: string, close: () => void) {
    const view = editor.activeView()
    const targetObj = view?.selectedObjects()[0]
    if (targetObj && targetObj instanceof IText) {
      targetObj.set('text', newText)
      targetObj.setCoords()
      view.canvas.requestRenderAll()
      editor.commitActive({ label: 'AI Rewrite Text' })
      editor.toast(`Updated text to: "${newText}"`, 'info')
      close()
    }
  }

  return (
    <PopoverTool
      label="AI Rewrite (Pencil)"
      testId="ed-ai-rewrite-text"
      width={280}
      trigger={<Pencil size={18} aria-hidden="true" />}
    >
      {(close) => (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>AI Copywriter</span>
          </div>

          <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: 6, borderRadius: 4 }}>
            Current: <strong style={{ color: '#0f172a' }}>"{currentText}"</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Choose Tone / Action:
            </span>
            {quickStyles.map((qs, i) => (
              <button
                key={i}
                type="button"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                disabled={loading}
                onClick={() => handleRewrite(qs.instruction)}
              >
                <span>{qs.label}</span>
                {loading && <Loader2 size={12} className={ed.spin} />}
              </button>
            ))}
          </div>

          {suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                Click to Apply:
              </span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #86efac',
                    background: '#f0fdf4',
                    color: '#15803d',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onClick={() => applySuggestion(s, close)}
                >
                  "{s}"
                </button>
              ))}
            </div>
          )}

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
