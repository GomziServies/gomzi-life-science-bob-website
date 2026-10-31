import { useState, useEffect } from 'react'
import {
  Wand2,
  Sparkles,
  Zap,
  Scissors,
  Tag,
  Scale,
  Leaf,
  Layers,
  Check,
  ExternalLink,
  Palette,
  Maximize2,
  Loader2,
} from 'lucide-react'
import { IText } from 'fabric'
import { useEditor } from '../context'
import { kindOf } from '../engine/objects/kinds'
import { rewriteStudioText } from '@/features/studio/api'
import type { DoryDocument, DocObject } from '@/types/document'
import { LayeredGenerate } from './LayeredGenerate'
import styles from './StudioAiPanel.module.css'

interface ColorHarmony {
  id: string
  name: string
  theme: string
  bg: string
  surface: string
  primary: string
  accent: string
  text: string
}

const HARMONIES: ColorHarmony[] = [
  {
    id: 'luxury',
    name: 'Luxury Noir & Gold',
    theme: 'Premium & High-End Foil',
    bg: '#0f0f11',
    surface: '#1c1b18',
    primary: '#d4af37',
    accent: '#f5e6c8',
    text: '#ffffff',
  },
  {
    id: 'eco-kraft',
    name: 'Eco Kraft & Forest',
    theme: 'Artisanal & Sustainable',
    bg: '#fcfaf6',
    surface: '#c8ad8d',
    primary: '#1e382b',
    accent: '#52795d',
    text: '#1a2e22',
  },
  {
    id: 'pharma-clean',
    name: 'Pure Pharma & Clinical',
    theme: 'Minimalist & Certified',
    bg: '#f8fafc',
    surface: '#ffffff',
    primary: '#0f2942',
    accent: '#0ea5e9',
    text: '#0f172a',
  },
  {
    id: 'citrus-botanical',
    name: 'Fresh Citrus & Botanical',
    theme: 'Zesty & Natural Organic',
    bg: '#fbfdf7',
    surface: '#f4f9e8',
    primary: '#1a3024',
    accent: '#99c229',
    text: '#111827',
  },
  {
    id: 'coffee-amber',
    name: 'Artisanal Coffee & Amber',
    theme: 'Roast Espresso & Heritage',
    bg: '#fdfbf7',
    surface: '#f5ebe0',
    primary: '#2c1810',
    accent: '#b45309',
    text: '#1f1610',
  },
  {
    id: 'cosmetic-blush',
    name: 'Cosmetic Blush & Modern',
    theme: 'Soft Skincare & Elegance',
    bg: '#fffbf7',
    surface: '#fdf2f4',
    primary: '#3d405b',
    accent: '#e07a5f',
    text: '#2b2d42',
  },
]

/** Standard packaging dielines & label dimensions */
const PACKAGING_PRESETS = [
  { label: '12oz Sleek Can Wrap', icon: '🥫', type: 'Can Wrap', width: 778, height: 480, dim: '206 × 127 mm (355ml)' },
  { label: 'Standard 330ml Can', icon: '🥫', type: 'Can Wrap', width: 794, height: 435, dim: '210 × 115 mm' },
  { label: 'Supplement Jar Tub', icon: '💊', type: 'Tub Label', width: 1058, height: 454, dim: '280 × 120 mm (500g)' },
  { label: 'Dropper Bottle 30ml', icon: '🧴', type: 'Tincture', width: 360, height: 170, dim: '95 × 45 mm (1 oz)' },
  { label: 'Stand-Up Pouch', icon: '☕', type: 'Food Pouch', width: 605, height: 907, dim: '160 × 240 mm (Coffee)' },
  { label: 'Folding Product Box', icon: '📦', type: 'Carton Net', width: 945, height: 756, dim: '250 × 200 mm' },
  { label: 'Shipping & Barcode', icon: '🏷️', type: 'Logistics', width: 385, height: 574, dim: '102 × 152 mm (4 × 6 in)' },
  { label: 'Glass Jar Full Wrap', icon: '🍯', type: 'Jar Wrap', width: 832, height: 265, dim: '220 × 70 mm' },
]

