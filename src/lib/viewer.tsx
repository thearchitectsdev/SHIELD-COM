import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { M, type MatSpec } from './materials'
import { DragCtl, consumeClick, hitGizmo } from './dragmove'

export type Mode = 'assembled' | 'exploded' | 'pcb' | 'slice' | 'internal'

/* ------------------------------------------------------------------ */
/*  ASSEMBLY HIERARCHY                                                 */
/* ------------------------------------------------------------------ */
/*  Mechanical parent → child map used by FREE MOVE.  Move a parent and
    everything bolted / soldered to it travels with it: move the main PCB
    and the ESP32, codec, ADC, power section, connectors, LEDs and MEMS
    mics all go with the board.  Move the ESP32 and its shield can goes too.  */
export const PART_PARENT: Record<string, string> = {
  /* ── upper shell carries the operator interface ─────────────────── */
  'light-pipes': 'upper-enclosure',
  'sos-button': 'upper-enclosure',
  'mark-button': 'upper-enclosure',
  'power-switch': 'upper-enclosure',
  'acoustic-mesh': 'upper-enclosure',
  'speaker-grille': 'lower-enclosure',
  'speaker-driver': 'lower-enclosure',
  'ptt-button': 'lower-enclosure',
  'acoustic-duct': 'upper-enclosure',
  'acoustic-gasket': 'upper-enclosure',

  /* ── lower shell carries the external interfaces ────────────────── */
  'audio-jack': 'lower-enclosure',
  gasket: 'lower-enclosure',

  /* ── internal frame carries the whole electronics stack ─────────── */
  'main-pcb': 'internal-frame',
  standoffs: 'internal-frame',
  screws: 'internal-frame',
  'threaded-inserts': 'internal-frame',
  'cable-management': 'internal-frame',
  battery: 'internal-frame',

  /* ── board-level components ─────────────────────────────────────── */
  esp32: 'main-pcb',
  'esp32-shield': 'esp32',
  'audio-adc': 'main-pcb',
  'audio-dac': 'main-pcb',
  'analog-filter': 'main-pcb',
  'power-mgmt': 'main-pcb',
  'buck-reg': 'power-mgmt',
  'ldo-reg': 'power-mgmt',
  inductor: 'power-mgmt',
  flash: 'main-pcb',
  crystal: 'main-pcb',
  passives: 'main-pcb',
  'esd-protection': 'main-pcb',
  'test-points': 'main-pcb',
  'usb-c': 'main-pcb',
  'battery-connector': 'main-pcb',
  'io-header': 'main-pcb',
  'status-leds': 'main-pcb',
  'audio-harness': 'main-pcb',
  'mic-voice': 'main-pcb',
  'mic-ref': 'main-pcb',

  /* ── battery pack ───────────────────────────────────────────────── */
  'protection-circuit': 'battery',
  'battery-cable': 'battery',

  /* ── external cable ─────────────────────────────────────────────── */
  'strain-relief': 'radio-cable',
}

/* total offset applied to a part = its own offset + every ancestor's */
export function resolveOffset(
  id: string,
  partOffsets: Record<string, [number, number, number]>,
  fade = 1,
): [number, number, number] {
  let x = 0
  let y = 0
  let z = 0
  let cur: string | undefined = id
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const o = partOffsets[cur]
    if (o) {
      x += o[0]
      y += o[1]
      z += o[2]
    }
    cur = PART_PARENT[cur]
  }
  return fade === 1 ? [x, y, z] : [x * fade, y * fade, z * fade]
}

/* every part that rides along when `id` is moved */
export function descendantsOf(id: string): string[] {
  const out: string[] = []
  const walk = (p: string) => {
    for (const k in PART_PARENT) {
      if (PART_PARENT[k] === p) {
        out.push(k)
        walk(k)
      }
    }
  }
  walk(id)
  return out
}

