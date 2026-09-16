import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AnimController, Assy, StudioEnv, useViewer, HOME_POS, HOME_TGT, PRODUCT_POS, PRODUCT_TGT } from './lib/viewer'
import { LABELS, PARTS, FLOW } from './lib/parts'
import { ShieldCom } from './model/ShieldCom'
import { Dimensions } from './model/Dimensions'
import { FreeMoveGizmo } from './model/FreeMoveGizmo'

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

/* ------------------------------------------------------------------ */
/*  camera transitions                                                 */
/* ------------------------------------------------------------------ */
function CameraRig({ controls }: { controls: React.RefObject<React.ComponentRef<typeof OrbitControls> | null> }) {
  const { cam } = useViewer()
  const { camera } = useThree()
  useFrame((_, dt) => {
    const c = cam.current
    const ctl = controls.current as unknown as { target: THREE.Vector3; update: () => void } | null
    if (!c.active) {
      if (ctl) {
        c.toPos.copy(camera.position)
        c.toTgt.copy(ctl.target)
      }
      return
    }
    c.t += dt / Math.max(0.05, c.dur)
    const k = clamp(c.t, 0, 1)
    const e = ease(k)
    camera.position.lerpVectors(c.fromPos, c.toPos, e)
    if (ctl) {
      ctl.target.lerpVectors(c.fromTgt, c.toTgt, e)
      ctl.update()
    }
    if (k >= 1) c.active = false
  })
  return null
}

function AutoOrbit({ controls }: { controls: React.RefObject<React.ComponentRef<typeof OrbitControls> | null> }) {
  const { autoRotate } = useViewer()
  useEffect(() => {
    const ctl = controls.current as unknown as { autoRotate: boolean; autoRotateSpeed: number } | null
    if (ctl) {
      ctl.autoRotate = autoRotate
      ctl.autoRotateSpeed = 0.75
    }
  }, [autoRotate, controls])
  return null
}