export function StudioAiPanel() {
  const editor = useEditor()
  const [activeTab, setActiveTab] = useState<'transform' | 'recent'>('transform')
  const [customPrompt, setCustomPrompt] = useState('')
  const [recentBriefs, setRecentBriefs] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [loadingRewrite, setLoadingRewrite] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Find active selected text fabric object
  const activeView = editor.activeView()
  const selectedTextObj = activeView?.selectedObjects().find((o) => o instanceof IText) as IText | undefined
  const currentTextSnippet = selectedTextObj?.text || ''

  useEffect(() => {
    if (activeTab === 'recent') {
      setLoadingRecent(true)
      fetch('/api/v1/studio/briefs/')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setRecentBriefs(Array.isArray(data) ? data : data.results || [])
        })
        .catch(() => {
          setRecentBriefs([])
        })
        .finally(() => setLoadingRecent(false))
    }
  }, [activeTab])

  // Clear suggestions when selection changes
  useEffect(() => {
    setSuggestions([])
  }, [currentTextSnippet])

  const rewriteText = async (mode: string, customInstruction?: string) => {
    if (!selectedTextObj || !activeView) {
      editor.toast('Select a text element on the canvas first', 'info')
      return
    }

    const original = selectedTextObj.text || ''
    if (!original.trim()) return

    setLoadingRewrite(true)
    setSuggestions([])

    let instruction = customInstruction || ''
    if (mode === 'claim') {
      instruction = 'Format as a high-impact, certified packaging claim badge (e.g. 100% Organic • Non-GMO • Fair Trade)'
    } else if (mode === 'tagline') {
      instruction = 'Write an appetizing, memorable commercial packaging tagline or brand slogan'
    } else if (mode === 'tasting') {
      instruction = 'Generate sophisticated culinary tasting and flavor notes for packaging (e.g. Notes of Wild Honey & Bergamot)'
    } else if (mode === 'netwt') {
      instruction = 'Format as a compliant FDA/EU packaging net weight or volume statement'
    } else if (mode === 'punchier') {
      instruction = 'Make it a bold, high-impact commercial headline or packaging title'
    } else if (mode === 'shorter') {
      instruction = 'Make it short, crisp, 2-3 words to fit a tight packaging dieline badge'
    }

    try {
      const res = await rewriteStudioText({
        text: original,
        instruction,
      })
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions)
      } else {
        applyDirectRewrite(original, mode, customInstruction)
      }
    } catch {
      applyDirectRewrite(original, mode, customInstruction)
    } finally {
      setLoadingRewrite(false)
    }
  }

  const applyDirectRewrite = (original: string, mode: string, customInstruction?: string) => {
    if (!selectedTextObj || !activeView) return
    let rewritten = original

    if (mode === 'claim') {
      rewritten = `100% PURE & ORGANIC • NON-GMO`
    } else if (mode === 'tagline') {
      rewritten = `Crafted for Pure Performance & Taste`
    } else if (mode === 'tasting') {
      rewritten = `Notes of Crisp Citrus & Wild Botanical Honey`
    } else if (mode === 'netwt') {
      rewritten = `NET WT. 12 FL OZ (355 mL)`
    } else if (mode === 'punchier') {
      rewritten = original.toUpperCase()
    } else if (mode === 'shorter') {
      const words = original.split(/\s+/)
      rewritten = words.length > 3 ? words.slice(0, 3).join(' ') : original
    } else if (mode === 'custom' && customInstruction) {
      rewritten = `${original} [${customInstruction}]`
    }

    selectedTextObj.set('text', rewritten)
    selectedTextObj.initDimensions()
    activeView.canvas.requestRenderAll()
    editor.commitActive({ label: `AI Rewrite (${mode})` })
    editor.refreshSelection()
    editor.toast(`Rewrote copy: "${rewritten}"`, 'success')
  }

  const applySuggestion = (newText: string) => {
    if (!selectedTextObj || !activeView) return
    selectedTextObj.set('text', newText)
    selectedTextObj.initDimensions()
    activeView.canvas.requestRenderAll()
    editor.commitActive({ label: 'Apply AI Suggestion' })
    editor.refreshSelection()
    setSuggestions([])
    editor.toast(`Applied: "${newText}"`, 'success')
  }

  const applyPaletteHarmony = (harmony: ColorHarmony) => {
    const pageId = editor.state.activePageId
    const page = editor.state.doc.pages.find((p) => p.id === pageId)
    if (!page) return

    // Recolor background
    editor.pages.setBackground(pageId, { type: 'solid', color: harmony.bg })

    // Recolor objects harmoniously
    const updatedObjects = page.objects.map((obj: DocObject, idx: number) => {
      const kind = kindOf(obj)
      if (kind === 'text') {
        const isHeader = typeof obj.fontSize === 'number' && obj.fontSize > 26
        return {
          ...obj,
          fill: isHeader ? harmony.accent : harmony.text,
        }
      }
      if (kind === 'shape') {
        return {
          ...obj,
          fill: idx % 2 === 0 ? harmony.primary : harmony.accent,
        }
      }
      return obj
    })

    const nextDoc: DoryDocument = {
      ...editor.state.doc,
      pages: editor.state.doc.pages.map((p) => (p.id === pageId ? { ...p, objects: updatedObjects } : p)),
    }

    editor.applyDocument(nextDoc, { label: `Magic Re-Palette: ${harmony.name}` })
    editor.toast(`Applied ${harmony.name} finish`, 'success')
  }

  const applyResize = (w: number, h: number, name: string) => {
    editor.pages.resize(w, h, 'scale')
    editor.toast(`Resized canvas to ${name} (${w}×${h}px)`, 'success')
  }

  const handleOpenStudio = () => {
    window.open('/studio/new', '_blank')
  }

  return (
    <div className={styles.panel} data-testid="studio-ai-panel">
      {/* Clean Packaging Studio Action Card */}
      <div className={styles.hero}>
        <div className={styles.heroTopRow}>
          <span className={styles.heroBadge}>
            <Sparkles size={12} /> Studio AI
          </span>
          <span className={styles.heroSubBadge}>Packaging Studio</span>
        </div>
        <h3 className={styles.heroTitle}>Create with AI</h3>
        <p className={styles.heroDesc}>
          Generate full, print-ready packaging labels or enhance your canvas copy, dielines, and finishes with AI.
        </p>
        <button type="button" className={styles.heroAction} onClick={handleOpenStudio}>
          <ExternalLink size={14} /> Open AI Design Studio
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'transform' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('transform')}
        >
          <Wand2 size={13} /> Quick Magic
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'recent' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Layers size={13} /> AI Variants
        </button>
      </div>

      {activeTab === 'transform' && (
        <>
          <LayeredGenerate />

          {/* Packaging Copy & Claims Polish */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <Wand2 size={14} /> AI Copy Polish
              </h4>
              {loadingRewrite && <Loader2 size={13} className="spin" style={{ color: '#99c229' }} />}
            </div>
            {selectedTextObj ? (
              <div className={styles.selectedCard}>
                <div className={styles.selectedSnippet} title={currentTextSnippet}>
                  "{currentTextSnippet.length > 40 ? currentTextSnippet.slice(0, 40) + '…' : currentTextSnippet}"
                </div>
                <div className={styles.actionsGrid}>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('claim')}>
                    <Tag size={13} /> 🏷️ Claim Badge
                  </button>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('tagline')}>
                    <Zap size={13} /> 🎯 Brand Tagline
                  </button>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('tasting')}>
                    <Leaf size={13} /> 🌿 Tasting Notes
                  </button>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('netwt')}>
                    <Scale size={13} /> ⚖️ Net Wt / Vol
                  </button>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('punchier')}>
                    <Zap size={13} /> ⚡ Punchy Title
                  </button>
                  <button type="button" className={styles.actionBtn} disabled={loadingRewrite} onClick={() => rewriteText('shorter')}>
                    <Scissors size={13} /> ✂️ Dieline Fit
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className={styles.suggestionsBox}>
                    <span className={styles.suggestionsHeader}>Click to apply suggestion:</span>
                    {suggestions.map((s, idx) => (
                      <button key={idx} type="button" className={styles.suggestionBtn} onClick={() => applySuggestion(s)}>
                        "{s}"
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.customRewrite}>
                  <input
                    type="text"
                    className={styles.customInput}
                    placeholder="Custom packaging instruction..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPrompt.trim()) {
                        rewriteText('custom', customPrompt.trim())
                        setCustomPrompt('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.customSubmit}
                    disabled={!customPrompt.trim() || loadingRewrite}
                    onClick={() => {
                      rewriteText('custom', customPrompt.trim())
                      setCustomPrompt('')
                    }}
                  >
                    Rewrite
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyHint}>
                💡 Select any text layer on your packaging canvas to polish copy, format certified claims, or translate with AI.
              </div>
            )}
          </div>

          {/* Magic Re-Palette (Packaging Finishes) */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <Palette size={14} /> Magic Re-Palette
              </h4>
            </div>
            <p className={styles.sectionDesc}>One click to re-harmonize all colors on the active page.</p>
            <div className={styles.paletteList}>
              {HARMONIES.map((harmony) => (
                <div
                  key={harmony.id}
                  className={styles.paletteCard}
                  onClick={() => applyPaletteHarmony(harmony)}
                  title={`Apply ${harmony.name}`}
                >
                  <div className={styles.paletteInfo}>
                    <span className={styles.paletteName}>{harmony.name}</span>
                    <span className={styles.paletteTheme}>{harmony.theme}</span>
                  </div>
                  <div className={styles.paletteSwatches}>
                    <span className={styles.colorDot} style={{ background: harmony.bg }} />
                    <span className={styles.colorDot} style={{ background: harmony.primary }} />
                    <span className={styles.colorDot} style={{ background: harmony.accent }} />
                    <span className={styles.colorDot} style={{ background: harmony.text }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Magic Resize (Packaging Dielines & Label Sizes) */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <Maximize2 size={14} /> Magic Resize
              </h4>
            </div>
            <div className={styles.resizeGrid}>
              {PACKAGING_PRESETS.map((preset) => (
                <div
                  key={preset.label}
                  className={styles.resizeCard}
                  onClick={() => applyResize(preset.width, preset.height, preset.label)}
                >
                  <div className={styles.resizeHeader}>
                    <span className={styles.resizeIcon}>{preset.icon}</span>
                    <span className={styles.resizeLabel}>{preset.label}</span>
                  </div>
                  <span className={styles.resizeDim}>{preset.dim}</span>
                  <span className={styles.resizeType}>{preset.type}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'recent' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <Layers size={14} /> Generated Designs
            </h4>
          </div>
          {loadingRecent ? (
            <div className={styles.emptyHint}>Loading AI designs…</div>
          ) : recentBriefs.length === 0 ? (
            <div className={styles.emptyHint}>
              No AI designs generated yet. Click "Open AI Design Studio" above to create your first brief!
            </div>
          ) : (
            recentBriefs.map((b) => (
              <div key={b.id} className={styles.variantCard}>
                <div className={styles.variantHeader}>
                  <span className={styles.variantTitle}>{b.spec?.product_name || 'Design Brief'}</span>
                  <span className={styles.variantBadge}>{b.spec?.category || 'Packaging'}</span>
                </div>
                {b.variants?.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    className={styles.applyVariantBtn}
                    onClick={() => {
                      if (v.document) {
                        editor.loadDocument(v.document)
                        editor.toast(`Loaded variant (${v.archetype})`, 'success')
                      }
                    }}
                  >
                    <Check size={12} /> Load {v.archetype} ({v.variant_number === 1 ? 'Variant A' : 'Variant B'})
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