/* live registry of every mesh that belongs to a part id */
export const PART_OBJECTS: Map<string, Set<THREE.Object3D>> = new Map()

type Anim = { e: number; p: number; te: number; tp: number }
type CamAnim = {
  active: boolean
  t: number
  dur: number
  fromPos: THREE.Vector3
  fromTgt: THREE.Vector3
  toPos: THREE.Vector3
  toTgt: THREE.Vector3
}

type Viewer = {
  mode: Mode
  setMode: (m: Mode) => void
  selected: string | null
  setSelected: (id: string | null) => void
  hovered: string | null
  setHovered: (id: string | null) => void
  labels: boolean
  setLabels: (v: boolean) => void
  clip: number
  setClip: (v: number) => void
  clipRef: React.MutableRefObject<number>
  clipPlane: THREE.Plane
  anim: React.MutableRefObject<Anim>
  cam: React.MutableRefObject<CamAnim>
  focus: (pos: [number, number, number], tgt: [number, number, number], dur?: number) => void
  zoomBy: (f: number) => void
  autoRotate: boolean
  setAutoRotate: (v: boolean) => void
  demo: boolean
  setDemo: (v: boolean) => void
  demoPaused: boolean
  setDemoPaused: (v: boolean) => void
  demoChapter: number
  setDemoChapter: (i: number) => void
  demoT: number
  setDemoT: (v: number) => void
  seekDemo: (chapterIndex: number) => void
  seekRef: React.MutableRefObject<number | null>
  restartRef: React.MutableRefObject<boolean>
  resetAll: () => void
  arch: boolean
  setArch: (v: boolean) => void
  viewPreset: (v: 'iso' | 'front' | 'top' | 'rear' | 'side') => void
  flowStep: number
  pcbExplode: boolean
  setPcbExplode: (v: boolean) => void
  pcbComponentExplode: string | null
  setPcbComponentExplode: (v: string | null) => void
  setFlowStep: (i: number) => void
  dims: boolean
  setDims: (v: boolean) => void
  pcbFace: 'top' | 'bottom'
  setPcbFace: (v: 'top' | 'bottom') => void
  isolate: boolean
  setIsolate: (v: boolean) => void
  freeMove: boolean
  setFreeMove: (v: boolean) => void
  partOffsets: Record<string, [number, number, number]>
  offsetFade: number
  assembleAll: () => void
  setPartOffset: (id: string, offset: [number, number, number]) => void
  setPartOffsetAbs: (id: string, offset: [number, number, number]) => void
  resetPartOffset: (id: string) => void
  resetPartOffsets: () => void
}

const Ctx = createContext<Viewer | null>(null)
export const useViewer = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('viewer context missing')
  return v
}

