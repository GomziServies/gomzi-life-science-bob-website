import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TUB } from './tubProfile';

export interface JarSceneProps {
  /** The label wrap, drawn: the middle of the picture faces the front. */
  wrap: HTMLCanvasElement | null;
  /** The label's printed size in mm. */
  mm: { w: number; h: number };
  kind: 'tub' | 'jar' | 'bottle' | 'pouch' | 'sachet';
  jarColor: string;
  /** The design's main colour: the protein tub's lid takes it. */
  accent?: string;
  /** Share of the wrap taken by the left, middle and right panels. */
  panels: [number, number, number];
  className?: string;
  /** Turn from panel to panel by itself (default). Off: the jar stays on its front panel until it is dragged. */
  autoTurn?: boolean;
  /** Called when the browser cannot draw 3D. */
  onUnsupported?: () => void;
  /** Called once with a picture of the finished pack (a PNG) as soon as its model and label are drawn: a product card shows these instead of a live 3D view. */
  onSnapshot?: (dataUrl: string) => void;
  /** The visitor can zoom the pack in and out right on it: scroll over it, or pinch it. There are no buttons. */
  zoomable?: boolean;
}

// Jar shapes, in units of the jar's radius: shoulder height, neck radius, cap radius and height
// tub: the big wide-mouth protein tub with a wide ridged lid; jar: the shorter 250 g jar; bottle: the tall tablet bottle with a small cap
const SHAPE = {
  // like a real protein tub: a tall body, a big rounded shoulder, a narrow neck and a smaller lid
  tub: { rb: 0.26, shoulder: 0.66, neck: 0.62, neckH: 0.12, cap: 0.68, capH: 0.44, ribs: 72 },
  jar: { rb: 0.12, shoulder: 0.15, neck: 0.9, neckH: 0, cap: 0.95, capH: 0.46, ribs: 84 },
  bottle: { rb: 0.1, shoulder: 0.5, neck: 0.66, neckH: 0.2, cap: 0.76, capH: 0.5, ribs: 56 },
} as const;

/** A jar is shown at its real size next to the others: nothing is drawn smaller than this height (mm) in the frame, so a protein tub looks big and a bottle looks small. */
const FRAME_MM = 150;

/** The protein tub: a 3D model (public/models/protein-jar.obj): a body, a lid with its ridges and a label band whose picture wraps once round. Loaded once. */
const JAR_MODEL = {
  url: `${import.meta.env.BASE_URL}models/protein-jar.obj`,
  /** The label band's radius, bottom and top in the model's own units, and the lid's top. */
  labelR: 1.44,
  labelY0: 0.71,
  labelY1: 2.84,
  top: 4.37,
};
/** The capsule / tablet bottle: a 3D model (public/models/pill-bottle.obj, drawn with z up): the bottle (Body1), its cap (Body2) and a label band (Body5); Body3 and Body4 are loose pieces beside it and are left out. */
const PILL_MODEL = {
  url: `${import.meta.env.BASE_URL}models/pill-bottle.obj`,
  /** In the model's own units: the bottle's radius, the label band's bottom and top, and the cap's top. */
  r: 2.903,
  y0: 1.2,
  y1: 7.9,
  top: 10.9,
};
/** The band's size: fixed, as for the protein bottle (its circumference at the usual 177.8 mm label width, and its height in proportion). */
const PILL_BAND_MM = { w: 177.8, h: (177.8 * (PILL_MODEL.y1 - PILL_MODEL.y0)) / (2 * Math.PI * PILL_MODEL.r) };
let pillModel: Promise<THREE.Group> | null = null;
const loadPill = () => (pillModel ??= new OBJLoader().loadAsync(PILL_MODEL.url).catch((e) => {
  pillModel = null;
  throw e;
}));

/** The protein bottle's label band is a fixed size (its circumference by its height, in mm at the tub's usual 450 mm wrap): the bottle never changes shape, any label is fitted onto this band. */
const TUB_BAND_MM = { w: 450, h: (450 * (JAR_MODEL.labelY1 - JAR_MODEL.labelY0)) / (2 * Math.PI * JAR_MODEL.labelR) };

