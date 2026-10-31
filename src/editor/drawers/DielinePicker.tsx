import { useEditor, useEditorState } from '../context'
import { DIELINE_GROUPS, dielineById, dielineSizePx, dielinesIn, mmToPx, type Dieline } from '../packaging/dielines'
import { usePackagingGuidesStore } from '../store/packagingGuidesStore'

const row = (active: boolean) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
  textAlign: 'left' as const,
  padding: '8px 10px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1px solid ${active ? '#99c229' : '#e2e8f0'}`,
  background: active ? 'rgba(153, 194, 41, 0.12)' : '#ffffff',
})

/** Standard packaging sizes: choosing one sizes the design to the flat, records it as the design's dieline and shows its folds. */
export function DielinePicker() {
  const editor = useEditor()
  const activeId = useEditorState((s) => s.doc.meta?.dielineId)
  const active = dielineById(activeId)
  const store = usePackagingGuidesStore()

  const apply = (d: Dieline) => {
    const { width, height } = dielineSizePx(d)
    editor.pages.resize(width, height, 'scale')
    editor.pages.setDieline(d.id, mmToPx(d.bleedMm))
    if (!store.showCreases) store.toggleCreases()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Standard dielines</p>
      {active ? (
        <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
          <strong style={{ color: '#0f172a' }}>{active.name}</strong>
          <div>{active.description}</div>
          <button type="button" onClick={() => editor.pages.setDieline(undefined)} style={{ marginTop: 6, border: 'none', background: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            Detach dieline
          </button>
        </div>
      ) : null}
      {DIELINE_GROUPS.map((g) => (
        <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{g.label}</span>
          {dielinesIn(g.id).map((d) => (
            <button key={d.id} type="button" onClick={() => apply(d)} style={row(d.id === activeId)} aria-pressed={d.id === activeId}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{d.name}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {d.widthMm} × {d.heightMm} mm · {d.panels.length} panel{d.panels.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