/* true-scale hero: frames the 72 mm module AND the 230 mm host radio together */
export const HOME_POS = new THREE.Vector3(29.2, 23.1, 33.9)
export const HOME_TGT = new THREE.Vector3(5.0, 9.0, 0)
/* product-only close-up used by the demo hero chapter */
export const PRODUCT_POS = new THREE.Vector3(8.2, 5.6, 11.0)
export const PRODUCT_TGT = new THREE.Vector3(0.6, 0.15, 0)

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('assembled')
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [labels, setLabels] = useState(false)
  const clipRef = useRef(0.4)
  const [clip, setClipState] = useState(0.4)
  const setClip = useCallback((v: number) => {
    clipRef.current = v
    setClipState(v)
  }, [])
  const [autoRotate, setAutoRotate] = useState(false)
  const [demo, setDemo] = useState(false)
  const [demoPaused, setDemoPaused] = useState(false)
  const [demoChapter, setDemoChapter] = useState(0)
  const [demoT, setDemoT] = useState(0)
  const seekRef = useRef<number | null>(null)
  const restartRef = useRef(false)
  const [arch, setArch] = useState(false)
  const [flowStep, setFlowStep] = useState(0)
  const [pcbExplode, setPcbExplode] = useState(false)
  const [pcbComponentExplode, setPcbComponentExplode] = useState<string | null>(null)
  const [dims, setDims] = useState(false)
  const [pcbFace, setPcbFace] = useState<'top' | 'bottom'>('top')
  const [isolate, setIsolate] = useState(true)
  const [freeMove, setFreeMove] = useState(false)
  const [partOffsets, setPartOffsets] = useState<Record<string, [number, number, number]>>({})
  const [offsetFade, setOffsetFade] = useState(1)
  const partOffsetsRef = useRef(partOffsets)
  partOffsetsRef.current = partOffsets
  const fadeRaf = useRef<number | null>(null)

  /*  ASSEMBLE — every part that was dragged with FREE MOVE glides back to
      its true position.  One scalar fade drives all offsets at once, so the
      whole model returns together instead of snapping.                     */
  const assembleAll = useCallback(() => {
    if (Object.keys(partOffsetsRef.current).length === 0) return
    if (fadeRaf.current !== null) cancelAnimationFrame(fadeRaf.current)
    const t0 = performance.now()
    const dur = 420
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      setOffsetFade(1 - e)
      if (k < 1) {
        fadeRaf.current = requestAnimationFrame(step)
      } else {
        fadeRaf.current = null
        setPartOffsets({})
        setOffsetFade(1)
      }
    }
    fadeRaf.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => () => {
    if (fadeRaf.current !== null) cancelAnimationFrame(fadeRaf.current)
  }, [])

  const setPartOffset = useCallback((id: string, offset: [number, number, number]) => {
    setPartOffsets((prev) => ({
      ...prev,
      [id]: [
        (prev[id]?.[0] ?? 0) + offset[0],
        (prev[id]?.[1] ?? 0) + offset[1],
        (prev[id]?.[2] ?? 0) + offset[2],
      ],
    }))
  }, [])

  const setPartOffsetAbs = useCallback((id: string, offset: [number, number, number]) => {
    setPartOffsets((prev) => ({ ...prev, [id]: offset }))
  }, [])

  const resetPartOffset = useCallback((id: string) => {
    setPartOffsets((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const resetPartOffsets = useCallback(() => {
    setPartOffsets({})
  }, [])

  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.4), [])
  const anim = useRef<Anim>({ e: 0, p: 0, te: 0, tp: 0 })
  const cam = useRef<CamAnim>({
    active: false,
    t: 0,
    dur: 0.9,
    fromPos: new THREE.Vector3(),
    fromTgt: new THREE.Vector3(),
    toPos: HOME_POS.clone(),
    toTgt: HOME_TGT.clone(),
  })

  const focus = useCallback(
    (pos: [number, number, number], tgt: [number, number, number], dur = 0.95) => {
      const c = cam.current
      c.fromPos.copy(c.toPos)
      c.fromTgt.copy(c.toTgt)
      c.toPos.set(pos[0], pos[1], pos[2])
      c.toTgt.set(tgt[0], tgt[1], tgt[2])
      c.t = 0
      c.dur = dur
      c.active = true
    },
    [],
  )

  useEffect(() => {
    anim.current.te = mode === 'exploded' || mode === 'pcb' ? 1 : 0
    anim.current.tp = mode === 'pcb' && pcbExplode ? 1 : 0
    clipPlane.constant = mode === 'slice' ? clip : 100
  }, [mode, clip, clipPlane, pcbExplode])

  /* Switching view re-assembles the model: each mode is a canonical pose, so
     manual FREE MOVE displacements are folded back in as you change mode. */
  const modeFirst = useRef(true)
  useEffect(() => {
    if (modeFirst.current) {
      modeFirst.current = false
      return
    }
    assembleAll()
  }, [mode, assembleAll])

  /* PCB DETAIL opens the inspection chamber AND lifts the component stack —
     the board settles first, then every package rises by its real height. */
  const prevMode = useRef<Mode>(mode)
  useEffect(() => {
    const was = prevMode.current
    prevMode.current = mode
    if (mode !== 'pcb' || was === 'pcb') return
    const t = window.setTimeout(() => setPcbExplode(true), 420)
    return () => window.clearTimeout(t)
  }, [mode, setPcbExplode])

  const zoomBy = useCallback(
    (f: number) => {
      const c = cam.current
      const p = c.toPos.clone().sub(c.toTgt).multiplyScalar(f).add(c.toTgt)
      const len = p.distanceTo(c.toTgt)
      const cl = Math.max(3.2, Math.min(42, len))
      if (Math.abs(cl - len) > 1e-4) p.sub(c.toTgt).setLength(cl).add(c.toTgt)
      focus([p.x, p.y, p.z], [c.toTgt.x, c.toTgt.y, c.toTgt.z], 0.35)
    },
    [focus],
  )

  const viewPreset = useCallback(
    (v: 'iso' | 'front' | 'top' | 'rear' | 'side') => {
      const ty = anim.current.e > 0.25 ? 0.4 : 0.15
      /* iso = full true-scale comparison; the others are product-centred inspection views */
      const P: Record<string, [[number, number, number], [number, number, number]]> = {
        iso: [[HOME_POS.x, HOME_POS.y, HOME_POS.z], [HOME_TGT.x, HOME_TGT.y, HOME_TGT.z]],
        front: [[0.6, 2.4, 15.5], [0.6, ty, 0]],
        top: [[0.9, 26, 2.6], [0.5, 0, 0]],
        rear: [[0.6, 3.8, -15.5], [0.6, ty, 0]],
        side: [[-16, 2.8, 0.4], [0.6, ty, 0]],
      }
      focus(P[v][0], P[v][1], 1.1)
    },
    [focus],
  )

  const resetAll = useCallback(() => {
    setMode('assembled')
    setSelected(null)
    setHovered(null)
    setClip(0.4)
    setAutoRotate(false)
    setDemo(false)
    setDemoPaused(false)
    setDemoChapter(0)
    setDemoT(0)
    setPcbFace('top')
    setPcbExplode(false)
    setPcbComponentExplode(null)
    setIsolate(true)
    setPartOffsets({})
    restartRef.current = true
    focus([HOME_POS.x, HOME_POS.y, HOME_POS.z], [HOME_TGT.x, HOME_TGT.y, HOME_TGT.z], 1.1)
  }, [focus])

  const value: Viewer = {
    mode,
    setMode,
    selected,
    setSelected,
    hovered,
    setHovered,
    labels,
    setLabels,
    clip,
    setClip,
    clipRef,
    clipPlane,
    anim,
    cam,
    focus,
    zoomBy,
    autoRotate,
    setAutoRotate,
    demo,
    setDemo,
    demoPaused,
    setDemoPaused,
    demoChapter,
    setDemoChapter,
    demoT,
    setDemoT,
    seekDemo: useCallback((i: number) => {
      seekRef.current = i
    }, []),
    seekRef,
    restartRef,
    resetAll,
    arch,
    setArch,
    viewPreset,
    flowStep,
    setFlowStep,
    pcbExplode,
    setPcbExplode,
    pcbComponentExplode,
    setPcbComponentExplode,
    dims,
    setDims,
    pcbFace,
    setPcbFace,
    isolate,
    setIsolate,
    freeMove,
    setFreeMove,
    partOffsets,
    offsetFade,
    assembleAll,
    setPartOffset,
    setPartOffsetAbs,
    resetPartOffset,
    resetPartOffsets,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/* ------------------------------------------------------------------ */
/*  Animation controller – drives explode progress + clip plane        */
/* ------------------------------------------------------------------ */
export function AnimController() {
  const { anim, clipPlane, clipRef, mode } = useViewer()
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 4.2)
    const a = anim.current
    a.e += (a.te - a.e) * k
    a.p += (a.tp - a.p) * k
    clipPlane.constant = mode === 'slice' ? clipRef.current : 100
  })
  return null
}

