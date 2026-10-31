import { Palette, PilcrowLeft, PilcrowRight, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EffectsPanel } from '../effects'
import { AiRewriteTextTool } from './AiRewriteTextTool'
import { ColorTool } from '../../chrome/ColorTool'
import { I } from '../../chrome/icons'
import { isBold, textValue } from '../../builtins/textState'
import { useEditor, useSelection } from '../../context'
import { readFill } from '../../engine/objects/fills'
import { CURVE_MAX } from '../../engine/text/curve'
import { primaryFamily } from '../../engine/text/fontStack'
import { t } from '../../strings'
import { Popover } from '../../ui/Popover'
import { Tooltip } from '../../ui/Tooltip'
import { LimitedNumber, OpacityTool, Stepper } from '../controls'
import { FontPicker } from '../FontPicker'
import { TitleStylePicker } from '../TitleStylePicker'
import { createFontPreview } from '../fontPreview'
import { FONT_SIZE, LETTER_SPACING, LINE_HEIGHT } from '../limits'
import { PopoverTool, ToolButton } from '../parts'
import ed from '../../chrome/ed.module.css'

const ALIGN = [
  { id: 'left', label: t.toolbar.alignLeft, icon: I.alignLeft },
  { id: 'center', label: t.toolbar.alignCenter, icon: I.alignCenter },
  { id: 'right', label: t.toolbar.alignRight, icon: I.alignRight },
  { id: 'justify', label: t.toolbar.justify, icon: I.alignJustify },
] as const

const DIRECTIONS = [
  { id: 'auto', label: t.toolbar.directionAuto, hint: t.toolbar.directionAutoHint },
  { id: 'ltr', label: t.toolbar.directionLtr },
  { id: 'rtl', label: t.toolbar.directionRtl },
] as const

const CASES = [
  { id: 'sentence', label: t.ctx.caseSentenceOption },
  { id: 'lower', label: t.ctx.caseLowerOption },
  { id: 'upper', label: t.ctx.caseUpperOption },
  { id: 'title', label: t.ctx.caseTitleOption },
] as const

const RESTORE_CASE = { id: 'none', label: t.ctx.caseNormal } as const

/** Whether the catalog has an italic file for the family (unknown and system fonts: assume so). */
function useHasItalic(family: string): boolean {
  const editor = useEditor()
  const [known, setKnown] = useState<{ family: string; italic: boolean } | null>(null)
  useEffect(() => {
    let cancelled = false
    if (!family) return
    void editor.fonts.lookup(family).then((f) => {
      if (!cancelled) setKnown({ family, italic: !f || f.variants.length === 0 || f.variants.some((v) => v.style === 'italic') })
    })
    return () => {
      cancelled = true
    }
  }, [editor, family])
  return known?.family === family ? known.italic : true
}

/** The font pill and its searchable list. */
function FontTool({ family, stack, sample }: { family: string; stack: string; sample: string }) {
  const editor = useEditor()
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const preview = useMemo(() => createFontPreview(editor), [editor])
  const close = useCallback(() => {
    preview.cancel()
    setOpen(false)
  }, [preview])
  return (
    <>
      <Tooltip label={t.toolbar.font} disabled={open}>
        <button ref={ref} type="button" className={ed.select} aria-label={`${t.toolbar.font}: ${family}`} aria-haspopup="dialog" aria-expanded={open} data-testid="ed-font" style={{ fontFamily: stack }} onClick={() => (open ? close() : setOpen(true))}>
          <span className={ed.selectValue}>{family || t.tools.fontFallback}</span>
          {I.chevronDown}
        </button>
      </Tooltip>
      <Popover open={open} onClose={close} anchorRef={ref} label={t.toolbar.font} placement="bottom" variant="plain" cover>
        <FontPicker
          current={family}
          sample={sample}
          onPreview={preview.preview}
          onPick={(next) => {
            preview.commit()
            editor.style.text({ fontFamily: next }, t.history.changeFont)
            setOpen(false)
          }}
          onClose={close}
        />
      </Popover>
    </>
  )
}

const WEIGHT_OPTIONS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi-Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra-Bold' },
  { value: 900, label: 'Black' },
] as const

function parseWeightNumber(w: unknown): number {
  if (w === 'bold' || w === '700') return 700
  if (w === 'normal' || w === '400') return 400
  const n = Number(w)
  return Number.isFinite(n) && n >= 100 && n <= 900 ? Math.round(n / 100) * 100 : 400
}

