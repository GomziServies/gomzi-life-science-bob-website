import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Box, Download, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEditor, useEditorState } from '../context'
import { pxToMm } from '../engine/units'
import { dielineById } from '../packaging/dielines'
import {
  ZOOM_MAX,
  ZOOM_MIN,
  cameraDistance,
  clampZoom,
  containerFor,
  cylinderSpec,
  faceMap,
  panelUv,
  sceneScale,
  textureMultiplier,
  wrapOffset,
  type MockupContainer,
} from '../packaging/mockupMap'
import { usePackagingGuidesStore } from '../store/packagingGuidesStore'

/** How the label's paper reacts to light, for each finish. The default matte keeps a faint sheen so colours are not flat. */
const FINISHES = {
  matte: { roughness: 0.5, metalness: 0.0, clearcoat: 0.12, clearcoatRoughness: 0.4 },
  gloss: { roughness: 0.16, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.06 },
  gold_foil: { roughness: 0.22, metalness: 0.88, clearcoat: 0.6, clearcoatRoughness: 0.12 },
  silver_chrome: { roughness: 0.14, metalness: 0.95, clearcoat: 0.85, clearcoatRoughness: 0.08 },
} as const

type Finish = keyof typeof FINISHES

export function Packaging3dMockupModal() {
  const editor = useEditor()
  const { showMockup3d, setShowMockup3d } = usePackagingGuidesStore()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // The model follows the design's dieline until the person picks one by hand.
  const dielineId = useEditorState((st) => st.doc.meta?.dielineId)
  const docWidth = useEditorState((st) => st.doc.width)
  const docHeight = useEditorState((st) => st.doc.height)
  const [picked, setPicked] = useState<MockupContainer | null>(null)
  const containerType: MockupContainer = picked ?? (dielineById(dielineId) ? containerFor(dielineById(dielineId)!) : 'tub')
  const [materialFinish, setMaterialFinish] = useState<Finish>('matte')
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [lidColor, setLidColor] = useState<string>('#111827')
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(1)

  const isDraggingRef = useRef<boolean>(false)
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.1, y: 0 })
  const zoomRef = useRef<number>(1)
  const captureRef = useRef<(() => string) | null>(null)

  const applyZoom = useCallback((z: number) => {
    const next = clampZoom(z)
    zoomRef.current = next
    setZoom(next)
  }, [])

  // The label's real size: its dieline's, else the page's own.
  const dielineNow = dielineById(dielineId)
  const labelWidthMm = dielineNow ? dielineNow.widthMm : pxToMm(docWidth)
  const labelHeightMm = dielineNow ? dielineNow.heightMm : pxToMm(docHeight)
  const sizeNote =
    containerType === 'tub' || containerType === 'can'
      ? (() => {
          const s = cylinderSpec(labelWidthMm, labelHeightMm, containerType)
          return `Real size: label ${Math.round(labelWidthMm)} × ${Math.round(labelHeightMm)} mm on a Ø${Math.round(s.radiusMm * 2)} mm × ${Math.round(s.totalHeightMm)} mm ${containerType === 'tub' ? 'jar' : 'can'}`
        })()
      : 'Interactive 360° wrap & material lighting preview'

  useEffect(() => {
    if (!showMockup3d || !canvasRef.current) return

    let animationFrameId = 0
    const canvas = canvasRef.current
    const width = canvas.clientWidth || 700
    const height = canvas.clientHeight || 500

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#ffffff')

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.05, 100)

    // 2. WebGL Renderer: real colours (no tone mapping), the card's own sharpest filtering
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

    // 3. Studio reflections and light: an environment gives the label and the lid something to reflect (flat ambient light alone looks dull)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envMap
    scene.environmentIntensity = 0.85

    scene.add(new THREE.AmbientLight(0xffffff, 0.22))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.55)
    keyLight.position.set(3, 5, 4)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.bias = -0.0004
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45)
    fillLight.position.set(-4, 2, -2)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rimLight.position.set(0, -3, 2)
    scene.add(rimLight)

    // 4. The design, exported as sharp as this graphics card allows
    const sharpen = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = maxAnisotropy
      tex.generateMipmaps = true
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.needsUpdate = true
      return tex
    }

    const doc = editor.state.doc
    const activeCanvas = editor.activeView()?.canvas
    let labelTexture: THREE.Texture
    let artUrl: string | null = null

    if (activeCanvas) {
      artUrl = activeCanvas.toDataURL({ format: 'png', multiplier: textureMultiplier(doc.width, renderer.capabilities.maxTextureSize) })
      labelTexture = sharpen(new THREE.TextureLoader().load(artUrl))
    } else {
      const offscreen = document.createElement('canvas')
      offscreen.width = 2048
      offscreen.height = 1024
      const ctx = offscreen.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, 2048, 1024)
        ctx.fillStyle = '#99c229'
        ctx.font = 'bold 96px sans-serif'
        ctx.fillText('Packaging Mockup', 200, 520)
      }
      labelTexture = sharpen(new THREE.CanvasTexture(offscreen))
    }

    labelTexture.wrapS = THREE.RepeatWrapping
    labelTexture.wrapT = THREE.ClampToEdgeWrapping

    const dieline = dielineById(doc.meta?.dielineId)
    /** A copy of the artwork showing one panel of the flat (the dieline's panel window in UV space). */
    const panelTexture = (panelId: string): THREE.Texture => {
      const tex = sharpen(artUrl ? new THREE.TextureLoader().load(artUrl) : labelTexture.clone())
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      if (dieline) {
        const w = panelUv(dieline, panelId)
        tex.repeat.set(w.repeatX, w.repeatY)
        tex.offset.set(w.offsetX, w.offsetY)
      }
      return tex
    }
    // A wrap label goes all the way round a cylinder, starting from the middle of the facing panel.
    if (dieline && (containerType === 'tub' || containerType === 'can')) labelTexture.offset.x = wrapOffset(dieline)

    // 5. The model, in millimetres turned to scene units
    const modelGroup = new THREE.Group()
    const finish = FINISHES[materialFinish] ?? FINISHES.matte
    if (materialFinish === 'gold_foil') {
      const goldSpecLight = new THREE.DirectionalLight(0xffdf80, 0.9)
      goldSpecLight.position.set(2, 3, 2)
      scene.add(goldSpecLight)
    }

    const labelMaterial = new THREE.MeshPhysicalMaterial({ map: labelTexture, roughness: finish.roughness, metalness: finish.metalness, clearcoat: finish.clearcoat, clearcoatRoughness: finish.clearcoatRoughness, envMapIntensity: 0.9 })
    const lidMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(lidColor), roughness: 0.32, metalness: 0.3, envMapIntensity: 1 })
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.38, metalness: 0.05 })
    const faces = dieline ? faceMap(dieline) : null
    const faceMaterial = (id: string | undefined) =>
      id ? new THREE.MeshPhysicalMaterial({ map: panelTexture(id), roughness: finish.roughness, metalness: finish.metalness, clearcoat: finish.clearcoat, envMapIntensity: 0.9 }) : labelMaterial

    const labelW = dieline ? dieline.widthMm : pxToMm(doc.width)
    const labelH = dieline ? dieline.heightMm : pxToMm(doc.height)
    let extent = 2.6 // the model's biggest size, in scene units
    let centreY = 0 // where the model's middle is, so it turns about it

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], y: number, shadow = true) => {
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = y
      mesh.castShadow = shadow
      mesh.receiveShadow = true
      modelGroup.add(mesh)
      return mesh
    }

    if (containerType === 'tub' || containerType === 'can') {
      const spec = cylinderSpec(labelW, labelH, containerType)
      const k = sceneScale(Math.max(spec.totalHeightMm, spec.maxWidthMm))
      const r = spec.radiusMm * k
      const bodyH = spec.bodyHeightMm * k
      const labelHs = spec.labelHeightMm * k
      const baseH = spec.baseHeightMm * k
      const lidH = spec.lidHeightMm * k
      const lidR = spec.lidRadiusMm * k
      const shoulderH = spec.shoulderMm * k
      const segments = 160

      let y = 0
      add(new THREE.CylinderGeometry(r * 0.985, r, baseH, segments), lidMaterial, y + baseH / 2) // the base
      y += baseH
      add(new THREE.CylinderGeometry(r * 0.996, r * 0.996, bodyH, segments), bodyMaterial, y + bodyH / 2) // the body under the label
      const labelMesh = add(new THREE.CylinderGeometry(r, r, labelHs, segments, 1, true), labelMaterial, y + bodyH / 2) // the label, once round
      labelMesh.material = labelMaterial
      y += bodyH
      if (shoulderH > 0) {
        add(new THREE.CylinderGeometry(lidR * 0.99, r, shoulderH, segments), bodyMaterial, y + shoulderH / 2) // the shoulder up to the lid
        y += shoulderH
      }
      add(new THREE.CylinderGeometry(lidR, lidR, lidH, segments), lidMaterial, y + lidH / 2) // the lid
      if (containerType === 'tub') {
        for (let i = 1; i <= 5; i += 1) {
          // grip ridges round the lid
          add(new THREE.CylinderGeometry(lidR * 1.006, lidR * 1.006, lidH * 0.018, segments), lidMaterial, y + (lidH * i) / 6, false)
        }
      }
      add(new THREE.CylinderGeometry(lidR * 0.96, lidR, lidH * 0.04, segments), lidMaterial, y + lidH + lidH * 0.02, false) // the lid's top edge
      const total = baseH + bodyH + shoulderH + lidH
      centreY = total / 2
      extent = Math.max(total, lidR * 2)
    } else if (containerType === 'pouch') {
      // Stand-up pouch: a flat bag, the front and back panels of the dieline on its two faces
      const pw = 1.7
      const ph = dieline ? Math.min(2.6, Math.max(1.4, (pw * dieline.heightMm) / Math.max(1, faces ? dieline.panels.find((q) => q.id === faces.front)!.w : dieline.widthMm))) : 2.2
      const edge = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, metalness: 0.1 })
      const pouchMesh = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.34), [edge, edge, edge, edge, faceMaterial(faces?.front), faceMaterial(faces?.back)])
      pouchMesh.castShadow = true
      modelGroup.add(pouchMesh)
      const sealMesh = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.02, 0.2, 0.36), lidMaterial)
      sealMesh.position.y = ph / 2 - 0.1
      modelGroup.add(sealMesh)
      extent = Math.max(ph, pw)
    } else {
      // Carton: the net's front, sides and back folded round a box; the flaps become the top and bottom
      const bw = 1.3
      const bh = dieline ? Math.min(2.6, Math.max(1.0, (bw * (dieline.hFolds.length === 2 ? dieline.hFolds[1] - dieline.hFolds[0] : dieline.heightMm)) / Math.max(1, dieline.panels.find((q) => q.id === faces?.front)?.w ?? dieline.widthMm))) : 1.9
      const bd = dieline && faces ? Math.min(1.6, Math.max(0.3, (bw * (dieline.panels.find((q) => q.id === faces.side)?.w ?? 1)) / Math.max(1, dieline.panels.find((q) => q.id === faces.front)?.w ?? 1))) : 0.6
      const paper = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, metalness: 0 })
      const side = faceMaterial(faces?.side)
      // BoxGeometry face order: +x, -x, +y, -y, +z, -z
      const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [side, side, paper, paper, faceMaterial(faces?.front), faceMaterial(faces?.back)])
      boxMesh.castShadow = true
      modelGroup.add(boxMesh)
      extent = Math.max(bh, bw)
    }

    // The model's middle sits at the origin; the floor is under its feet.
    modelGroup.children.forEach((child) => {
      child.position.y -= centreY
    })
    scene.add(modelGroup)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -(centreY || extent / 2) - 0.005
    floor.receiveShadow = true
    scene.add(floor)

    // 6. Render loop: the turn, the camera that follows the zoom, and a still capture at a higher resolution
    const frame = () => {
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight)
      const target = cameraDistance(extent, camera.fov, aspect, zoomRef.current)
      camera.position.z += (target - camera.position.z) * 0.2
      camera.position.y = extent * 0.1
      camera.lookAt(0, 0, 0)
    }
    camera.position.z = cameraDistance(extent, camera.fov, width / height, zoomRef.current)

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (autoRotate && !isDraggingRef.current) rotationRef.current.y += 0.008
      modelGroup.rotation.y = rotationRef.current.y
      modelGroup.rotation.x = rotationRef.current.x
      frame()
      renderer.render(scene, camera)
    }
    animate()

    captureRef.current = () => {
      const w = canvas.clientWidth || width
      const h = canvas.clientHeight || height
      const before = renderer.getPixelRatio()
      renderer.setPixelRatio(3)
      renderer.setSize(w, h, false)
      renderer.render(scene, camera)
      const url = canvas.toDataURL('image/png')
      renderer.setPixelRatio(before)
      renderer.setSize(w, h, false)
      return url
    }

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(canvas)

    // 7. Drag to turn, wheel or pinch to zoom
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      prevMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const deltaX = e.clientX - prevMouseRef.current.x
      const deltaY = e.clientY - prevMouseRef.current.y
      prevMouseRef.current = { x: e.clientX, y: e.clientY }
      rotationRef.current.y += deltaX * 0.009
      rotationRef.current.x = Math.max(-0.5, Math.min(0.5, rotationRef.current.x + deltaY * 0.006))
    }
    const onMouseUp = () => {
      isDraggingRef.current = false
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12))
    }
    let pinch = 0
    const touchGap = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = touchGap(e)
        isDraggingRef.current = false
      } else if (e.touches.length === 1) {
        isDraggingRef.current = true
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch > 0) {
        const now = touchGap(e)
        applyZoom(zoomRef.current * (now / pinch))
        pinch = now
        return
      }
      if (!isDraggingRef.current || e.touches.length === 0) return
      const deltaX = e.touches[0].clientX - prevMouseRef.current.x
      const deltaY = e.touches[0].clientY - prevMouseRef.current.y
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      rotationRef.current.y += deltaX * 0.009
      rotationRef.current.x = Math.max(-0.5, Math.min(0.5, rotationRef.current.x + deltaY * 0.006))
    }
    const onTouchEnd = () => {
      isDraggingRef.current = false
      pinch = 0
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      cancelAnimationFrame(animationFrameId)
      observer?.disconnect()
      captureRef.current = null
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      envMap.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
  }, [showMockup3d, containerType, materialFinish, autoRotate, lidColor, editor, applyZoom])

  if (!showMockup3d) return null

  const downloadScreenshot = () => {
    if (!canvasRef.current) return
    setIsCapturing(true)
    try {
      const dataUrl = captureRef.current ? captureRef.current() : canvasRef.current.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `3D-Packaging-Mockup-${containerType}.png`
      a.click()
    } finally {
      setIsCapturing(false)
    }
  }

  const chip = (active: boolean) => ({
    padding: '5px 12px',
    fontSize: 11,
    fontWeight: 600,
    border: 'none',
    borderRadius: 9999,
    cursor: 'pointer',
    background: active ? '#99c229' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    boxShadow: active ? '0 2px 6px rgba(153, 194, 41, 0.35)' : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  })
  const roundButton = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: 'calc(100vh - 48px)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(153, 194, 41, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#99c229' }}>
              <Box size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>3D Smartmockup Packaging Preview</h3>
              <p data-testid="mockup-size-note" style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                {sizeNote}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPicked(null)
              setShowMockup3d(false)
            }}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D Canvas Body */}
        <div style={{ position: 'relative', width: '100%', height: 'min(380px, 48vh)', flexShrink: 0, background: '#ffffff' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }} />

          {/* Floating instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 16,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              border: '1px solid #e2e8f0',
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 500,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            <RotateCw size={13} style={{ color: '#99c229' }} /> Drag to turn · scroll or pinch to zoom
          </div>

          {/* Zoom */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              padding: '5px 10px',
              borderRadius: 9999,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => applyZoom(zoom / 1.25)} style={roundButton}>
              <ZoomOut size={15} />
            </button>
            <input
              type="range"
              aria-label="Zoom"
              min={Math.round(ZOOM_MIN * 100)}
              max={Math.round(ZOOM_MAX * 100)}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(e) => applyZoom(Number(e.target.value) / 100)}
              style={{ width: 120, accentColor: '#99c229' }}
            />
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => applyZoom(zoom * 1.25)} style={roundButton}>
              <ZoomIn size={15} />
            </button>
            <span data-testid="mockup-zoom" style={{ minWidth: 40, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" aria-label="Reset zoom" title="Fit to view" onClick={() => applyZoom(1)} style={roundButton}>
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Controls Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Packaging Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Container:</span>
            <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', padding: '3px 4px', borderRadius: 9999 }}>
              {(['tub', 'pouch', 'can', 'box'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setPicked(type)} style={{ ...chip(containerType === type), textTransform: 'capitalize' }}>
                  {type === 'tub' ? 'Tub / Jar' : type === 'pouch' ? 'Pouch' : type === 'box' ? 'Box' : 'Can / Bottle'}
                </button>
              ))}
            </div>
          </div>

          {/* Material Finish Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Finish:</span>
            <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', padding: '3px 4px', borderRadius: 9999 }}>
              {(
                [
                  { id: 'matte', label: 'Matte' },
                  { id: 'gloss', label: 'High Gloss' },
                  { id: 'gold_foil', label: 'Gold Foil' },
                  { id: 'silver_chrome', label: 'Silver Chrome' },
                ] as const
              ).map((f) => (
                <button key={f.id} type="button" onClick={() => setMaterialFinish(f.id)} style={chip(materialFinish === f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lid Color Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Cap / Lid:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#111827', '#d4af37', '#ffffff', '#99c229', '#0284c7', '#dc2626'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLidColor(color)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: color,
                    border: lidColor === color ? '2px solid #99c229' : '1px solid #cbd5e1',
                    boxShadow: lidColor === color ? '0 0 0 2px rgba(153, 194, 41, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setAutoRotate((r) => !r)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: autoRotate ? 'rgba(153, 194, 41, 0.15)' : '#f8fafc',
                color: autoRotate ? '#5b7a10' : '#64748b',
                border: '1px solid',
                borderColor: autoRotate ? '#99c229' : '#e2e8f0',
                borderRadius: 9999,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCw size={13} style={{ color: autoRotate ? '#99c229' : '#64748b' }} /> {autoRotate ? 'Auto-Spin: ON' : 'Auto-Spin: OFF'}
            </button>

            <button
              type="button"
              onClick={downloadScreenshot}
              disabled={isCapturing}
              style={{
                background: '#99c229',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                padding: '8px 18px',
                borderRadius: 9999,
                border: 'none',
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 4px 14px rgba(153, 194, 41, 0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              <Download size={15} style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: 700 }}>Download 3D Mockup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