/* ------------------------------------------------------------------ */
/*  Material driven by selection / hover / dim / x-ray                 */
/* ------------------------------------------------------------------ */
function PartMaterial({
  spec,
  active,
  hover,
  dim,
  clip,
  xray,
}: {
  spec: MatSpec
  active: boolean
  hover: boolean
  dim: boolean
  clip: boolean
  xray: boolean
}) {
  const { clipPlane, isolate } = useViewer()
  const planes = useMemo(() => [clipPlane], [clipPlane])
  /* FOCUS ISOLATION — unselected parts desaturate toward graphite and fade back,
     so the selected component reads as the only lit object in the scene. */
  const color = useMemo(() => {
    const c = new THREE.Color(spec.color)
    if (dim) c.lerp(new THREE.Color('#11161c'), isolate ? 0.82 : 0.45)
    return c
  }, [spec.color, dim, isolate])
  const opacity = dim ? (isolate ? 0.14 : 0.34) : xray ? 0.2 : (spec.opacity ?? 1)
  const transparent = dim || xray || (spec.transparent ?? false) || (spec.opacity ?? 1) < 1

  /* self-illuminating parts (status LEDs) get a subtle living "breathe" pulse
     on their own emissive intensity — cheap: only meshes with emissiveIntensity */
  const isLed = (spec.emissiveIntensity ?? 0) > 0
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    if (!isLed || !matRef.current || active || hover || dim) return
    const base = spec.emissiveIntensity ?? 0
    matRef.current.emissiveIntensity = base * (0.72 + 0.28 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.6 + phase)))
  })

  /* lacquered parts get a physical material — the clearcoat layer is what
     separates "machined hardware" from "moulded plastic" under studio light */
  const lacquered = (spec.clearcoat ?? 0) > 0 && !dim
  const Mat: React.ElementType = lacquered ? 'meshPhysicalMaterial' : 'meshStandardMaterial'

  return (
    <Mat
      ref={matRef}
      color={color}
      roughness={dim ? 0.95 : (spec.roughness ?? 0.6)}
      metalness={dim ? 0.02 : (spec.metalness ?? 0.1)}
      emissive={active ? '#c98f3a' : hover ? '#7a5a20' : dim ? '#000000' : (spec.emissive ?? '#000000')}
      emissiveIntensity={active ? 0.85 : hover ? 0.45 : dim ? 0 : (spec.emissiveIntensity ?? 0)}
      transparent={transparent}
      opacity={opacity}
      depthWrite={!transparent || opacity > 0.55}
      clippingPlanes={clip ? planes : undefined}
      side={THREE.DoubleSide}
      envMapIntensity={dim ? 0.2 : (spec.envIntensity ?? 0.9)}
      {...(lacquered
        ? {
            clearcoat: spec.clearcoat,
            clearcoatRoughness: spec.clearcoatRoughness ?? 0.2,
            reflectivity: 0.6,
          }
        : null)}
    />
  )
}

