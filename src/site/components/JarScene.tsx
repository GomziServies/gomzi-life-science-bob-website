import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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

/** One face of a bag (a stand-up pouch or a sachet): a sheet that puffs out in the middle and is flat along its heat-sealed top and bottom. */
function bagGeometry(w: number, h: number, depth: number, side: 1 | -1, pouch = false) {
  const nx = 48;
  const ny = 96;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const sealTop = pouch ? 0.07 : 0.1;
  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    let halfW: number;
    let belly: number;
    if (pouch) {
      // a stand-up pouch seen from the side is a wedge: thin at the sealed top, growing steadily thicker down to a full, flat base
      const top = 1 - sealTop;
      const t = Math.min(1, v / top); // 0 at the base, 1 at the top seal
      halfW = 0.5 * w * (1 - 0.07 * t);
      const foot = 0.93 + 0.07 * smooth(Math.min(1, v / 0.05));
      belly = foot * (1 - 0.6 * Math.pow(t, 1.4)) * Math.max(0, Math.min(1, (top - v) / 0.04));
    } else {
      halfW = 0.5 * w;
      belly = smooth(Math.min(1, Math.min(v / 0.14, (1 - v) / 0.14))) * (0.8 + 0.2 * Math.sin(Math.PI * v));
    }
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const c = 2 * u - 1;
      // pouch: a flat front that turns sharply into the side wall (a boxy section); sachet: a soft pillow
      const n = 2.5 + 5.5 * (1 - Math.min(1, v / (1 - sealTop))); // boxy low down, folding in to a lens (the side gusset crease) higher up
      const edge = pouch ? Math.pow(Math.max(0, 1 - Math.pow(Math.abs(c), n)), 1 / n) : Math.pow(Math.max(0, 1 - Math.pow(c, 2)), 0.55);
      const z = depth * edge * belly;
      pos.push(c * halfW, v * h, side * z);
      uv.push(side === 1 ? u : 1 - u, v);
      // darker towards the sides and the seals, so the bag reads as puffed out
      const shade = pouch ? 0.74 + 0.26 * Math.pow(edge, 0.6) : 0.55 + 0.45 * Math.pow(edge, 0.7) * (0.55 + 0.45 * Math.min(1, belly * 1.2));
      col.push(shade, shade, shade);
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      if (side === 1) idx.push(a, b, d, a, d, c);
      else idx.push(a, d, b, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The front and back pictures of a bag from the label wrap: the front design on the front, the two side panels on the back, with the sealed edges drawn in. */
function bagFaces(wrap: HTMLCanvasElement, panels: [number, number, number], aspect: number, bg: string, pouch: boolean): [HTMLCanvasElement, HTMLCanvasElement] {
  const H = 1536;
  const W = Math.round(H * aspect);
  const seals = (ctx: CanvasRenderingContext2D) => {
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
export default function JarScene({ wrap, mm, kind, jarColor, accent, panels, className, autoTurn = true, onUnsupported }: JarSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLCanvasElement | null>(null);
  wrapRef.current = wrap;
  const autoRef = useRef(autoTurn);
  autoRef.current = autoTurn;
  const api = useRef<{ setWrap: (c: HTMLCanvasElement | null) => void } | null>(null);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = 0.55;
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2.5, 4, 5);
    scene.add(key);

    // -- the jar, in units of its radius --
    const isBag = kind === 'pouch' || kind === 'sachet';
    const s = SHAPE[isBag ? 'jar' : kind];
    const isTub = kind === 'tub';
    const R = isBag ? 50 : mm.w / (2 * Math.PI * (isTub ? TUB.wallR : 1));
    const labelH = mm.h / R;
    const group = new THREE.Group();
    scene.add(group);

    const body = new THREE.MeshPhysicalMaterial({ color: jarColor, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.5 });
    const capColor = isTub && accent ? new THREE.Color(accent) : new THREE.Color(jarColor).multiplyScalar(0.55);
    const capMat = new THREE.MeshPhysicalMaterial({ color: capColor, roughness: 0.5, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.5 });
    const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.6, color: 0xffffff });
    // the label, wrapped right round; the middle of the picture faces the front
    const wrapBand = (radius: number, y: number) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, labelH, 192, 1, true, Math.PI, Math.PI * 2), labelMat);
      band.position.y = y + labelH / 2;
      group.add(band);
    };
    let total: number;
    let bag: { front: THREE.MeshPhysicalMaterial; back: THREE.MeshPhysicalMaterial; aspect: number } | null = null;

    if (isBag) {
      // a stand-up pouch or a sachet: a front and a back face
      const pouch = kind === 'pouch';
      const bw = (pouch ? 160 : 70) / R;
      const bh = (pouch ? 240 : 110) / R;
      const face = () => new THREE.MeshPhysicalMaterial({ roughness: 0.72, clearcoat: 0, clearcoatRoughness: 0.6, envMapIntensity: 0.45, color: 0xffffff, vertexColors: true });
      const front = face();
      const back = face();
      group.add(new THREE.Mesh(bagGeometry(bw, bh, pouch ? 1.2 : 0.22, 1, pouch), front));
      group.add(new THREE.Mesh(bagGeometry(bw, bh, pouch ? 1.2 : 0.22, -1, pouch), back));
      bag = { front, back, aspect: bw / bh };
      total = bh + 0.06;
    } else if (isTub) {
      // the outline of a real protein tub, its straight wall stretched to the label's height
      const [w0, w1] = TUB.wall;
      const wallLen = w1 - w0;
      const mapY = (y: number) => (y <= w0 ? y : y >= w1 ? y + (labelH - wallLen) : w0 + ((y - w0) * labelH) / wallLen);
      const tp = TUB.body.map(([r, y]) => new THREE.Vector2(r, mapY(y)));
      tp.push(new THREE.Vector2(0, mapY(TUB.lid.y0)));
      group.add(new THREE.Mesh(new THREE.LatheGeometry(tp, 160), body));
      // the lid, in the design's colour, with a rounded top edge
      const y0 = mapY(TUB.lid.y0);
      const y1 = mapY(TUB.lid.y1);
      const lr = TUB.lid.r;
      const e = 0.05;
      const lp = [new THREE.Vector2(0, y0), new THREE.Vector2(lr, y0), new THREE.Vector2(lr, y1 - e)];
      for (let i = 1; i <= 6; i++) {
        const a = (i / 6) * (Math.PI / 2);
        lp.push(new THREE.Vector2(lr - e + e * Math.cos(a), y1 - e + e * Math.sin(a)));
      }
      lp.push(new THREE.Vector2(0, y1));
      group.add(new THREE.Mesh(new THREE.LatheGeometry(lp, 128), capMat));
      wrapBand(TUB.wallR + 0.004, mapY(w0));
      total = y1 + 0.06;
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
      const dist = Math.max((frame * 0.62) / half, (1.35 / half) / camera.aspect);
      camera.position.set(0, frame * 0.6, dist);
      camera.lookAt(0, frame * 0.47, 0);
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

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
    let lastTime = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      velocity = 0;
      lastX = e.clientX;
      lastTime = performance.now();
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      yaw += dx * 0.009;
      // Filtered velocity for smooth release momentum
      velocity = (dx / dt) * 0.14;
      lastX = e.clientX;
      lastTime = now;
    };
    const up = () => {
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
      } else if (now > resumeAt && !reduce && autoRef.current) {
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
    const texOf = (canvas: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      textures.push(t);
      return t;
    };
    api.current = {
      setWrap: (canvas) => {
        textures.splice(0).forEach((t) => t.dispose());
        if (bag) {
          const faces = canvas ? bagFaces(canvas, panels, bag.aspect, jarColor, kind === 'pouch') : null;
          bag.front.map = faces ? texOf(faces[0]) : null;
          bag.back.map = faces ? texOf(faces[1]) : null;
          bag.front.needsUpdate = true;
          bag.back.needsUpdate = true;
        } else {
          labelMat.map = canvas ? texOf(canvas) : null;
          labelMat.needsUpdate = true;
        }
      },
    };
    api.current.setWrap(wrapRef.current);

    return () => {
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
    };
    // the jar is rebuilt when its shape or colour changes; the label picture is swapped in below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, mm.w, mm.h, jarColor, panels[0], panels[1], panels[2]]);

  useEffect(() => {
    api.current?.setWrap(wrap);
  }, [wrap]);

  return <div ref={host} className={className} />;
}