/** Fits a label of any size onto the bottle's band: its proportions are kept, and any gap round it is filled with the label's own edge colour. */
function fitToBand(src: HTMLCanvasElement, labelAspect: number, bandA = TUB_BAND_MM.w / TUB_BAND_MM.h): HTMLCanvasElement {
  const W = Math.min(4096, Math.max(1024, src.width));
  const H = Math.round(W / bandA);
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const cx = out.getContext('2d')!;
  // the average colour of a strip along one edge of the label
  const avg = (sx: number, sy: number, sw: number, sh: number) => {
    const t = document.createElement('canvas');
    t.width = 1;
    t.height = 1;
    const tc = t.getContext('2d')!;
    tc.imageSmoothingQuality = 'high';
    tc.drawImage(src, sx, sy, sw, sh, 0, 0, 1, 1);
    const d = tc.getImageData(0, 0, 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  };
  const strip = Math.max(2, Math.round(Math.min(src.width, src.height) * 0.02));
  if (labelAspect >= bandA) {
    // a wide, low label: it goes right round the bottle, with a band above and below
    const h = Math.round(W / labelAspect);
    const y = Math.round((H - h) / 2);
    cx.fillStyle = avg(0, 0, src.width, strip);
    cx.fillRect(0, 0, W, y + 1);
    cx.fillStyle = avg(0, src.height - strip, src.width, strip);
    cx.fillRect(0, y + h - 1, W, H - y - h + 1);
    cx.drawImage(src, 0, y, W, h);
  } else {
    // a taller label: it fills the band's height, centred on the front, and the rest of the way round is its edge colour
    const w = Math.round(H * labelAspect);
    const x = Math.round((W - w) / 2);
    cx.fillStyle = avg(0, 0, strip, src.height);
    cx.fillRect(0, 0, x + 1, H);
    cx.fillStyle = avg(src.width - strip, 0, strip, src.height);
    cx.fillRect(x + w - 1, 0, W - x - w + 1, H);
    cx.drawImage(src, x, 0, w, H);
  }
  return out;
}

let jarModel: Promise<THREE.Group> | null = null;
const loadJar = () => (jarModel ??= new OBJLoader().loadAsync(JAR_MODEL.url).catch((e) => {
  jarModel = null;
  throw e;
}));

/** The stand-up pouch: a 3D model (public/models/pouch.glb) with a front face, a back face and its own zip and seals. The label goes on the two faces. */
const POUCH_MODEL = {
  url: `${import.meta.env.BASE_URL}models/pouch.glb`,
  w: 0.12,
  h: 0.2,
  /** Where each face sits in the model's square picture (shares of the picture, from its top left): the label is drawn into this box. */
  uv: { x0: 0.1987, x1: 0.8057, y0: 0.0917, y1: 0.933 },
};
let pouchModel: Promise<THREE.Group> | null = null;
const loadPouch = () => (pouchModel ??= new GLTFLoader().loadAsync(POUCH_MODEL.url).then((g) => g.scene).catch((e) => {
  pouchModel = null;
  throw e;
}));

/** The sachet: a 3D model (public/models/sachet.glb) with a picture atlas: the front design on its right half, the back design on its left (drawn upside down). */
const SACHET_MODEL = {
  url: `${import.meta.env.BASE_URL}models/sachet.glb`,
  /** The model's size (width across the faces, height) and where each face sits in the atlas (shares of the picture, from its top left). */
  w: 156,
  h: 210,
  front: { x0: 0.495, x1: 0.972, y0: 0.157, y1: 0.655 },
  back: { x0: 0.015, x1: 0.495, y0: 0.157, y1: 0.655 },
};
let sachetModel: Promise<THREE.Group> | null = null;
const loadSachet = () => (sachetModel ??= new GLTFLoader().loadAsync(SACHET_MODEL.url).then((g) => g.scene).catch((e) => {
  sachetModel = null;
  throw e;
}));

/** The small jar (BCAA, creatine, pre-workout): a 3D model (public/models/small-jar.glb), a jar with its lid and a label band. The label's picture lives in an
 * atlas turned on its side: along the atlas' height it goes once round the jar (the middle faces the front), across its width it runs from the label's top to its bottom. */
const SMALL_JAR_MODEL = {
  url: `${import.meta.env.BASE_URL}models/small-jar.glb`,
  /** In the model's own units (metres): the label's mean radius, its bottom and top, and the whole jar's bottom and top. */
  labelR: 0.0464,
  labelY0: -0.0413,
  labelY1: 0.0262,
  bottom: -0.0472,
  top: 0.0455,
  /** The label's width in the atlas (shares of the picture): from the label's top to its bottom. */
  u0: 0.0245,
  u1: 0.2565,
  /** The label's two ends meet 12 degrees round from the model's front: the model is turned (degrees) to put that join at the back. */
  turn: 168,
};
let smallJarModel: Promise<THREE.Group> | null = null;
const loadSmallJar = () => (smallJarModel ??= new GLTFLoader().loadAsync(SMALL_JAR_MODEL.url).then((g) => g.scene).catch((e) => {
  smallJarModel = null;
  throw e;
}));

/** Loads every 3D model now, so the first card that needs one does not wait for it. */
export const preloadModels = (): Promise<unknown> => Promise.all([loadJar, loadPouch, loadSachet, loadSmallJar, loadPill].map((load) => load().catch(() => undefined)));

/**
 * The bottom of a tablet bottle, like the real black bottle: a wide, softly rounded base corner, and the wall narrowing a little towards the
 * foot instead of ending in a hard edge. From the centre of the base out to the wall at height `top`.
 */
function bottleBase(wallR: number, corner: number, inset: number, top: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  const rc = wallR - inset - corner;
  pts.push(new THREE.Vector2(rc, 0));
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push(new THREE.Vector2(rc + corner * Math.sin(a), corner - corner * Math.cos(a)));
  }
  // the wall eases out from the rounded corner up to its full width
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const k = t * t * (3 - 2 * t);
    pts.push(new THREE.Vector2(wallR - inset + inset * k, corner + (top - corner) * t));
  }
  return pts;
}