export type PBase = {
  id: string
  mat?: MatSpec
  clip?: boolean
  shell?: boolean
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  visible?: boolean
}
export type PProps = PBase & {
  geometry?: THREE.BufferGeometry
  children?: React.ReactNode
}
export type PX = Omit<PProps, 'children' | 'geometry'>

/* Generic selectable part */
export const P = React.forwardRef<THREE.Mesh, PProps>(function P(
  { id, mat = M.steel, clip = false, shell = false, geometry, children, position, ...rest },
  ref,
) {
  const { selected, hovered, setSelected, setHovered, mode, partOffsets, offsetFade, freeMove } = useViewer()
  const isRadio = id === 'host-radio'
  const active = selected === id
  const hover = hovered === id
  const dim = selected !== null && !active && !isRadio
  const xray =
    shell &&
    (mode === 'internal' ||
      mode === 'pcb' ||
      (mode === 'assembled' && selected !== null && selected !== 'upper-enclosure' && selected !== 'lower-enclosure'))

  /* live registry so FREE MOVE knows every mesh that belongs to this part */
  const inner = useRef<THREE.Mesh>(null)
  React.useImperativeHandle(ref, () => inner.current as THREE.Mesh)
  useEffect(() => {
    const o = inner.current
    if (!o) return
    let set = PART_OBJECTS.get(id)
    if (!set) {
      set = new Set<THREE.Object3D>()
      PART_OBJECTS.set(id, set)
    }
    set.add(o)
    return () => {
      const s2 = PART_OBJECTS.get(id)
      if (!s2) return
      s2.delete(o)
      if (s2.size === 0) PART_OBJECTS.delete(id)
    }
  }, [id])

  /* dev-only QA hook: lets a headless browser inspect the live part registry */
  const DEV = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
  if (DEV && typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>).__parts = PART_OBJECTS
    ;(window as unknown as Record<string, unknown>).__THREE = THREE
  }

  /* own offset + every ancestor's offset, so children ride with their parent */
  const offset = resolveOffset(id, partOffsets, offsetFade)
  const finalPos: [number, number, number] | undefined = position
    ? [position[0] + offset[0], position[1] + offset[1], position[2] + offset[2]]
    : offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0
      ? offset
      : undefined

  return (
    <mesh
      ref={inner}
      castShadow
      receiveShadow
      geometry={geometry}
      position={finalPos}
      onPointerOver={
        isRadio
          ? undefined
          : (e) => {
              e.stopPropagation()
              if (DragCtl.dragging) return
              setHovered(id)
              document.body.style.cursor = freeMove ? 'grab' : 'pointer'
            }
      }
      onPointerOut={
        isRadio
          ? undefined
          : (e) => {
              e.stopPropagation()
              if (DragCtl.dragging) return
              setHovered(null)
              document.body.style.cursor = 'auto'
            }
      }
      onPointerDown={
        isRadio
          ? undefined
          : (e) => {
              /* FREE MOVE: grab the part directly — no gizmo needed */
              if (!freeMove) return
              const native = e.nativeEvent as PointerEvent
              if (native.button !== 0) return
              /* the gizmo is an overlay: aiming at a handle always wins */
              if (DragCtl.dragging || hitGizmo(e.ray, e.camera)) return
              e.stopPropagation()
              if (!active) setSelected(id)
              DragCtl.begin?.(native, id, 'screen')
            }
      }
      onClick={
        isRadio
          ? (e) => e.stopPropagation()
          : (e) => {
              e.stopPropagation()
              /* swallow the click that ends a drag / the click that just selected */
              if (consumeClick()) return
              setSelected(active ? null : id)
            }
      }
      {...rest}
    >
      {children}
      <PartMaterial spec={mat} active={active} hover={hover && !isRadio} dim={dim} clip={clip} xray={xray} />
    </mesh>
  )
})