function FontWeightTool({ family, currentWeight }: { family: string; currentWeight: number }) {
  const editor = useEditor()
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const currentLabel = WEIGHT_OPTIONS.find((o) => o.value === currentWeight)?.label ?? `${currentWeight}`

  return (
    <>
      <Tooltip label={t.toolbar.fontWeight} disabled={open}>
        <button
          ref={ref}
          type="button"
          className={ed.select}
          style={{ minWidth: 105, maxWidth: 130, padding: '7px 11px', fontSize: 13 }}
          aria-label={`${t.toolbar.fontWeight}: ${currentLabel}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="ed-font-weight"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={ed.selectValue} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentLabel}
          </span>
          {I.chevronDown}
        </button>
      </Tooltip>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} label={t.toolbar.fontWeight} placement="bottom" variant="plain" cover>
        <div className={ed.menuList} role="menu" style={{ minWidth: 150 }} onWheel={(e) => e.stopPropagation()}>
          {WEIGHT_OPTIONS.map((w) => (
            <button
              key={w.value}
              type="button"
              role="menuitemradio"
              aria-checked={currentWeight === w.value}
              className={ed.menuItem}
              data-testid={`ed-weight-${w.value}`}
              style={{ fontWeight: w.value }}
              onClick={() => {
                void editor.fonts.load(family, w.value).finally(() => {
                  editor.style.text({ fontWeight: w.value }, t.history.bold)
                })
                setOpen(false)
              }}
            >
              <span>{w.label}</span>
              <span style={{ fontSize: 11, opacity: 0.55 }}>{w.value}</span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}

export function TextSection() {
  const editor = useEditor()
  const sel = useSelection()
  const obj = sel.objects[0] ?? {}
  const stack = String(textValue(sel, 'fontFamily') ?? '')
  const family = primaryFamily(stack)
  const hasItalic = useHasItalic(family)
  const size = Math.round(Number(textValue(sel, 'fontSize') ?? 16))
  const fill = readFill(textValue(sel, 'fill'), '#1c1517')
  const weight = textValue(sel, 'fontWeight')
  const currentWeightNum = parseWeightNumber(weight)
  const italic = textValue(sel, 'fontStyle') === 'italic'
  const align = (typeof obj.textAlign === 'string' ? obj.textAlign : 'left') as (typeof ALIGN)[number]['id']
  const AlignIcon = ALIGN.find((a) => a.id === align)?.icon ?? I.alignLeft
  const textCase = typeof obj.textCase === 'string' ? obj.textCase : 'none'
  const lineHeight = Number(obj.lineHeight ?? 1.16)
  const spacing = Math.round(Number(obj.charSpacing ?? 0))
  const curve = typeof obj.curveAmount === 'number' ? obj.curveAmount : 0
  const multiline = String(obj.text ?? '').includes('\n')
  const rtl = obj.direction === 'rtl'
  const dirChoice = obj.textDir === 'ltr' || obj.textDir === 'rtl' ? obj.textDir : 'auto'

  return (
    <>
      <AiRewriteTextTool />
      <FontTool family={family} stack={stack} sample={String(obj.text ?? '')} />
      <FontWeightTool family={family} currentWeight={currentWeightNum} />
      <Stepper label={t.ctx.sizeInput} value={size} limit={FONT_SIZE} testId="ed-font-size" onChange={(n, key) => editor.style.text({ fontSize: n }, t.history.changeFontSize, key === 'step' ? 'size-step' : 'font-size')} />
      <ColorTool label={t.toolbar.textColor} value={fill} allowGradient testId="ed-text-color" onChange={(f, key) => editor.style.text({ fill: f }, t.history.changeTextColor, key ?? 'text-color')} />

      <ToolButton label={t.toolbar.bold} shortcut="Mod+B" pressed={isBold(weight)} testId="ed-bold" onClick={() => editor.style.text({ fontWeight: isBold(weight) ? 400 : 700 }, t.history.bold)}>
        {I.bold}
      </ToolButton>
      <ToolButton label={hasItalic ? t.toolbar.italic : t.ctx.noItalic(family)} shortcut="Mod+I" pressed={italic} disabled={!hasItalic} testId="ed-italic" onClick={() => editor.style.text({ fontStyle: italic ? 'normal' : 'italic' }, t.history.italic)}>
        {I.italic}
      </ToolButton>
      <ToolButton label={t.toolbar.underline} shortcut="Mod+U" pressed={!!textValue(sel, 'underline')} testId="ed-underline" onClick={() => editor.style.text({ underline: !textValue(sel, 'underline') }, t.history.underline)}>
        {I.underline}
      </ToolButton>

      <PopoverTool label={t.toolbar.alignTitle} trigger={AlignIcon} inline testId="ed-text-align">
        {(close) =>
          ALIGN.map((a) => (
            <ToolButton
              key={a.id}
              label={a.label}
              pressed={align === a.id}
              testId={`ed-align-${a.id}`}
              onClick={() => {
                editor.style.text({ textAlign: a.id }, t.history.alignText)
                close()
              }}
            >
              {a.icon}
            </ToolButton>
          ))
        }
      </PopoverTool>

      <PopoverTool label={t.toolbar.directionTitle} trigger={rtl ? <PilcrowLeft size={18} aria-hidden="true" /> : <PilcrowRight size={18} aria-hidden="true" />} flush testId="ed-text-direction">
        {(close) => (
          <div className={ed.menuList} role="menu">
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="menuitemradio"
                aria-checked={dirChoice === d.id}
                className={ed.menuItem}
                data-testid={`ed-direction-${d.id}`}
                onClick={() => {
                  editor.style.text({ direction: d.id }, t.history.textDirection)
                  close()
                }}
              >
                {d.label}
                {'hint' in d ? <span>{d.hint}</span> : null}
              </button>
            ))}
          </div>
        )}
      </PopoverTool>

      <PopoverTool label={t.toolbar.lineHeight} trigger={I.lineHeight} width={180} testId="ed-line-height">
        <LimitedNumber label={t.toolbar.lineHeight} value={lineHeight} limit={LINE_HEIGHT} testId="ed-line-height-input" onChange={(v) => editor.style.text({ lineHeight: v }, t.history.changeLineHeight, 'line-height')} />
      </PopoverTool>

      <PopoverTool label={t.toolbar.letterSpacing} trigger={I.spacing} width={180} testId="ed-letter-spacing">
        <LimitedNumber label={t.toolbar.letterSpacing} value={spacing} limit={LETTER_SPACING} testId="ed-letter-spacing-input" onChange={(v) => editor.style.text({ charSpacing: v }, t.history.changeLetterSpacing, 'char-spacing')} />
      </PopoverTool>

      <PopoverTool label={t.ctx.caseTitle} trigger={I.letterCase} flush testId="ed-case">
        {(close) => (
          <div className={ed.menuList} role="menu">
            {(textCase === 'none' ? CASES : [...CASES, RESTORE_CASE]).map((c) => (
              <button
                key={c.id}
                type="button"
                role="menuitemradio"
                aria-checked={textCase === c.id}
                className={ed.menuItem}
                data-testid={`ed-case-${c.id}`}
                onClick={() => {
                  editor.style.text({ textCase: c.id }, t.history.changeCase)
                  close()
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </PopoverTool>

      <PopoverTool label={t.toolbar.titleStyles} trigger={<Palette size={18} aria-hidden="true" />} width={300} testId="ed-title-styles">
        <TitleStylePicker />
      </PopoverTool>

      <PopoverTool label={t.toolbar.effects} trigger={<Sparkles size={18} aria-hidden="true" />} width={264} testId="ed-text-effects">
        <EffectsPanel text={true} />
      </PopoverTool>

      <PopoverTool label={multiline ? t.ctx.curveSingleLine : t.toolbar.curve} trigger={I.curve} width={200} disabled={multiline} testId="ed-curve">
        <div className={ed.propLabel}>{t.toolbar.curve}</div>
        <div className={ed.curveWrap}>
          <input type="range" className={ed.slider} min={-CURVE_MAX} max={CURVE_MAX} step={10} value={curve} aria-label={t.toolbar.curve} data-testid="ed-curve-range" onChange={(e) => editor.style.setCurve(Number(e.target.value))} />
          <span className={ed.curveTick} aria-hidden="true" />
        </div>
        <p className={ed.hintText}>{t.ctx.curveHelp}</p>
      </PopoverTool>

      <OpacityTool />
    </>
  )
}
