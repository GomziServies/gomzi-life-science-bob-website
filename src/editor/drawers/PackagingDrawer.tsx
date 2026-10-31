import { useState } from 'react'
import {
  Barcode as BarcodeIcon,
  Box,
  Download,
  QrCode as QrIcon,
  Ruler,
  Table as TableIcon,
} from 'lucide-react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { useEditor } from '../context'
import type { PanelProps } from '../panels/registry'
import { usePackagingGuidesStore } from '../store/packagingGuidesStore'
import { Switch } from '../ui/Switch'
import { DielinePicker } from './DielinePicker'

export function PackagingDrawer({ close }: PanelProps) {
  const editor = useEditor()
  const {
    showCreases,
    showBleed,
    showSafeMargin,
    toggleCreases,
    toggleBleed,
    toggleSafeMargin,
    setShowMockup3d,
  } = usePackagingGuidesStore()

  const [activeTab, setActiveTab] = useState<'tables' | 'barcodes' | 'guides' | 'dielines'>('tables')

  // 1. Table Tool States
  const [tableType, setTableType] = useState<'nutrition' | 'supplement' | 'custom'>('nutrition')
  const [servingSize, setServingSize] = useState('1 Scoop (30g)')
  const [servingsPerContainer, setServingsPerContainer] = useState('30')
  const [calories, setCalories] = useState('120')
  const [proteinVal, setProteinVal] = useState('24g')
  const [carbsVal, setCarbsVal] = useState('3g')
  const [fatVal, setFatVal] = useState('1.5g')
  const [sodiumVal] = useState('140mg')

  // 2. Barcode States
  const [barcodeFormat, setBarcodeFormat] = useState<'EAN13' | 'UPC' | 'CODE128'>('EAN13')
  const [barcodeText, setBarcodeText] = useState('8901234567890')
  const [barcodeError, setBarcodeError] = useState<string | null>(null)

  // 3. QR Code States
  const [qrUrl, setQrUrl] = useState('https://raw-nutrition.com/verify-batch')
  const [qrDarkColor] = useState('#000000')

  // -------------------------------------------------------------
  // Generate Nutrition Facts Table SVG
  // -------------------------------------------------------------
  const insertNutritionTable = async () => {
    const isSupp = tableType === 'supplement'
    const headerTitle = isSupp ? 'Supplement Facts' : 'Nutrition Facts'

    const svgTable = `
      <svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="300" height="420" fill="#ffffff" stroke="#000000" stroke-width="2.5" rx="4" />
        <text x="14" y="34" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#000000">${headerTitle}</text>
        <text x="14" y="54" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="12" fill="#000000">${servingsPerContainer} servings per container</text>
        <text x="14" y="70" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">Serving size</text>
        <text x="286" y="70" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">${servingSize}</text>
        <rect x="14" y="76" width="272" height="9" fill="#000000" />
        
        <text x="14" y="100" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#000000">Amount per serving</text>
        <text x="14" y="126" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="24" font-weight="900" fill="#000000">Calories</text>
        <text x="286" y="126" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="30" font-weight="900" fill="#000000">${calories}</text>
        <rect x="14" y="134" width="272" height="4" fill="#000000" />
        
        <text x="286" y="148" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#000000">% Daily Value*</text>
        <line x1="14" y1="152" x2="286" y2="152" stroke="#000000" stroke-width="1" />
        
        <text x="14" y="170" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">Total Fat <tspan font-weight="400">${fatVal}</tspan></text>
        <text x="286" y="170" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">2%</text>
        <line x1="14" y1="176" x2="286" y2="176" stroke="#000000" stroke-width="1" />
        
        <text x="14" y="196" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">Sodium <tspan font-weight="400">${sodiumVal}</tspan></text>
        <text x="286" y="196" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">6%</text>
        <line x1="14" y1="202" x2="286" y2="202" stroke="#000000" stroke-width="1" />
        
        <text x="14" y="222" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">Total Carbohydrate <tspan font-weight="400">${carbsVal}</tspan></text>
        <text x="286" y="222" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#000000">1%</text>
        <line x1="14" y1="228" x2="286" y2="228" stroke="#000000" stroke-width="1" />
        
        <text x="14" y="248" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="14" font-weight="900" fill="#000000">Protein <tspan font-weight="700">${proteinVal}</tspan></text>
        <text x="286" y="248" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="14" font-weight="900" fill="#000000">48%</text>
        <rect x="14" y="254" width="272" height="7" fill="#000000" />
        
        <text x="14" y="274" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Calcium 180mg</text>
        <text x="286" y="274" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="12" fill="#000000">15%</text>
        <line x1="14" y1="280" x2="286" y2="280" stroke="#000000" stroke-width="1" />
        
        <text x="14" y="300" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Potassium 210mg</text>
        <text x="286" y="300" text-anchor="end" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="12" fill="#000000">4%</text>
        <rect x="14" y="306" width="272" height="4" fill="#000000" />
        
        <text x="14" y="324" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="9" fill="#475569">* The % Daily Value tells you how much a nutrient</text>
        <text x="14" y="336" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="9" fill="#475569">in a serving of food contributes to a daily diet.</text>
      </svg>
    `
    await editor.insert.svgElement(svgTable.trim(), 'nutrition-table', headerTitle)
    close()
  }

  // -------------------------------------------------------------
  // Generate Commercial Barcode SVG (EAN-13, UPC-A, Code 128)
  // -------------------------------------------------------------
  const insertBarcode = async () => {
    setBarcodeError(null)
    try {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      JsBarcode(svgNode, barcodeText.trim(), {
        format: barcodeFormat,
        width: 2.2,
        height: 65,
        displayValue: true,
        fontSize: 14,
        textMargin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      })
      const svgString = new XMLSerializer().serializeToString(svgNode)
      await editor.insert.svgElement(svgString, `barcode-${barcodeFormat}`, `Barcode (${barcodeFormat})`)
      close()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setBarcodeError(`Invalid barcode digits: ${msg}`)
    }
  }

  // -------------------------------------------------------------
  // Generate QR Code SVG
  // -------------------------------------------------------------
  const insertQrCode = async () => {
    try {
      const qrSvg = await QRCode.toString(qrUrl.trim() || 'https://lableweb.design', {
        type: 'svg',
        color: {
          dark: qrDarkColor || '#000000',
          light: '#ffffff',
        },
        margin: 1,
      })
      await editor.insert.svgElement(qrSvg, 'qr-code', 'Packaging QR Code')
      close()
    } catch (err: unknown) {
      console.error('Failed generating QR code:', err)
    }
  }

  const exportPrepressDieline = () => {
    const page = editor.state.doc.pages.find((p) => p.id === editor.state.activePageId)
    const w = page?.width || 5358
    const h = page?.height || 1679
    const bleedPx = Math.round((3 / 25.4) * 300)
    const safePx = Math.round((3 / 25.4) * 300)
    const fold1 = Math.round(w * 0.3333)
    const fold2 = Math.round(w * 0.6666)

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
  <!-- PREPRESS PACKAGING DIELINE (ISO 12647-2 PRINT SPECIFICATION) -->
  <defs>
    <color id="CutContour" name="CutContour" value="#FF007F" />
    <color id="Crease" name="Crease" value="#00E5FF" />
    <color id="Bleed" name="Bleed" value="#FF00FF" />
  </defs>
  <rect id="BleedGuide" x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#ff00ff" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.8" />
  <rect id="CutContour" x="${bleedPx}" y="${bleedPx}" width="${w - bleedPx * 2}" height="${h - bleedPx * 2}" fill="none" stroke="#ff007f" stroke-width="2" />
  <rect id="SafeMargin" x="${bleedPx + safePx}" y="${bleedPx + safePx}" width="${w - (bleedPx + safePx) * 2}" height="${h - (bleedPx + safePx) * 2}" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="6,4" opacity="0.7" />
  <line id="Crease_Left" x1="${fold1}" y1="${bleedPx}" x2="${fold1}" y2="${h - bleedPx}" stroke="#00e5ff" stroke-width="2" stroke-dasharray="10,6" />
  <line id="Crease_Right" x1="${fold2}" y1="${bleedPx}" x2="${fold2}" y2="${h - bleedPx}" stroke="#00e5ff" stroke-width="2" stroke-dasharray="10,6" />
  <text x="${bleedPx + 20}" y="${bleedPx + 40}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ff007f">SPOT: CutContour (Trim Line)</text>
  <text x="${fold1 + 10}" y="${bleedPx + 40}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#00e5ff">SPOT: Crease (Fold 1)</text>
  <text x="${fold2 + 10}" y="${bleedPx + 40}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#00e5ff">SPOT: Crease (Fold 2)</text>
  <text x="${w - 380}" y="${bleedPx + 40}" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Dimensions: ${w}x${h}px (3mm Bleed)</text>
</svg>`

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Prepress-Dieline-${w}x${h}.svg`
    a.click()
    URL.revokeObjectURL(url)
    editor.toast('Prepress Dieline SVG exported with CutContour & Crease spot layers!', 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '14px 16px', background: '#ffffff' }}>
      {/* Tab Switcher - Clean White theme with #99c229 and pill rounded corners */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          background: '#f1f5f9',
          padding: 3,
          borderRadius: 9999,
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('tables')}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            fontWeight: 700,
            background: activeTab === 'tables' ? '#99c229' : 'transparent',
            color: activeTab === 'tables' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxShadow: activeTab === 'tables' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <TableIcon size={14} style={{ color: activeTab === 'tables' ? '#ffffff' : '#64748b' }} /> Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('barcodes')}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            fontWeight: 700,
            background: activeTab === 'barcodes' ? '#99c229' : 'transparent',
            color: activeTab === 'barcodes' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxShadow: activeTab === 'barcodes' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <BarcodeIcon size={14} style={{ color: activeTab === 'barcodes' ? '#ffffff' : '#64748b' }} /> Barcodes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            fontWeight: 700,
            background: activeTab === 'guides' ? '#99c229' : 'transparent',
            color: activeTab === 'guides' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxShadow: activeTab === 'guides' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Ruler size={14} style={{ color: activeTab === 'guides' ? '#ffffff' : '#64748b' }} /> Guides
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dielines')}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            fontWeight: 700,
            background: activeTab === 'dielines' ? '#99c229' : 'transparent',
            color: activeTab === 'dielines' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxShadow: activeTab === 'dielines' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Box size={14} style={{ color: activeTab === 'dielines' ? '#ffffff' : '#64748b' }} /> Dielines
        </button>
      </div>

      {/* TAB 1: NUTRITION & SPEC TABLES */}
      {activeTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Nutrition Facts Table Builder
          </p>
          <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 3, borderRadius: 9999 }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 9999,
                cursor: 'pointer',
                background: tableType === 'nutrition' ? '#99c229' : 'transparent',
                color: tableType === 'nutrition' ? '#ffffff' : '#64748b',
                boxShadow: tableType === 'nutrition' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setTableType('nutrition')}
            >
              FDA Nutrition
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 9999,
                cursor: 'pointer',
                background: tableType === 'supplement' ? '#99c229' : 'transparent',
                color: tableType === 'supplement' ? '#ffffff' : '#64748b',
                boxShadow: tableType === 'supplement' ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setTableType('supplement')}
            >
              Supplement Facts
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Serving Size</label>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Servings / Container</label>
              <input
                type="text"
                value={servingsPerContainer}
                onChange={(e) => setServingsPerContainer(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Calories</label>
              <input
                type="text"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Protein</label>
              <input
                type="text"
                value={proteinVal}
                onChange={(e) => setProteinVal(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Total Carbs</label>
              <input
                type="text"
                value={carbsVal}
                onChange={(e) => setCarbsVal(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Total Fat</label>
              <input
                type="text"
                value={fatVal}
                onChange={(e) => setFatVal(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={insertNutritionTable}
            style={{
              width: '100%',
              marginTop: 6,
              background: '#99c229',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 16px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(153, 194, 41, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Insert Table onto Canvas
          </button>
        </div>
      )}

      {/* TAB 2: BARCODES & QR */}
      {activeTab === 'barcodes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Barcode Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarcodeIcon size={16} style={{ color: '#99c229' }} /> Commercial Barcode
            </p>
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 9999 }}>
              {(['EAN13', 'UPC', 'CODE128'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    fontSize: 11,
                    background: barcodeFormat === fmt ? '#99c229' : 'transparent',
                    color: barcodeFormat === fmt ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    fontWeight: 700,
                    boxShadow: barcodeFormat === fmt ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setBarcodeFormat(fmt)
                    if (fmt === 'EAN13' && barcodeText.length !== 13) setBarcodeText('8901234567890')
                    if (fmt === 'UPC' && barcodeText.length !== 12) setBarcodeText('123456789012')
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                placeholder="Enter digits (e.g. 8901234567890)"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#0f172a',
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                style={{
                  fontSize: 11,
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const rand12 = Math.floor(100000000000 + Math.random() * 900000000000).toString()
                  if (barcodeFormat === 'EAN13') {
                    let sum = 0
                    for (let i = 0; i < 12; i++) {
                      sum += parseInt(rand12[i], 10) * (i % 2 === 0 ? 1 : 3)
                    }
                    const check = (10 - (sum % 10)) % 10
                    setBarcodeText(`${rand12}${check}`)
                  } else {
                    setBarcodeText(rand12)
                  }
                }}
                title="Generate standard barcode digits"
              >
                Random
              </button>
            </div>

            {barcodeError ? (
              <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 500 }}>{barcodeError}</span>
            ) : null}

            <button
              type="button"
              onClick={insertBarcode}
              style={{
                width: '100%',
                background: '#99c229',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '9px 16px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(153, 194, 41, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              Add Barcode to Packaging
            </button>
          </div>

          {/* QR Code Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <QrIcon size={16} style={{ color: '#99c229' }} /> Batch Verification QR Code
            </p>
            <input
              type="text"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              placeholder="https://yourbrand.com/verify-batch"
              style={{
                width: '100%',
                padding: '7px 10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                color: '#0f172a',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={insertQrCode}
              style={{
                width: '100%',
                background: '#99c229',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '9px 16px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(153, 194, 41, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              Add Vector QR Code
            </button>
          </div>
        </div>
      )}

      {activeTab === 'dielines' && <DielinePicker />}

      {/* TAB 3: PACKAGING GUIDES & 3D MOCKUP */}
      {activeTab === 'guides' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Prepress Dieline & Crease Overlays
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'block' }}>
                  3-Panel Fold Creases
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Left Regulatory | Center Brand | Right Table
                </span>
              </div>
              <Switch checked={showCreases} onChange={toggleCreases} label="3-Panel Creases" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'block' }}>
                  Safety Margin (3mm)
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Keep all critical typography inside
                </span>
              </div>
              <Switch checked={showSafeMargin} onChange={toggleSafeMargin} label="Safety Margin" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'block' }}>
                  Print Bleed Boundary (3mm)
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Factory trim bleed edge
                </span>
              </div>
              <Switch checked={showBleed} onChange={toggleBleed} label="Print Bleed" />
            </div>

            <button
              type="button"
              onClick={exportPrepressDieline}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 9999,
                color: '#0f172a',
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 14px',
                cursor: 'pointer',
                marginTop: 4,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={14} style={{ color: '#475569' }} /> Export Prepress Dieline (SVG)
            </button>
          </div>

          <div
            style={{
              padding: 14,
              background: 'linear-gradient(135deg, rgba(153, 194, 41, 0.12), rgba(255, 255, 255, 0.95))',
              border: '1px solid rgba(153, 194, 41, 0.35)',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4d660b' }}>
              <Box size={18} style={{ color: '#99c229' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>3D Smartmockup Packaging Preview</span>
            </div>
            <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>
              Preview your flat 2D dieline wrapped around a 3D cylindrical container, tub, or pouch with 360° interactive rotation.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowMockup3d(true)
                close()
              }}
              style={{
                background: '#99c229',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                padding: '9px 16px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                marginTop: 4,
                boxShadow: '0 4px 12px rgba(153, 194, 41, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              Open 3D Mockup Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
