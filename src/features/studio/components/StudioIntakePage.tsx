import { Download, ImagePlus, Loader2, PencilRuler, Sparkles, Wand2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadReference, useStudioProducts, useUploadLogo } from '../api'
import type { LayeredJob } from '../api'
import { useAuth } from '@/features/auth/AuthProvider'
import { createLocalDesign } from '@/lib/local'
import { pictureDocument } from '../pictureDesign'
import { simpleSizes } from '../aiLabel'
import { useAiLabel } from '../useAiLabel'
import type { StudioUnit } from '../units'
import type { LogoAsset } from '../types'
import styles from './StudioIntakePage.module.css'

const PRESETS: { name: string; width: number; height: number; unit: StudioUnit }[] = [
  { name: 'Tub wrap', width: 280, height: 110, unit: 'mm' },
  { name: 'Wide banner', width: 454, height: 142, unit: 'mm' },
  { name: 'Square', width: 1080, height: 1080, unit: 'px' },
  { name: 'A4 portrait', width: 210, height: 297, unit: 'mm' },
]

const MAX_PROMPT = 1900

/** One box: say what you want, set the size, add a logo if you have one. The AI draws the whole picture; "Make editable" turns it into layers. */
export function StudioIntakePage() {
  const navigate = useNavigate()
  const { status } = useAuth()
  const aiLabel = useAiLabel()
  const uploadLogo = useUploadLogo()
  const catalogue = useStudioProducts()
  const products = catalogue.data?.products ?? []
  const company = catalogue.data?.company

  const [productId, setProductId] = useState('')
  const [brand, setBrand] = useState('')
  const [flavour, setFlavour] = useState('')
  const [marketedBy, setMarketedBy] = useState('')
  const [customerCare, setCustomerCare] = useState('')
  const [email, setEmail] = useState('')
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(280)
  const [height, setHeight] = useState(110)
  const [unit, setUnit] = useState<StudioUnit>('mm')
  const [logo, setLogo] = useState<LogoAsset | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [useOriginal, setUseOriginal] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const refInput = useRef<HTMLInputElement>(null)
  const [reference, setReference] = useState<{ url: string; preview: string } | null>(null)
  const [refBusy, setRefBusy] = useState(false)
  const [refError, setRefError] = useState<string | null>(null)

  const [drawn, setDrawn] = useState<LayeredJob | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  useEffect(
    () => () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    },
    [logoPreview],
  )

  const [threePanels, setThreePanels] = useState(true)
  const wide = width > 0 && height > 0 && simpleSizes(width, height, unit).target.width / simpleSizes(width, height, unit).target.height >= 2
  const running = aiLabel.job && aiLabel.job.status !== 'done' && aiLabel.job.status !== 'failed' ? aiLabel.job : null
  const chosen = products.find((p) => p.id === productId)
  const canGenerate = prompt.trim().length > 0 && width > 0 && height > 0 && !busy && !uploadLogo.isPending && !refBusy

  /** Picking a product sets the banner size the company really prints for it (from its old labels). */
  function chooseProduct(id: string) {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (p) {
      setWidth(p.width_mm)
      setHeight(p.height_mm)
      setUnit('mm')
    }
  }

  /** The reference: a finished label the client likes. The AI copies its look (layout, colours, shapes), never its words. */
  async function pickReference(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setRefError(null)
    setRefBusy(true)
    const preview = URL.createObjectURL(file)
    try {
      const { file_url } = await uploadReference(file)
      setReference({ url: file_url, preview })
    } catch (err) {
      URL.revokeObjectURL(preview)
      setReference(null)
      setRefError(err instanceof Error && err.message ? err.message : 'The reference could not be uploaded.')
    } finally {
      setRefBusy(false)
    }
  }

  function clearReference() {
    if (reference) URL.revokeObjectURL(reference.preview)
    setReference(null)
    setRefError(null)
  }

  /** Uploads the logo; the server cleans it (background removed, crisp, large) unless the user asked for the original. */
  async function sendLogo(file: File, original: boolean) {
    setLogoError(null)
    try {
      const asset = await uploadLogo.mutateAsync({ file, removeBackground: false, clean: !original })
      setLogo(asset)
      setLogoPreview(asset.file_url)
    } catch (err) {
      setLogo(null)
      setLogoPreview(null)
      setLogoError(err instanceof Error && err.message ? err.message : 'The logo could not be uploaded.')
    }
  }

  async function pickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoFile(file)
    setUseOriginal(false)
    setLogoPreview(URL.createObjectURL(file)) // shown at once; replaced by the cleaned logo when the server answers
    await sendLogo(file, false)
  }

  function clearLogo() {
    setLogo(null)
    setLogoFile(null)
    setLogoPreview(null)
    setLogoError(null)
    setUseOriginal(false)
  }

  function toggleOriginal(original: boolean) {
    setUseOriginal(original)
    if (logoFile) void sendLogo(logoFile, original)
  }

  const prep = logo?.prep ?? null

  async function generate() {
    const sizes = simpleSizes(width, height, unit)
    setBusy(true)
    setError(null)
    aiLabel.reset()
    const job = await aiLabel.start({
      prompt: prompt.trim().slice(0, MAX_PROMPT),
      width: sizes.artwork.width,
      height: sizes.artwork.height,
      target_width: sizes.target.width,
      target_height: sizes.target.height,
      unit: sizes.unit,
      panels: 'off',
      simple: true,
      product: chosen?.id,
      brand_name: brand.trim() || undefined,
      flavor: flavour.trim() || undefined,
      marketed_by: marketedBy.trim() || undefined,
      customer_care: customerCare.trim() || undefined,
      email: email.trim() || undefined,
      bleed_mm: chosen?.bleed_mm,
      seamless: threePanels && wide && !reference, // a reference is shown to the model in one drawing
      style_reference: reference?.url,
      size_label: sizes.label,
      mode: 'image',
      logo_url: logo?.file_url,
      create_design: status === 'authenticated',
    })
    setBusy(false)
    if (job?.status === 'done' && job.mode === 'image') setDrawn(job)
    else setError(job?.error || aiLabel.error || 'The design could not be made. Try again.')
  }

  const titleOf = (): string => prompt.trim().slice(0, 40) || 'New design'

  /** The picture as drawn opens in the editor; its top bar offers "Convert to editable". */
  async function openPicture(job: LayeredJob) {
    if (job.design_id && status === 'authenticated') {
      navigate(`/design/${job.design_id}`)
      return
    }
    const title = titleOf()
    const local = await createLocalDesign({ title, document: pictureDocument(job, title) as never })
    navigate(`/local/${local.id}`)
  }

  /** The drawn picture is read by our own text and object recognition and becomes real layers, then the editor opens. Nothing is drawn again. */
  async function makeEditable(job: LayeredJob) {
    setError(null)
    setConverting(true)
    const result = await aiLabel.makeEditable(job.id)
    setConverting(false)
    if (result?.status !== 'done') {
      setError(result?.error || aiLabel.error || 'The design could not be made editable. Try again.')
      return
    }
    if (result.design_id && status === 'authenticated') {
      navigate(`/design/${result.design_id}`)
    } else if (result.document) {
      const local = await createLocalDesign({ title: titleOf(), document: result.document as never })
      navigate(`/local/${local.id}`)
    }
  }

  if (drawn) {
    const step = converting && aiLabel.job && aiLabel.job.id !== drawn.id ? aiLabel.job : null
    return (
      <div className={styles.page}>
        <section className={styles.result} aria-label="Your design">
          <img className={styles.picture} src={drawn.artwork_url} alt="The design as drawn" />
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={converting} onClick={() => void makeEditable(drawn)}>
              {converting ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
              <span>{converting ? `${step?.stage_message || 'Starting'} (${step?.progress ?? 5}%)` : 'Make editable'}</span>
            </button>
            <button type="button" className={styles.secondary} disabled={converting} onClick={() => void openPicture(drawn)}>
              <PencilRuler size={16} aria-hidden="true" />
              <span>Open in editor</span>
            </button>
            <a className={styles.secondary} href={drawn.artwork_url} download="design.png">
              <Download size={16} aria-hidden="true" />
              <span>Download</span>
            </a>
            <button
              type="button"
              className={styles.ghost}
              disabled={converting}
              onClick={() => {
                setDrawn(null)
                aiLabel.reset()
              }}
            >
              New design
            </button>
          </div>
          <p className={styles.hint}>
            This is the picture exactly as drawn. <strong>Make editable</strong> reads it with our text and object recognition and turns every text and object into its own layer.
          </p>
          {drawn.renamed && drawn.renamed.length > 0 && (
            <p className={styles.hint}>
              Changed before drawing, because the image model refuses other brands&apos; characters: {drawn.renamed.join('; ')}.
            </p>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-label="Describe your design">
        <h1 className={styles.title}>New label</h1>

        <div className={styles.row}>
          <label className={styles.wide}>
            <span>Product</span>
            <select value={productId} onChange={(e) => chooseProduct(e.target.value)} aria-label="Product">
              <option value="">Choose a product (sets the size)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wide}>
            <span>Brand name</span>
            <input type="text" value={brand} maxLength={60} placeholder="Brand on the label" onChange={(e) => setBrand(e.target.value)} />
          </label>
          <label className={styles.wide}>
            <span>Flavour</span>
            <input type="text" value={flavour} maxLength={60} placeholder="Mawa Kulfi, Orange, Chocolate…" onChange={(e) => setFlavour(e.target.value)} />
          </label>
        </div>
        {chosen && (
          <div className={styles.row}>
            <label className={styles.wide}>
              <span>Marketed by (name and address)</span>
              <input type="text" value={marketedBy} maxLength={190} placeholder="Client name, address" onChange={(e) => setMarketedBy(e.target.value)} />
            </label>
            <label className={styles.wide}>
              <span>Customer care no.</span>
              <input type="text" value={customerCare} maxLength={60} placeholder="+91 …" onChange={(e) => setCustomerCare(e.target.value)} />
            </label>
            <label className={styles.wide}>
              <span>Email</span>
              <input type="text" value={email} maxLength={120} placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        )}
        {chosen && company && (
          <p className={styles.hint} data-testid="fixed-details">
            Fixed on every {chosen.label.split(' (')[0]} label, copied exactly: {company.manufacturer}, {company.address} FSSAI {company.fssai}, the standard advice blocks, nutrition tables and batch lines.
            Only the look changes.
          </p>
        )}
        <textarea
          className={styles.prompt}
          value={prompt}
          maxLength={MAX_PROMPT}
          rows={5}
          placeholder="Describe the look only, for example: Indian village theme, saffron and cream, festive, marigold garlands"
          aria-label="Describe the look of your design"
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className={styles.row}>
          <div className={styles.sizeBox} role="group" aria-label="Size">
            <label className={styles.field}>
              <span>Width</span>
              <input type="number" min={1} value={width || ''} onChange={(e) => setWidth(Number(e.target.value))} />
            </label>
            <label className={styles.field}>
              <span>Height</span>
              <input type="number" min={1} value={height || ''} onChange={(e) => setHeight(Number(e.target.value))} />
            </label>
            <label className={styles.field}>
              <span>Unit</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value as StudioUnit)}>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">in</option>
                <option value="px">px</option>
              </select>
            </label>
          </div>

          <div className={styles.logoBox}>
            <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={pickLogo} data-testid="logo-input" />
            {logoPreview ? (
              <div className={styles.logoBlock}>
                <div className={styles.logoChip}>
                  <span className={styles.checker}>
                    <img src={logoPreview} alt="Your logo" />
                  </span>
                  <span>{uploadLogo.isPending ? 'Cleaning your logo…' : 'Logo added'}</span>
                  <button type="button" aria-label="Remove logo" onClick={clearLogo}>
                    <X size={14} />
                  </button>
                </div>
                {prep && !uploadLogo.isPending && (
                  <span className={styles.logoNote} data-testid="logo-prep-note">
                    Background {prep.background.split(' (')[0]}. Made crisp at {prep.size[0]} × {prep.size[1]} px (was {prep.original[0]} × {prep.original[1]}).
                  </span>
                )}
                {logoFile && (
                  <label className={styles.check}>
                    <input type="checkbox" checked={useOriginal} disabled={uploadLogo.isPending} onChange={(e) => toggleOriginal(e.target.checked)} />
                    <span>Use my original logo as it is</span>
                  </label>
                )}
              </div>
            ) : (
              <button type="button" className={styles.secondary} onClick={() => fileInput.current?.click()}>
                <ImagePlus size={16} aria-hidden="true" />
                <span>Upload logo</span>
              </button>
            )}
            {logoError && <span className={styles.error}>{logoError}</span>}
          </div>
        </div>

        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={width === p.width && height === p.height && unit === p.unit ? styles.presetOn : styles.preset}
              onClick={() => {
                setWidth(p.width)
                setHeight(p.height)
                setUnit(p.unit)
              }}
            >
              {p.name} · {p.width}×{p.height} {p.unit}
            </button>
          ))}
        </div>

        <div className={styles.refBox}>
          <input ref={refInput} type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={pickReference} data-testid="reference-input" />
          {reference ? (
            <div className={styles.refChip}>
              <img className={styles.refThumb} src={reference.preview} alt="Your reference label" />
              <span>Reference added</span>
              <button type="button" aria-label="Remove reference" onClick={clearReference}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" className={styles.secondary} disabled={refBusy} onClick={() => refInput.current?.click()}>
              {refBusy ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
              <span>{refBusy ? 'Uploading…' : 'Upload reference'}</span>
            </button>
          )}
          <span className={styles.refHint}>Optional: a finished label you like. The AI copies its look (layout, colours, shapes), never its words.</span>
          {refError && <span className={styles.error}>{refError}</span>}
        </div>

        {wide && (
          <label className={styles.check}>
            <input type="checkbox" checked={threePanels && !reference} disabled={Boolean(reference)} onChange={(e) => setThreePanels(e.target.checked)} />
            <span>{reference ? 'One drawing is used with a reference' : 'Draw in 3 matched panels (sharper on wide banners; takes about 3 times longer)'}</span>
          </label>
        )}

        <button type="button" className={styles.primary} disabled={!canGenerate} onClick={() => void generate()}>
          {busy ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
          <span>{busy ? 'Designing…' : 'Generate'}</span>
        </button>

        {busy && (
          <div className={styles.progress} role="status">
            <div className={styles.bar}>
              <div style={{ width: `${Math.max(5, Math.min(99, running?.progress ?? 5))}%` }} />
            </div>
            <span>{running?.stage_message || 'Starting'}</span>
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