/* ------------------------------------------------------------------ */
/*  Explode-aware group                                                */
/* ------------------------------------------------------------------ */
export function Assy({
  ex = [0, 0, 0],
  px = [0, 0, 0],
  children,
}: {
  ex?: [number, number, number]
  px?: [number, number, number]
  children: React.ReactNode
}) {
  const { anim } = useViewer()
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const a = anim.current
    g.position.set(ex[0] * a.e + px[0] * a.p, ex[1] * a.e + px[1] * a.p, ex[2] * a.e + px[2] * a.p)
  })
  return <group ref={ref}>{children}</group>
}

/* ------------------------------------------------------------------ */
/*  Small geometry helpers                                             */
/* ------------------------------------------------------------------ */
export function Box({ size, ...rest }: { size: [number, number, number] } & PX) {
  return (
    <P {...rest}>
      <boxGeometry args={size} />
    </P>
  )
}

/* Rounded box — filleted edges for moulded housings */
export function RBox({
  size,
  radius = 0.2,
  seg = 3,
  ...rest
}: { size: [number, number, number]; radius?: number; seg?: number } & PX) {
  const geo = useMemo(
    () => new RoundedBoxGeometry(size[0], size[1], size[2], seg, radius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size[0], size[1], size[2], seg, radius],
  )
  useEffect(() => () => geo.dispose(), [geo])
  return <P geometry={geo} {...rest} />
}