/** The front and back pictures of a bag from the label wrap: the front design on the front, the two side panels on the back, with the sealed edges drawn in. */
function bagFaces(wrap: HTMLCanvasElement, panels: [number, number, number], aspect: number, bg: string, pouch: boolean, drawSeals = true): [HTMLCanvasElement, HTMLCanvasElement] {
  const H = 1536;
  const W = Math.round(H * aspect);
  const seals = (ctx: CanvasRenderingContext2D) => {
    if (!drawSeals) return;
    const top = H * (pouch ? 0.07 : 0.1);
    const bot = H * (pouch ? 0.035 : 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(0, 0, W, top);
    ctx.fillRect(0, H - bot, W, bot);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    for (let y = 6; y < top; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let y = H - bot + 6; y < H; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    if (pouch) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, top * 1.8, W, 6);
    }
  };
  const make = (parts: [number, number][]) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // the wanted panels side by side as one strip, then that strip fills the bag between its sealed edges (a wide banner is cropped
    // evenly at the sides, never shrunk to a thin band across a white bag)
    const stripW = Math.round(parts.reduce((a, [, w]) => a + w, 0) * wrap.width);
    const strip = document.createElement('canvas');
    strip.width = stripW;
    strip.height = wrap.height;
    const sctx = strip.getContext('2d')!;
    let sx = 0;
    for (const [u0, uw] of parts) {
      sctx.drawImage(wrap, u0 * wrap.width, 0, uw * wrap.width, wrap.height, sx, 0, uw * wrap.width, wrap.height);
      sx += uw * wrap.width;
    }
    const top = H * (pouch ? 0.07 : 0.1);
    const bot = H * (pouch ? 0.035 : 0.1);
    const rx = W * 0.03;
    const rw = W * 0.94;
    const rh = H - top - bot;
    // the whole panel is shown, as wide as the bag allows; above and below it the bag carries the picture's own top and bottom colour
    const k = Math.min(rw / stripW, rh / wrap.height);
    const dw = stripW * k;
    const dh = wrap.height * k;
    const dy = top + (rh - dh) / 2;
    const dx = rx + (rw - dw) / 2;
    // beyond the design the bag carries its edge colours on, smoothed: each edge strip is averaged down to a soft gradient (no streaks from
    // fine detail), and the design fades into it instead of ending in a hard line
    const soft = (sx: number, sy: number, sw: number, sh: number, vertical: boolean): HTMLCanvasElement => {
      const t = document.createElement('canvas');
      t.width = vertical ? 1 : 48;
      t.height = vertical ? 48 : 1;
      const tc = t.getContext('2d')!;
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(strip, sx, sy, sw, sh, 0, 0, t.width, t.height);
      return t;
    };
    const band = Math.max(2, Math.round(wrap.height * 0.04));
    const bandW = Math.max(2, Math.round(stripW * 0.02));
    ctx.imageSmoothingQuality = 'high';
    if (dy > 1) {
      // the edge colour also runs in under the design's faded edges
      const under = dh * 0.1;
      ctx.drawImage(soft(0, 0, stripW, band, false), 0, 0, W, dy + under);
      ctx.drawImage(soft(0, wrap.height - band, stripW, band, false), 0, dy + dh - under, W, H - dy - dh + under);
    }
    if (dx > 1) {
      ctx.drawImage(soft(0, 0, bandW, wrap.height, true), 0, dy, dx + 2, dh);
      ctx.drawImage(soft(stripW - bandW, 0, bandW, wrap.height, true), dx + dw - 2, dy, W - dx - dw + 2, dh);
    }
    // the design itself, its top and bottom edges fading softly into the bag's colour
    const art = document.createElement('canvas');
    art.width = Math.round(dw);
    art.height = Math.round(dh);
    const actx = art.getContext('2d')!;
    actx.imageSmoothingQuality = 'high';
    actx.drawImage(strip, 0, 0, stripW, wrap.height, 0, 0, art.width, art.height);
    if (dy > 1) {
      const f = Math.min(0.06, (dy / dh) * 0.5 + 0.02);
      const mask = actx.createLinearGradient(0, 0, 0, art.height);
      mask.addColorStop(0, 'rgba(0,0,0,0)');
      mask.addColorStop(f, 'rgba(0,0,0,1)');
      mask.addColorStop(1 - f, 'rgba(0,0,0,1)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
      actx.globalCompositeOperation = 'destination-in';
      actx.fillStyle = mask;
      actx.fillRect(0, 0, art.width, art.height);
    }
    ctx.drawImage(art, dx, dy);
    seals(ctx);
    return c;
  };
  return [make([[panels[0], panels[1]]]), make([[panels[0] + panels[1], panels[2]], [0, panels[0]]])];
}