/* ------------------------------------------------------------------ */
/*  SECTION PLANE                                                      */
/* ------------------------------------------------------------------ */
function SlicePlane() {
  const { mode, clipRef, setClip } = useViewer()
  const { camera } = useThree()
  const grp = useRef<THREE.Group>(null)
  const dragging = useRef(false)
  const lastX = useRef(0)

  const grid = useMemo(() => {
    const pts: [number, number, number][][] = []
    for (let i = -4; i <= 4; i++) pts.push([[i, -2.1, 0], [i, 2.1, 0]])
    for (let j = -2; j <= 2; j++) pts.push([[-4, j, 0], [4, j, 0]])
    return pts
  }, [])

  useFrame(() => {
    if (grp.current) grp.current.position.z = clipRef.current
  })

  useEffect(() => {
    const move = (ev: PointerEvent) => {
      if (!dragging.current) return
      const dx = ev.clientX - lastX.current
      lastX.current = ev.clientX
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
      const sign = right.z >= 0 ? 1 : -1
      const v = clamp(clipRef.current + dx * 0.022 * sign, -2.62, 2.62)
      setClip(v)
    }
    const up = () => {
      dragging.current = false
      document.body.style.cursor = 'auto'
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [camera, clipRef, setClip])

  if (mode !== 'slice') return null
  return (
    <group ref={grp}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation()
          dragging.current = true
          lastX.current = (e.nativeEvent as PointerEvent).clientX
          document.body.style.cursor = 'ew-resize'
        }}
        onPointerOver={() => (document.body.style.cursor = 'ew-resize')}
      >
        <boxGeometry args={[8.6, 4.4, 0.02]} />
        <meshBasicMaterial color="#cba86a" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {grid.map((p, i) => (
        <Line key={i} points={p} color="#cba86a" lineWidth={0.9} transparent opacity={0.16} />
      ))}
      <Line
        points={[
          [-4.3, -2.2, 0],
          [4.3, -2.2, 0],
          [4.3, 2.2, 0],
          [-4.3, 2.2, 0],
          [-4.3, -2.2, 0],
        ]}
        color="#e8d3a4"
        lineWidth={1.6}
        transparent
        opacity={0.9}
      />
      {[-4.3, 4.3].map((x, i) => (
        <Line key={i} points={[[x, -2.2, 0], [x, -2.55, 0]]} color="#e8d3a4" lineWidth={1.2} transparent opacity={0.6} />
      ))}
      <Html position={[0, 2.5, 0]} center zIndexRange={[20, 10]}>
        <div className="flex flex-col items-center gap-1">
          <div className="mono rounded-sm border border-sky-400/50 bg-slate-950/85 px-2 py-1 text-[9px] tracking-[0.16em] text-sky-300 backdrop-blur">
            SECTION A–A · DRAG ▸
          </div>
        </div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  LABELS — numbered engineering callouts                             */
/* ------------------------------------------------------------------ */
const LABEL_EX: Record<string, [number, number, number]> = {
  'upper-enclosure': [0, 2.55, 0],
  'lower-enclosure': [0, -2.5, 0],
  gasket: [0, 2.05, 0],
  'internal-frame': [0, -1.6, 0],
  'main-pcb': [0, 0.55, 0],
  esp32: [0, 0.55, 0],
  'mic-voice': [0, 0.55, 0],
  'audio-adc': [0, 0.55, 0],
  'power-mgmt': [0, 0.55, 0],
  battery: [0, -0.8, 0],
  'sos-button': [0, 1.4, 0],
  'mark-button': [0, 1.4, 0],
  'status-leds': [0, 0.55, 0],
  'audio-jack': [0, -2.5, 0],
  'radio-cable': [0, 0, 0],
}
const LABEL_PX: Record<string, [number, number, number]> = {
  'main-pcb': [0, -0.45, 0],
  esp32: [0, 0.95, 0],
  'mic-voice': [0, 0.4, 0],
  'audio-adc': [0, 0.75, 0],
  'power-mgmt': [0, 0.65, 0],
  'status-leds': [0, 0.5, 0],
}

function Callout({
  n,
  id,
  text,
  anchor,
  dir,
}: {
  n: number
  id: string
  text: string
  anchor: [number, number, number]
  dir: [number, number, number]
}) {
  const { anim, selected, hovered, setSelected, setHovered, freeMove } = useViewer()
  const grp = useRef<THREE.Group>(null)
  const ex = LABEL_EX[id] ?? [0, 0, 0]
  const px = LABEL_PX[id] ?? [0, 0, 0]
  useFrame(() => {
    const g = grp.current
    if (!g) return
    const a = anim.current
    g.position.set(
      anchor[0] + ex[0] * a.e + px[0] * a.p,
      anchor[1] + ex[1] * a.e + px[1] * a.p,
      anchor[2] + ex[2] * a.e + px[2] * a.p,
    )
  })
  const on = selected === id || hovered === id
  const dim = selected !== null && selected !== id
  const elbow: [number, number, number] = [dir[0] * 0.62, dir[1] * 0.62 + Math.sign(dir[1] || 1) * 0.18, dir[2] * 0.62]
  return (
    <group ref={grp}>
      <Line
        points={[[0, 0, 0], elbow, dir as [number, number, number]]}
        color={on ? '#e8d3a4' : '#828b78'}
        lineWidth={on ? 1.5 : 1}
        transparent
        opacity={dim ? 0.28 : 0.85}
      />
      <mesh>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshBasicMaterial color={on ? '#e8d3a4' : '#8b9583'} transparent opacity={dim ? 0.3 : 1} />
      </mesh>
      <Html position={dir as [number, number, number]} center zIndexRange={[15, 8]}>
        <div
          className={`lbl ${on ? 'sel' : ''} ${dim ? 'dim' : ''}`}
          /* in FREE MOVE the callouts must not swallow drags aimed at the part
             or at the move gizmo underneath them */
          style={{
            pointerEvents: freeMove ? 'none' : 'auto',
            cursor: freeMove ? 'default' : 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (id !== 'host-radio') setSelected(id)
          }}
          onPointerEnter={() => {
            if (id === 'host-radio') return
            setHovered(id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            if (id === 'host-radio') return
            setHovered(null)
            document.body.style.cursor = 'auto'
          }}
        >
          <b>{String(n).padStart(2, '0')}</b>
          {text}
        </div>
      </Html>
    </group>
  )
}

export function Labels() {
  const { labels } = useViewer()
  if (!labels) return null
  return (
    <group>
      {LABELS.map((l, i) => (
        <Callout key={l.id} n={i + 1} {...l} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  ENTRANCE REVEAL — one-shot cinematic settle-in on first load       */
/* ------------------------------------------------------------------ */
function EntranceReveal({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  const t0 = useRef<number | null>(null)
  const done = useRef(false)
  const backOut = (k: number) => {
    const c = 1.7
    const p = k - 1
    return 1 + c * p * p * p + p * p
  }
  useFrame(({ clock }) => {
    if (done.current || !g.current) return
    if (t0.current === null) t0.current = clock.elapsedTime
    const t = clamp((clock.elapsedTime - t0.current) / 1.05, 0, 1)
    const e = backOut(t)
    g.current.scale.setScalar(THREE.MathUtils.clamp(e, 0.001, 1.06))
    g.current.position.y = (1 - ease(Math.min(t * 1.15, 1))) * -3.2
    if (t >= 1) {
      g.current.scale.setScalar(1)
      g.current.position.y = 0
      done.current = true
    }
  })
  return <group ref={g}>{children}</group>
}

/* ------------------------------------------------------------------ */
/*  SELECTION RETICLE — animated corner brackets + radar-style pings    */
/* ------------------------------------------------------------------ */
function Bracket({ size = 0.34 }: { size?: number }) {
  const s = size
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]
  return (
    <>
      {corners.map(([sx, sy], i) => (
        <Line
          key={i}
          points={[
            [sx * (s - 0.14), sy * s, 0],
            [sx * s, sy * s, 0],
            [sx * s, sy * (s - 0.14), 0],
          ]}
          color="#7dd3fc"
          lineWidth={1.8}
          transparent
        />
      ))}
    </>
  )
}

function SelectionReticle() {
  const { selected } = useViewer()
  const grp = useRef<THREE.Group>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const bracket = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const info = selected ? PARTS[selected] : null

  useFrame(({ clock }) => {
    if (!grp.current) return
    grp.current.visible = !!info
    if (!info) return
    grp.current.position.set(info.focus[0], info.focus[1], info.focus[2])
    grp.current.quaternion.copy(camera.quaternion)
    if (bracket.current) bracket.current.rotation.z = Math.sin(clock.elapsedTime * 0.6) * 0.12
    const t = clock.elapsedTime
    ;[ring1, ring2].forEach((r, i) => {
      if (!r.current) return
      const local = ((t + i * 0.7) % 1.4) / 1.4
      const s = 0.22 + local * 0.85
      r.current.scale.setScalar(s)
      const mat = r.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - local) * 0.55
    })
  })

  if (!selected) return null
  return (
    <group ref={grp} renderOrder={20}>
      <group ref={bracket}>
        <Bracket />
      </group>
      {[ring1, ring2].map((r, i) => (
        <mesh key={i} ref={r} raycast={() => null}>
          <ringGeometry args={[0.96, 1, 40]} />
          <meshBasicMaterial color="#cba86a" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#f7eeda" />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  SIGNAL-FLOW PACKETS — small glowing dots travelling the audio path  */
/*  (visual only — communicates the architecture, no fake wiring)      */
/* ------------------------------------------------------------------ */
function FlowPackets() {
  const { arch, anim } = useViewer()
  const curve = useMemo(() => {
    const ids = FLOW.filter((f) => f.id).map((f) => f.id!)
    const seen = new Set<string>()
    const pts: THREE.Vector3[] = []
    ids.forEach((id) => {
      if (seen.has(id)) return
      seen.add(id)
      const p = PARTS[id]?.focus
      if (p) pts.push(new THREE.Vector3(p[0], p[1] + 0.25, p[2]))
    })
    return pts.length > 1 ? new THREE.CatmullRomCurve3(pts) : null
  }, [])
  const dots = useRef<(THREE.Mesh | null)[]>([])
  const N = 4
  useFrame(({ clock }) => {
    if (!curve) return
    const visible = arch && anim.current.e < 0.15
    dots.current.forEach((m, i) => {
      if (!m) return
      m.visible = visible
      if (!visible) return
      const t = ((clock.elapsedTime * 0.16 + i / N) % 1 + 1) % 1
      const p = curve.getPointAt(t)
      m.position.copy(p)
      const s = 0.6 + 0.4 * Math.sin(clock.elapsedTime * 6 + i)
      m.scale.setScalar(0.055 * s)
    })
  })
  if (!curve) return null
  return (
    <group renderOrder={15}>
      {Array.from({ length: N }).map((_, i) => (
        <mesh key={i} ref={(el) => (dots.current[i] = el)} raycast={() => null}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color="#d9bd81" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  DEMO DIRECTOR — chaptered 30 s cinematic sequence                  */
/* ------------------------------------------------------------------ */
export type Chapter = { t: number; dur: number; name: string; sub: string }
export const CHAPTERS: Chapter[] = [
  { t: 0, dur: 3, name: 'ASSEMBLED', sub: 'SHIELD-COM · add-on audio module · 72 × 50 × 26.5 mm' },
  { t: 3, dur: 4, name: 'OUTER SHELL SEPARATION', sub: 'Lid, gasket and controls lift off the assembly axis' },
  { t: 7, dur: 4, name: 'INTERNALS EXPOSED', sub: 'Main PCB, ESP32 module and Li-ion pack become visible' },
  { t: 11, dur: 4, name: 'PCB DETAIL', sub: 'ESP32 · audio ADC/DAC · power section · connectors' },
  { t: 15, dur: 4, name: 'DETAIL ORBIT', sub: 'Roving inspection of the processing and audio sections' },
  { t: 19, dur: 7, name: 'SECTION A–A', sub: 'Cut plane sweeps the enclosure — acoustic path and battery exposed' },
  { t: 26, dur: 4, name: 'REASSEMBLY', sub: 'Returning to the field-ready configuration' },
  { t: 30, dur: 2.5, name: 'HERO VIEW', sub: 'SHIELD-COM · ESP32 AI voice enhancement module' },
]
export const DEMO_END = 32.5

function DemoDirector() {
  const {
    demo,
    demoPaused,
    setDemo,
    setMode,
    focus,
    setAutoRotate,
    clipRef,
    setClip,
    setSelected,
    setDemoChapter,
    setDemoT,
    seekRef,
    restartRef,
  } = useViewer()
  const t = useRef(0)
  const chapter = useRef(-1)
  const uiTick = useRef(0)

  const runChapter = useMemo(
    () => (i: number) => {
      switch (i) {
        case 0:
          setSelected(null)
          setMode('assembled')
          setAutoRotate(true)
          focus([HOME_POS.x, HOME_POS.y, HOME_POS.z], [HOME_TGT.x, HOME_TGT.y, HOME_TGT.z], 1.6)
          break
        case 1:
          setMode('exploded')
          focus([4.6, 3.0, 12.4], [0, 0.9, 0], 2.6)
          break
        case 2:
          focus([-3.2, 3.6, 11.2], [0, 0.5, 0], 2.6)
          break
        case 3:
          setMode('pcb')
          focus([-5.4, 4.6, 8.6], [0.4, 1.2, -0.2], 2.6)
          break
        case 4:
          focus([4.8, 4.2, 8.0], [0.8, 1.4, -0.2], 3.0)
          break
        case 5:
          setAutoRotate(false)
          setMode('slice')
          clipRef.current = 2.55
          setClip(2.55)
          focus([1.4, 2.4, 12.6], [0.2, 0.15, 0], 2.2)
          break
        case 6:
          setMode('assembled')
          setAutoRotate(false)
          focus([PRODUCT_POS.x, PRODUCT_POS.y, PRODUCT_POS.z], [PRODUCT_TGT.x, PRODUCT_TGT.y, PRODUCT_TGT.z], 2.6)
          break
        case 7:
          setAutoRotate(true)
          focus([7.4, 4.0, 10.6], [0.6, 0.15, 0], 3.0)
          break
      }
    },
    [setSelected, setMode, setAutoRotate, focus, clipRef, setClip],
  )

  useFrame((_state, dt) => {
    if (!demo) {
      t.current = 0
      chapter.current = -1
      return
    }
    if (restartRef.current) {
      restartRef.current = false
      t.current = 0
      chapter.current = -1
    }
    if (seekRef.current !== null) {
      const want = seekRef.current
      seekRef.current = null
      t.current = CHAPTERS[want].t + 0.01
      chapter.current = -1
    }
    if (!demoPaused) t.current += Math.min(dt, 0.05)

    let idx = 0
    for (let i = 0; i < CHAPTERS.length; i++) if (t.current >= CHAPTERS[i].t) idx = i
    if (idx !== chapter.current) {
      chapter.current = idx
      setDemoChapter(idx)
      runChapter(idx)
    }
    /* 19 → 26 s : sweep the section plane through the device */
    if (idx === 5) {
      const u = clamp((t.current - 19) / 6.6, 0, 1)
      clipRef.current = 2.55 - u * 4.9
      if (uiTick.current % 3 === 0) setClip(clipRef.current)
    }
    uiTick.current++
    if (uiTick.current % 4 === 0) setDemoT(Math.min(t.current, DEMO_END))
    if (t.current > DEMO_END) {
      setDemo(false)
      autoRotateAfter()
    }
  })

  function autoRotateAfter() {
    setAutoRotate(true)
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  WORKBENCH                                                          */
/* ------------------------------------------------------------------ */
export default function Scene() {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const { setSelected } = useViewer()
  return (
    <>
      <StudioEnv />
      <AnimController />
      <CameraRig controls={controls} />
      <AutoOrbit controls={controls} />
      <DemoDirector />

      {/* three-point studio rig: warm key, cool rim, soft fill */}
      <ambientLight intensity={0.28} />
      <hemisphereLight args={['#ced8c3', '#0b0e09', 0.44]} />
      <directionalLight
        position={[18, 26, 20]}
        intensity={2.0}
        color="#fff4e4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={7}
      >
        <orthographicCamera attach="shadow-camera" args={[-24, 24, 30, -16, 1, 100]} />
      </directionalLight>
      <directionalLight position={[-9, 5, -7]} intensity={0.6} color="#c3ccb0" />
      <directionalLight position={[2, 3, -11]} intensity={0.8} color="#aab283" />
      <spotLight position={[3, 9, 6]} angle={0.6} penumbra={1} intensity={30} distance={28} color="#d8dcc6" />
      <pointLight position={[-5, -0.5, 4.5]} intensity={4} distance={14} color="#ffddb0" />

      <group
        position={[0, -0.1, 0]}
        onPointerMissed={() => setSelected(null)}
      >
        <EntranceReveal>
          <Assy>
            <ShieldCom />
          </Assy>
        </EntranceReveal>
        <Dimensions />
        <SelectionReticle />
        <FlowPackets />
        <FreeMoveGizmo />
      </group>

      <SlicePlane />
      <Labels />

      <ContactShadows position={[4, -2.52, 0]} opacity={0.62} scale={44} blur={2.2} far={9} resolution={1024} />
      {/* satin studio deck with a faint reflective sheen */}
      {/* single satin studio deck — every object stands ON it (nothing is cut by it) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -2.54, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#0e120c" roughness={0.52} metalness={0.45} envMapIntensity={0.22} />
      </mesh>

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.075}
        minDistance={2.6}
        maxDistance={130}
        maxPolarAngle={Math.PI * 0.92}
        target={HOME_TGT}
      />

      <EffectComposer multisampling={4}>
        <Bloom intensity={0.24} luminanceThreshold={0.82} luminanceSmoothing={0.3} mipmapBlur radius={0.6} />
        <Vignette offset={0.28} darkness={0.62} />
      </EffectComposer>
    </>
  )
}
