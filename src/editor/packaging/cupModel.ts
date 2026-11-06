import * as THREE from 'three'
import { cupShape, wrapPoint, type CupFit } from './cupWrap'

/**
 * The peanut butter cup for the 3D mockup, built from a cup label's measured wrap (see cupWrap.ts): a tapered side whose
 * every point takes its colour from the matching point of the curved wrap in the picture, a white snap-on lid with a lip,
 * small ridges and a raised ring, and the round sticker on the lid. The model stands on y = 0.
 */
export interface CupModel {
  group: THREE.Group
  /** Its full height and widest size, in scene units. */
  height: number
  width: number
}

/** The lid, in mm of a cup whose top radius is 52.5 mm (as the real 510 g cup): [radius, height above the top of the side]. */
const LID: Array<[number, number]> = [
  [52.8, -0.5],
  [55.2, -0.5],
  [55.8, 0.3],
  [55.8, 4.6],
  [55, 5],
  [55, 19.8],
  [54.6, 21.1],
  [53.6, 22.7],
  [50.4, 22.7],
  [49.4, 22],
  [0, 22],
]
const TOP_MM = 52.5
const LID_TOP_MM = 22
const LID_FLAT_MM = 49.4

/**
 * @param texture makes a new texture of the label picture (the whole page, already loaded); the side and the sticker each take one
 * @param size the model's height in scene units
 */
export function buildCupModel(fit: CupFit, texture: () => THREE.Texture, finish: { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number }, lidColor: string, size = 2.3): CupModel {
  const shape = cupShape(fit)
  // scene units per picture pixel, so the side and the lid together are `size` high
  const mm = shape.rTop / TOP_MM // picture pixels per mm of the real cup
  const k = size / (shape.height + LID_TOP_MM * mm)
  const group = new THREE.Group()
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat)
    m.castShadow = true
    m.receiveShadow = true
    group.add(m)
    return m
  }

  // the side: rows up the cup, columns round it; the middle of the wrap faces the front (+z)
  const N = 192
  const M = 16
  const pos: number[] = []
  const uv: number[] = []
  for (let j = 0; j <= M; j++) {
    const t = j / M
    const r = (shape.rBottom + (shape.rTop - shape.rBottom) * t) * k
    const y = shape.height * t * k
    for (let i = 0; i <= N; i++) {
      const s = i / N
      const a = (s - 0.5) * Math.PI * 2
      pos.push(r * Math.sin(a), y, r * Math.cos(a))
      const p = wrapPoint(fit, s, t)
      uv.push(p.x / fit.width, 1 - p.y / fit.height)
    }
  }
  const index: number[] = []
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i
      const c = a + N + 1
      index.push(a, a + 1, c + 1, a, c + 1, c)
    }
  }
  const side = new THREE.BufferGeometry()
  side.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  side.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  side.setIndex(index)
  side.computeVertexNormals()
  const sideArt = texture()
  sideArt.wrapS = THREE.ClampToEdgeWrapping
  sideArt.wrapT = THREE.ClampToEdgeWrapping
  sideArt.repeat.set(1, 1)
  sideArt.offset.set(0, 0)
  sideArt.needsUpdate = true
  mesh(side, new THREE.MeshPhysicalMaterial({ map: sideArt, side: THREE.DoubleSide, envMapIntensity: 0.9, ...finish }))

  // the white plastic: the foot under the side, and the lid
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0xf7f7f4, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.9, side: THREE.DoubleSide })
  const foot = mesh(new THREE.CircleGeometry(shape.rBottom * k, 96), plastic)
  foot.rotation.x = Math.PI / 2
  foot.position.y = 0.001

  const lidMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(lidColor), roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.9, side: THREE.DoubleSide })
  const top = shape.height * k
  const u = mm * k // scene units per mm
  mesh(new THREE.LatheGeometry(LID.map(([r, y]) => new THREE.Vector2(r * u, top + y * u)), 160), lidMat)
  // small ridges round the lip
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9 * u, 3.4 * u, 0.7 * u), lidMat, 64)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2
    m4.compose(new THREE.Vector3(Math.sin(a) * 56 * u, top + 2.3 * u, Math.cos(a) * 56 * u), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), new THREE.Vector3(1, 1, 1))
    ribs.setMatrixAt(i, m4)
  }
  ribs.castShadow = true
  group.add(ribs)

  // the round sticker on the lid, cut from its place in the picture; its top faces the back of the cup, as when the cup is read from the front
  if (fit.lid) {
    const r = Math.min(fit.lid.r * k, LID_FLAT_MM * u)
    const stickerArt = texture()
    stickerArt.wrapS = THREE.ClampToEdgeWrapping
    stickerArt.wrapT = THREE.ClampToEdgeWrapping
    stickerArt.repeat.set((2 * fit.lid.r) / fit.width, (2 * fit.lid.r) / fit.height)
    stickerArt.offset.set((fit.lid.x - fit.lid.r) / fit.width, 1 - (fit.lid.y + fit.lid.r) / fit.height)
    stickerArt.needsUpdate = true
    const sticker = mesh(new THREE.CircleGeometry(r, 128), new THREE.MeshPhysicalMaterial({ map: stickerArt, envMapIntensity: 0.9, ...finish }))
    sticker.rotation.x = -Math.PI / 2
    sticker.position.y = top + LID_TOP_MM * u + 0.002
  }

  return { group, height: top + 22.7 * u, width: 2 * 56.2 * u }
}