export function Cyl({
  r,
  h,
  axis = 'y',
  seg = 24,
  ...rest
}: {
  r: number
  h: number
  axis?: 'x' | 'y' | 'z'
  seg?: number
} & PX) {
  const rot: [number, number, number] =
    axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  return (
    <P rotation={rot} {...rest}>
      <cylinderGeometry args={[r, r, h, seg]} />
    </P>
  )
}

export function Ring({
  rO,
  rI,
  h,
  seg = 32,
  ...rest
}: {
  rO: number
  rI: number
  h: number
  seg?: number
} & PX) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.absarc(0, 0, rO, 0, Math.PI * 2, false)
    const p = new THREE.Path()
    p.absarc(0, 0, rI, 0, Math.PI * 2, true)
    s.holes.push(p)
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg })
    g.rotateX(-Math.PI / 2)
    return g
  }, [rO, rI, h, seg])
  useEffect(() => () => geo.dispose(), [geo])
  return <P geometry={geo} {...rest} />
}

export function Tube({
  points,
  r,
  seg = 44,
  rad = 10,
  ...rest
}: {
  points: [number, number, number][]
  r: number
  seg?: number
  rad?: number
} & PX) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
    return new THREE.TubeGeometry(curve, seg, r, rad, false)
  }, [points, r, seg, rad])
  useEffect(() => () => geo.dispose(), [geo])
  return <P geometry={geo} {...rest} />
}

/* PCB copper trace polyline */
export function Trace({
  pts,
  w = 0.05,
  y = 0.446,
  id = 'main-pcb',
}: {
  pts: [number, number][]
  w?: number
  y?: number
  id?: string
}) {
  const parts: React.ReactNode[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i]
    const [x2, z2] = pts[i + 1]
    const dx = x2 - x1
    const dz = z2 - z1
    const len = Math.hypot(dx, dz)
    if (len < 1e-4) continue
    parts.push(
      <Box
        key={i}
        id={id}
        mat={M.copper}
        size={[Math.abs(dx) > 1e-4 ? len : w, 0.014, Math.abs(dx) > 1e-4 ? w : len]}
        position={[(x1 + x2) / 2, y, (z1 + z2) / 2]}
      />,
    )
  }
  return <group>{parts}</group>
}

/* ------------------------------------------------------------------ */
/*  Studio environment (offline PMREM from RoomEnvironment)            */
/* ------------------------------------------------------------------ */
export function StudioEnv() {
  const { gl, scene } = useThree()
  useEffect(() => {
    /* filmic response + slight over-exposure for satin metals */
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.12
    let env: THREE.Texture | null = null
    let pmrem: THREE.PMREMGenerator | null = null
    let cancelled = false
    import('three/examples/jsm/environments/RoomEnvironment.js')
      .then((mod) => {
        if (cancelled) return
        pmrem = new THREE.PMREMGenerator(gl)
        const room = new mod.RoomEnvironment()
        const rt = pmrem.fromScene(room, 0.04)
        env = rt.texture
        scene.environment = env
        scene.environmentIntensity = 0.6
        room.dispose?.()
      })
      .catch(() => {
        /* fall back to lights only */
      })
    return () => {
      cancelled = true
      scene.environment = null
      env?.dispose()
      pmrem?.dispose()
    }
  }, [gl, scene])
  return null
}