/** A jar with the label wrapped round it. It flips from panel to panel by itself and can be turned by hand. */
export default function JarScene({ wrap, mm, kind, jarColor, panels, className, autoTurn = true, onUnsupported, onSnapshot, zoomable = false }: JarSceneProps) {
  const snapRef = useRef(onSnapshot);
  snapRef.current = onSnapshot;
  const host = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLCanvasElement | null>(null);
  wrapRef.current = wrap;
  const autoRef = useRef(autoTurn);
  autoRef.current = autoTurn;
  const api = useRef<{ setWrap: (c: HTMLCanvasElement | null) => void } | null>(null);
  // how close the camera is: 1 is the whole pack in view
  const zoomRef = useRef(1);
  // where the pack is seen from: moved sideways / up-down (pan) and looked at from above or below (pitch)
  const panRef = useRef({ x: 0, y: 0 });
  const pitchRef = useRef(0);
  // the size of the view at zoom 1 (world units), set when the camera is placed
  const viewRef = useRef({ h: 1, aspect: 1, frame: 1 });
  const refit = useRef<() => void>(() => undefined);
  const keepPanInside = () => {
    const z = zoomRef.current;
    const lim = (viewRef.current.frame * 0.5 * (z - 1)) / z;
    panRef.current.x = Math.max(-lim, Math.min(lim, panRef.current.x));
    panRef.current.y = Math.max(-lim, Math.min(lim, panRef.current.y));
    if (z === 1) panRef.current = { x: 0, y: 0 };
  };
  /** Zoom to `z` (1 to 2.5); `nx`, `ny` is the point to zoom towards, from -0.5 to 0.5 across the view (the middle by default). */
  const applyZoom = (z: number, nx = 0, ny = 0) => {
    const old = zoomRef.current;
    const next = Math.min(2.5, Math.max(1, Math.round(z * 1000) / 1000));
    const k = 1 / old - 1 / next;
    panRef.current.x += nx * viewRef.current.h * viewRef.current.aspect * k;
    panRef.current.y -= ny * viewRef.current.h * k;
    zoomRef.current = next;
    keepPanInside();
    refit.current();
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onUnsupported?.();
      return;
    }
    // drawn at 2 to 3 times the screen's size and scaled down, so edges and small print stay sharp
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 2), snapRef.current ? 2.5 : 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping; // the colours of the label are shown as they were printed
    // a pack that can be zoomed and turned in every direction takes all touches itself: the page behind neither scrolls nor zooms
    renderer.domElement.style.cssText = `display:block;width:100%;height:100%;touch-action:${zoomable ? 'none' : 'pan-y'};cursor:grab`;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = 0.9;
    // soft, even light from every side: no hard shading and no shadow side
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 0.3);
    key.position.set(2.5, 4, 5);
    scene.add(key);

    // -- the jar, in units of its radius --
    const isBag = kind === 'pouch' || kind === 'sachet';
    const s = SHAPE[isBag ? 'jar' : kind];
    const isTub = kind === 'tub';
    // the protein bottle keeps its own shape: its band is a fixed size, whatever the label's size
    const isPill = kind === 'bottle';
    const dim = isTub ? TUB_BAND_MM : isPill ? PILL_BAND_MM : mm;
    const R = isBag ? 50 : dim.w / (2 * Math.PI * (isTub ? TUB.wallR : 1));
    const labelH = dim.h / R;
    const group = new THREE.Group();
    scene.add(group);

    const body = new THREE.MeshPhysicalMaterial({ color: jarColor, roughness: 0.7, clearcoat: 0, envMapIntensity: 0.8 });
    const capColor = new THREE.Color(0x141414); // every cap is black, whatever the label's colours
    const capMat = new THREE.MeshPhysicalMaterial({ color: capColor, roughness: 0.7, metalness: 0, clearcoat: 0, envMapIntensity: 0.8 });
    // the label is not lit: it shows exactly the picture, with no shadow and no shine
    const labelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(jarColor), toneMapped: false });
    // the label, wrapped right round; the middle of the picture faces the front
    const wrapBand = (radius: number, y: number) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, labelH, 192, 1, true, Math.PI, Math.PI * 2), labelMat);
      band.position.y = y + labelH / 2;
      group.add(band);
    };
    let total: number;
    let disposed = false;
    let smallLabel: THREE.Mesh | null = null;
    // a pack drawn from a model is ready when the model is in the scene; the others at once
    let modelReady = !(kind === 'pouch' || kind === 'sachet' || kind === 'tub' || kind === 'jar' || kind === 'bottle');
    let snapped = false;
    let snap = () => undefined as void;
    let bag: { front: THREE.MeshBasicMaterial; back: THREE.MeshBasicMaterial; aspect: number; plain?: boolean; atlas?: boolean; original?: CanvasImageSource | null } | null = null;

    if (kind === 'pouch') {
      // the pouch model, scaled to the pouch's size; its front and back faces take the label
      const bh = 240 / R;
      const k = bh / POUCH_MODEL.h;
      const front = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const back = front.clone();
      bag = { front, back, aspect: (POUCH_MODEL.uv.x1 - POUCH_MODEL.uv.x0) / (POUCH_MODEL.uv.y1 - POUCH_MODEL.uv.y0), plain: true };
      total = bh + 0.06;
      loadPouch()
        .then((model) => {
          if (disposed) return;
          const root = model.clone(true);
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const m = mesh.material as THREE.MeshStandardMaterial;
            if (m.name === 'green_f') {
              mesh.material = front;
            } else if (m.name === 'green_b') {
              mesh.material = back;
            }
          });
          root.scale.setScalar(k);
          group.add(root);
          modelReady = true;
          snap();
        })
        .catch(() => undefined);
    } else if (isBag) {
      // the sachet model: one mesh with one picture atlas; the atlas is drawn from the two faces of the label
      const bh = 110 / R;
      const k = bh / SACHET_MODEL.h;
      const atlas = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false });
      bag = { front: atlas, back: atlas, aspect: SACHET_MODEL.w / SACHET_MODEL.h, plain: true, atlas: true };
      total = bh + 0.06;
      loadSachet()
        .then((model) => {
          if (disposed) return;
          const root = model.clone(true);
          let original: CanvasImageSource | null = null;
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const m = mesh.material as THREE.MeshStandardMaterial;
            original = (m.map?.image as CanvasImageSource) ?? null;
            mesh.material = atlas;
          });
          bag!.original = original;
          // the faces of the sachet look along the model's x axis: turn it so the front faces the camera
          const pivot = new THREE.Group();
          root.scale.setScalar(k);
          pivot.rotation.y = -Math.PI / 2;
          pivot.add(root);
          group.add(pivot);
          api.current?.setWrap(wrapRef.current);
          modelReady = true;
          snap();
        })
        .catch(() => undefined);
    } else if (isTub) {
      // the protein tub model, its label band stretched to the label's height (the body above it moves up by the same amount)
      const k = (TUB.wallR + 0.004) / JAR_MODEL.labelR;
      const bandH = JAR_MODEL.labelY1 - JAR_MODEL.labelY0;
      const wanted = labelH / k;
      const mapY = (y: number) => (y <= JAR_MODEL.labelY0 ? y : y >= JAR_MODEL.labelY1 ? y + (wanted - bandH) : JAR_MODEL.labelY0 + ((y - JAR_MODEL.labelY0) * wanted) / bandH);
      total = (JAR_MODEL.top + (wanted - bandH)) * k + 0.06;
      const capTop = new THREE.Color(0x141414);
      loadJar()
        .then((model) => {
          if (disposed) return;
          const root = model.clone(true);
          root.scale.setScalar(k);
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const geo = mesh.geometry.clone();
            const pos = geo.getAttribute('position');
            for (let i = 0; i < pos.count; i++) pos.setY(i, mapY(pos.getY(i)));
            pos.needsUpdate = true;
            geo.computeBoundingSphere();
            mesh.geometry = geo;
            mesh.material = mesh.name.startsWith('Label') ? labelMat : mesh.name.startsWith('Bottle') ? body : capMat;
          });
          root.scale.setScalar(k);
          group.add(root);
          modelReady = true;
          snap();
        })
        .catch(() => {
          // the model could not be loaded: the drawn outline of a tub instead
          if (disposed) return;
          const [w0, w1] = TUB.wall;
          const wallLen = w1 - w0;
          const my = (y: number) => (y <= w0 ? y : y >= w1 ? y + (labelH - wallLen) : w0 + ((y - w0) * labelH) / wallLen);
          const tp = TUB.body.map(([r, y]) => new THREE.Vector2(r, my(y)));
          tp.push(new THREE.Vector2(0, my(TUB.lid.y0)));
          group.add(new THREE.Mesh(new THREE.LatheGeometry(tp, 160), body));
          const lp = [new THREE.Vector2(0, my(TUB.lid.y0)), new THREE.Vector2(TUB.lid.r, my(TUB.lid.y0)), new THREE.Vector2(TUB.lid.r, my(TUB.lid.y1)), new THREE.Vector2(0, my(TUB.lid.y1))];
          group.add(new THREE.Mesh(new THREE.LatheGeometry(lp, 128), new THREE.MeshPhysicalMaterial({ color: capTop, roughness: 0.5 })));
          wrapBand(TUB.wallR + 0.004, my(w0));
          modelReady = true;
          snap();
        });
    } else if (kind === 'jar') {
      // the small jar model: its label band stretched to the label's height (everything above it moves up by the same amount)
      const M = SMALL_JAR_MODEL;
      const k = 1 / M.labelR;
      const bandH = (M.labelY1 - M.labelY0) * k;
      const mapY = (y: number) => {
        const u = (y - M.bottom) * k;
        const lo = (M.labelY0 - M.bottom) * k;
        const hi = (M.labelY1 - M.bottom) * k;
        return u <= lo ? u : u >= hi ? u + (labelH - bandH) : lo + ((u - lo) * labelH) / bandH;
      };
      total = (M.top - M.bottom) * k + (labelH - bandH) + 0.06;
      loadSmallJar()
        .then((model) => {
          if (disposed) return;
          const root = model.clone(true);
          root.updateMatrixWorld(true);
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const geo = mesh.geometry.clone();
            const pos = geo.getAttribute('position');
            const v = new THREE.Vector3();
            const toWorld = mesh.matrixWorld;
            for (let i = 0; i < pos.count; i++) {
              v.fromBufferAttribute(pos, i).applyMatrix4(toWorld);
              pos.setXYZ(i, v.x * k, mapY(v.y), v.z * k);
            }
            pos.needsUpdate = true;
            geo.deleteAttribute('normal');
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            mesh.geometry = geo;
            mesh.matrix.identity();
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            mesh.scale.set(1, 1, 1);
            mesh.matrixAutoUpdate = true;
            mesh.parent?.remove(mesh);
            mesh.rotation.y = (SMALL_JAR_MODEL.turn * Math.PI) / 180;
            group.add(mesh);
            if (mesh.name.startsWith('Label')) {
              smallLabel = mesh;
              mesh.material = labelMat;
            } else {
              mesh.material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(jarColor), roughness: 0.7, clearcoat: 0, envMapIntensity: 0.8 });
            }
          });
          api.current?.setWrap(wrapRef.current);
          modelReady = true;
          snap();
        })
        .catch(() => undefined);
    } else if (kind === 'bottle') {
      // the capsule bottle model, at a fixed shape: its own label band takes the label, wrapped by angle (the middle of the picture faces the front)
      const M = PILL_MODEL;
      const k = 1 / M.r;
      total = M.top * k + 0.06;
      loadPill()
        .then((model) => {
          if (disposed) return;
          const root = model.clone(true);
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            if (mesh.name === 'Body3' || mesh.name === 'Body4') {
              mesh.visible = false;
            } else if (mesh.name === 'Body5') {
              const geo = mesh.geometry.clone();
              const pos = geo.getAttribute('position');
              // the band has fewer sides than the smooth bottle wall: it is pushed out a hair so the wall never shows through between its corners
              for (let i = 0; i < pos.count; i++) pos.setXY(i, pos.getX(i) * 1.01, pos.getY(i) * 1.01);
              const uv = new Float32Array(pos.count * 2);
              // the model has z up and its front towards -y: angle round the bottle gives u, height gives v
              for (let i = 0; i < pos.count; i += 3) {
                const us = [0, 1, 2].map((j) => Math.atan2(pos.getX(i + j), -pos.getY(i + j)) / (2 * Math.PI) + 0.5);
                // a triangle across the seam at the back: carry its low ends on past 1
                if (Math.max(...us) - Math.min(...us) > 0.5) for (let j = 0; j < 3; j++) if (us[j] < 0.5) us[j] += 1;
                for (let j = 0; j < 3; j++) {
                  uv[(i + j) * 2] = us[j];
                  uv[(i + j) * 2 + 1] = (pos.getZ(i + j) - M.y0) / (M.y1 - M.y0);
                }
              }
              geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
              mesh.geometry = geo;
              mesh.material = labelMat;
            } else if (mesh.name === 'Body2') {
              mesh.material = capMat;
            } else {
              mesh.material = body;
            }
          });
          // z up in the model, y up here
          const pivot = new THREE.Group();
          pivot.rotation.x = -Math.PI / 2;
          pivot.scale.setScalar(k);
          pivot.add(root);
          group.add(pivot);
          api.current?.setWrap(wrapRef.current);
          modelReady = true;
          snap();
        })
        .catch(() => undefined);
    } else {
      // only the tablet bottle has the real bottle's base; the tub and the jar keep their own
      const bottle = kind === 'bottle';
      const rb = bottle ? 0.3 : s.rb;
      const bottomGap = bottle ? rb + 0.14 : rb + 0.04;
      const Hb = labelH + bottomGap + s.shoulder + 0.02;
      const pts: THREE.Vector2[] = bottle ? bottleBase(1, rb, 0.06, bottomGap) : [new THREE.Vector2(0, 0), new THREE.Vector2(1 - rb, 0)];
      for (let i = 1; i <= (bottle ? 0 : 8); i++) {
        const a = (i / 8) * (Math.PI / 2);
        pts.push(new THREE.Vector2(1 - rb + rb * Math.sin(a), rb - rb * Math.cos(a)));
      }
      pts.push(new THREE.Vector2(1, Hb - s.shoulder));
      for (let i = 1; i <= 14; i++) {
        const a = (i / 14) * (Math.PI / 2);
        pts.push(new THREE.Vector2(s.neck + (1 - s.neck) * Math.cos(a), Hb - s.shoulder + s.shoulder * Math.sin(a)));
      }
      pts.push(new THREE.Vector2(s.neck, Hb + s.neckH), new THREE.Vector2(0, Hb + s.neckH));
      const top = Hb + s.neckH;
      group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 128), body));

      // cap: a seal ring under it, ridges round it, and a lid with a raised rim on top
      const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(jarColor).multiplyScalar(0.3), roughness: 0.6 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(s.cap, s.cap, s.capH, 128), capMat);
      cap.position.y = top + s.capH / 2 + 0.035;
      group.add(cap);
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(s.cap * 0.985, s.cap * 0.985, 0.05, 128), darkMat);
      seal.position.y = top + 0.02;
      group.add(seal);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(s.cap * 0.93, 0.022, 10, 128), capMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = top + s.capH + 0.035;
      group.add(rim);
      const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(s.cap * 0.91, s.cap * 0.91, 0.01, 128), darkMat);
      lidTop.position.y = top + s.capH + 0.03;
      group.add(lidTop);
      const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, s.capH * 0.8, 0.03), capMat, s.ribs);
      const m = new THREE.Matrix4();
      for (let i = 0; i < s.ribs; i++) {
        const a = (i / s.ribs) * Math.PI * 2;
        m.compose(new THREE.Vector3(Math.sin(a) * (s.cap + 0.005), top + s.capH * 0.5 + 0.035, Math.cos(a) * (s.cap + 0.005)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), new THREE.Vector3(1, 1, 1));
        ribs.setMatrixAt(i, m);
      }
      group.add(ribs);
      wrapBand(1.004, bottomGap);
      total = top + s.capH + 0.06;
    }

    const frame = Math.max(total, FRAME_MM / R);
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    const fit = () => {
      const w = el.clientWidth || 300;
      const h = el.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const half = Math.tan((camera.fov * Math.PI) / 360);
      const dist0 = Math.max((frame * 0.62) / half, (1.35 / half) / camera.aspect);
      viewRef.current = { h: 2 * half * dist0, aspect: camera.aspect, frame };
      const dist = dist0 / zoomRef.current;
      // zooming in moves the camera towards the middle of the pack; the camera can look from above or below (pitch) and be moved sideways (pan)
      const z = zoomRef.current - 1;
      const tx = panRef.current.x;
      const ty = frame * (0.47 - 0.05 * z) + panRef.current.y;
      const dy0 = frame * (0.13 - 0.08 * z);
      const e = pitchRef.current;
      camera.position.set(tx, ty + dy0 * Math.cos(e) + dist * Math.sin(e), -dy0 * Math.sin(e) + dist * Math.cos(e));
      camera.lookAt(tx, ty, 0);
      camera.updateProjectionMatrix();
    };
    fit();
    refit.current = fit;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // scrolling over the pack zooms it; once it cannot zoom any further that way the page scrolls on as usual
    const onWheel = (e: WheelEvent) => {
      if (!zoomable) return;
      const before = zoomRef.current;
      // scrolling down over a pack that is not zoomed has nothing to zoom out, so the page scrolls on; in every other case the wheel belongs to the pack
      if (before === 1 && e.deltaY > 0 && !e.ctrlKey) return;
      e.preventDefault();
      const box = el.getBoundingClientRect();
      applyZoom(before * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), (e.clientX - box.left) / box.width - 0.5, (e.clientY - box.top) / box.height - 0.5);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    // two fingers pinch it, and moving them together moves the view
    let pinch = 0;
    let mid = { x: 0, y: 0 };
    const gap = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const centre = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
    const onTouchStart = (e: TouchEvent) => {
      pinch = zoomable && e.touches.length === 2 ? gap(e.touches) : 0;
      if (pinch) mid = centre(e.touches);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!zoomable || e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      const now = gap(e.touches);
      const c = centre(e.touches);
      const box = el.getBoundingClientRect();
      applyZoom(zoomRef.current * (now / pinch), (c.x - box.left) / box.width - 0.5, (c.y - box.top) / box.height - 0.5);
      const per = viewRef.current.h / zoomRef.current / box.height;
      panRef.current.x -= (c.x - mid.x) * per;
      panRef.current.y += (c.y - mid.y) * per;
      keepPanInside();
      refit.current();
      pinch = now;
      mid = c;
    };
    const noGesture = (e: Event) => zoomable && e.preventDefault();
    el.addEventListener('gesturestart', noGesture);
    el.addEventListener('gesturechange', noGesture);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    // double click (or double tap) brings it back
    const onDouble = () => {
      if (!zoomable) return;
      pitchRef.current = 0;
      applyZoom(1);
    };
    const onMenu = (e: Event) => zoomable && e.preventDefault();
    el.addEventListener('contextmenu', onMenu);
    el.addEventListener('dblclick', onDouble);

    // -- the flip: the panels come to the front one by one; dragging turns the jar by hand --
    const centreU = [panels[0] / 2, panels[0] + panels[1] / 2, panels[0] + panels[1] + panels[2] / 2];
    // angle that brings the point at u to the front (group yaw), for the left, middle and right panels
    const face = centreU.map((u) => -(Math.PI + 2 * Math.PI * u));
    const order = [1, 2, 0]; // middle, right, left
    // a bag turns between its front and its back; a jar between its three panels. Each step turns the same way, so a loop is a whole turn.
    const stops = isBag
      ? [0, -Math.PI]
      : order.map((o, slot) => {
          if (slot === 0) return 0;
          let a = face[o] - face[1];
          while (a > 0) a -= 2 * Math.PI;
          return a;
        });
    const angleOf = (n: number) => {
      const k = stops.length;
      const loop = Math.floor(n / k);
      const slot = ((n % k) + k) % k;
      return -2 * Math.PI * loop + stops[slot];
    };
    let step = 0;
    let from = 0;
    let t0 = performance.now();
    let yaw = 0;
    let velocity = 0;
    const DWELL = 2800;
    const FLIP = 1200;
    let dragging = false;
    let resumeAt = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let panning = false;
    const touching = new Set<number>();

    const down = (e: PointerEvent) => {
      touching.add(e.pointerId);
      // a second finger belongs to the pinch, not to turning the pack
      if (touching.size > 1) {
        dragging = false;
        return;
      }
      panning = zoomable && (e.shiftKey || e.button !== 0);
      dragging = true;
      velocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      if (panning) {
        // Shift + drag, or the right button, moves the view
        const per = viewRef.current.h / zoomRef.current / (el.clientHeight || 300);
        panRef.current.x -= dx * per;
        panRef.current.y += dy * per;
        keepPanInside();
        refit.current();
        lastX = e.clientX;
        lastTime = now;
        return;
      }
      yaw += dx * 0.009;
      if (zoomable) {
        // dragging up or down looks at the pack from below or above
        pitchRef.current = Math.max(-0.8, Math.min(1.1, pitchRef.current + dy * 0.006));
        refit.current();
      }
      // Filtered velocity for smooth release momentum
      velocity = (dx / dt) * 0.14;
      lastX = e.clientX;
      lastTime = now;
    };
    const up = (e?: PointerEvent) => {
      if (e) touching.delete(e.pointerId);
      if (!dragging) return;
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      // carry on from the panel nearest to where the jar was left
      let best = 0;
      let bestD = Infinity;
      for (let n = -12; n <= 12; n++) {
        const d = Math.abs(angleOf(n) - yaw);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      step = best;
      from = yaw;
      t0 = performance.now();
      resumeAt = performance.now() + 2400;
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);

    let visible = true;
    const io = new IntersectionObserver((en) => (visible = en[0]?.isIntersecting ?? true));
    io.observe(el);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (dragging) {
        // Direct tracking while dragging
      } else if (Math.abs(velocity) > 0.0001) {
        // Silky smooth momentum glide on release
        yaw += velocity;
        velocity *= 0.91;
        from = yaw;
        t0 = now;
      } else if (now > resumeAt && !reduce && autoRef.current && zoomRef.current === 1 && pitchRef.current === 0) {
        // Smooth auto-turn between panels
        const target = angleOf(step + 1);
        const since = now - t0;
        if (since > DWELL) {
          const k = Math.min(1, (since - DWELL) / FLIP);
          const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          yaw = from + (target - from) * ease;
          if (k >= 1) {
            step += 1;
            from = target;
            t0 = now;
          }
        } else {
          yaw = from;
        }
      }
      group.rotation.y = yaw;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    const textures: THREE.Texture[] = [];
    const texOf = (face: HTMLCanvasElement, model = false) => {
      let canvas = face;
      if (model) {
        // the model's picture is a square with the bag's face in one box: draw the label into that box
        const S = 2048;
        const { x0, x1, y0, y1 } = POUCH_MODEL.uv;
        canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const cx = canvas.getContext('2d')!;
        cx.drawImage(face, 0, 0, face.width, face.height, x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S);
        // beyond the face the picture's own edge is carried on (not left empty), so the bag's curved edges show no streaks
        const bx0 = Math.round(x0 * S);
        const bx1 = Math.round(x1 * S);
        const by0 = Math.round(y0 * S);
        const by1 = Math.round(y1 * S);
        cx.drawImage(canvas, bx0, by0, bx1 - bx0, 1, bx0, 0, bx1 - bx0, by0);
        cx.drawImage(canvas, bx0, by1 - 1, bx1 - bx0, 1, bx0, by1, bx1 - bx0, S - by1);
        cx.drawImage(canvas, bx0, 0, 1, S, 0, 0, bx0, S);
        cx.drawImage(canvas, bx1 - 1, 0, 1, S, bx1, 0, S - bx1, S);
      }
      const t = new THREE.CanvasTexture(canvas);
      t.flipY = !model; // a model's pictures are not flipped
      t.needsUpdate = true;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      textures.push(t);
      return t;
    };
    snap = () => {
      if (snapped || !snapRef.current || !modelReady || !wrapRef.current) return;
      snapped = true;
      requestAnimationFrame(() => {
        if (disposed) return;
        renderer.render(scene, camera);
        snapRef.current?.(renderer.domElement.toDataURL('image/webp', 0.92));
      });
    };
    const rawSetWrap = (canvas: HTMLCanvasElement | null) => {
        textures.splice(0).forEach((t) => t.dispose());
        if (bag) {
          const faces = canvas ? bagFaces(canvas, panels, bag.aspect, jarColor, kind === 'pouch', !bag.plain) : null;
          if (bag.atlas) {
            // one atlas for the whole sachet: the model's own picture with the two faces drawn over its front and back
            if (faces && bag.original) {
              const S = 2048;
              const c = document.createElement('canvas');
              c.width = S;
              c.height = S;
              const cx = c.getContext('2d')!;
              cx.drawImage(bag.original, 0, 0, S, S);
              const put = (face: HTMLCanvasElement, box: { x0: number; x1: number; y0: number; y1: number }) => {
                // the model's picture is upside down: the face goes in flipped
                const x = box.x0 * S;
                const y = box.y0 * S;
                const w = (box.x1 - box.x0) * S;
                const h = (box.y1 - box.y0) * S;
                cx.save();
                cx.translate(x, y + h);
                cx.scale(1, -1);
                cx.drawImage(face, 0, 0, face.width, face.height, 0, 0, w, h);
                cx.restore();
              };
              put(faces[0], SACHET_MODEL.front);
              put(faces[1], SACHET_MODEL.back);
              const t = new THREE.CanvasTexture(c);
              t.flipY = false;
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = renderer.capabilities.getMaxAnisotropy();
              textures.push(t);
              bag.front.map = t;
            } else {
              bag.front.map = null;
            }
            bag.front.needsUpdate = true;
            return;
          }
          bag.front.map = faces ? texOf(faces[0], bag.plain) : null;
          bag.back.map = faces ? texOf(faces[1], bag.plain) : null;
          bag.front.needsUpdate = true;
          bag.back.needsUpdate = true;
        } else if (kind === 'jar') {
          // the label's picture goes into the model's atlas, turned on its side: the wrap's width runs down the atlas, its height across
          if (canvas && smallLabel) {
            const S = 2048;
            const c = document.createElement('canvas');
            c.width = S;
            c.height = S;
            const cx = c.getContext('2d')!;
            cx.fillStyle = '#ffffff';
            cx.fillRect(0, 0, S, S);
            const x0 = SMALL_JAR_MODEL.u0 * S;
            const x1 = SMALL_JAR_MODEL.u1 * S;
            // the model is turned, so the picture is shifted down the atlas by the same share of a turn (and wraps round)
            const shift = (S * SMALL_JAR_MODEL.turn) / 360;
            for (const ty of [-shift, S - shift]) {
              cx.setTransform(0, S / canvas.width, (x1 - x0) / canvas.height, 0, x0, ty);
              cx.drawImage(canvas, 0, 0);
            }
            const t = new THREE.CanvasTexture(c);
            t.flipY = false;
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = renderer.capabilities.getMaxAnisotropy();
            textures.push(t);
            labelMat.map = t;
          } else {
            labelMat.map = null;
          }
          labelMat.needsUpdate = true;
        } else {
          labelMat.map = canvas ? texOf(isTub ? fitToBand(canvas, mm.w / mm.h) : isPill ? fitToBand(canvas, mm.w / mm.h, PILL_BAND_MM.w / PILL_BAND_MM.h) : canvas) : null;
          if (isPill && labelMat.map) labelMat.map.wrapS = THREE.RepeatWrapping; // the label's picture carries on past its right edge at the back
          labelMat.needsUpdate = true;
        }
        // white under a picture (so its colours are true); the pack's own colour while there is no picture yet
        if (!bag) labelMat.color.set(labelMat.map ? 0xffffff : jarColor);
    };
    api.current = {
      setWrap: (c) => {
        rawSetWrap(c);
        snap();
      },
    };
    api.current.setWrap(wrapRef.current);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', up);
      textures.splice(0).forEach((t) => t.dispose());
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      api.current = null;
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', noGesture);
      el.removeEventListener('gesturechange', noGesture);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('dblclick', onDouble);
      el.removeEventListener('contextmenu', onMenu);
    };
    // the jar is rebuilt when its shape or colour changes; the label picture is swapped in below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, mm.w, mm.h, jarColor, panels[0], panels[1], panels[2]]);

  useEffect(() => {
    api.current?.setWrap(wrap);
  }, [wrap]);

  // data-lenis-prevent: the page's smooth scrolling leaves the wheel alone over the pack, so it can zoom it
  return <div ref={host} className={className} data-lenis-prevent={zoomable ? '' : undefined} />;
}
