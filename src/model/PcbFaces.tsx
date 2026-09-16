import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { M } from '../lib/materials'
import { Box, Cyl, Ring, useViewer } from '../lib/viewer'

const PY = 0.44 // top copper surface
const BY = 0.28 // bottom copper surface (1.6 mm FR-4)

/* board outline, matching MainPcb: 60.5 × 36 mm centred at (−0.075, −0.22) */
const BX = -0.075
const BZ = -0.22
const BW = 6.05
const BD = 3.6

/* ------------------------------------------------------------------ */
/*  silkscreen textures — real reference designators for the BOM       */
/* ------------------------------------------------------------------ */
function useSilk(draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    draw(ctx, w, h)
    const t = new THREE.CanvasTexture(c)
    t.anisotropy = 8
    t.colorSpace = THREE.SRGBColorSpace
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

const SILK = 'rgba(226,232,224,0.85)'
const SILK_DIM = 'rgba(226,232,224,0.55)'

/* map board coords (x,z) → canvas px.  Canvas U = +X, V = +Z */
const ux = (x: number, w: number) => ((x - (BX - BW / 2)) / BW) * w
const vz = (z: number, h: number) => ((z - (BZ - BD / 2)) / BD) * h

function label(ctx: CanvasRenderingContext2D, t: string, x: number, z: number, w: number, h: number, s = 15) {
  ctx.font = `700 ${s}px "JetBrains Mono", monospace`
  ctx.fillText(t, ux(x, w), vz(z, h))
}

function outline(ctx: CanvasRenderingContext2D, x: number, z: number, sx: number, sz: number, w: number, h: number) {
  ctx.strokeRect(ux(x - sx / 2, w), vz(z - sz / 2, h), (sx / BW) * w, (sz / BD) * h)
}

/* ---- TOP SILKSCREEN ---- */
function drawTop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = SILK_DIM
  ctx.fillStyle = SILK
  ctx.lineWidth = 1.6

  /* component outlines */
  outline(ctx, 0.55, -0.2, 1.8, 2.55, w, h) // U1 ESP32-S3-WROOM-1
  outline(ctx, -1.85, 0.35, 0.4, 0.4, w, h) // U2 ES7210
  outline(ctx, -1.85, -0.85, 0.3, 0.3, w, h) // U3 ES8311
  outline(ctx, -2.85, -0.3, 0.4, 0.4, w, h) // U4 MCP73871
  outline(ctx, 2.2, -1.2, 0.6, 0.5, w, h) // U7 W25Q128JV

  /* designators */
  label(ctx, 'U1', 0.55, -1.72, w, h, 17)
  label(ctx, 'U2', -1.85, 0.78, w, h)
  label(ctx, 'U3', -1.85, -1.22, w, h)
  label(ctx, 'U4', -2.85, -0.72, w, h)
  label(ctx, 'U5', -2.5, 0.55, w, h, 13)
  label(ctx, 'U6', -2.2, 0.92, w, h, 13)
  label(ctx, 'U7', 2.2, -1.62, w, h)
  label(ctx, 'Y1', 0.05, 1.62, w, h, 13)
  label(ctx, 'L1', -2.5, -0.95, w, h, 13)
  label(ctx, 'J1', -2.55, 1.66, w, h, 13)
  label(ctx, 'J2', 2.75, 0.06, w, h, 13)
  label(ctx, 'J3', -2.72, -1.72, w, h, 13)
  label(ctx, 'MK1', 2.72, 1.68, w, h, 13)
  label(ctx, 'MK2', -0.9, 1.68, w, h, 13)
  label(ctx, 'SW1', -2.35, -1.32, w, h, 12)
  label(ctx, 'SW2', -2.35, 0.02, w, h, 12)
  label(ctx, 'D1', 0.5, -1.55, w, h, 11)
  label(ctx, 'D2', 1.0, -1.55, w, h, 11)
  label(ctx, 'D3', 1.5, -1.55, w, h, 11)
  label(ctx, 'D4', 2.0, -1.55, w, h, 11)

  /* pin-1 markers */
  ctx.fillStyle = SILK
  ;[
    [-1.85, 0.35],
    [-1.85, -0.85],
    [-2.85, -0.3],
    [2.2, -1.2],
  ].forEach(([x, z]) => {
    ctx.beginPath()
    ctx.arc(ux(x - 0.28, w), vz(z - 0.28, h), 3.4, 0, Math.PI * 2)
    ctx.fill()
  })

  /* board identity, bottom-right */
  ctx.textAlign = 'right'
  ctx.fillStyle = SILK_DIM
  ctx.font = '700 16px "JetBrains Mono", monospace'
  ctx.fillText('SHIELD-COM  SC-PCB-A3  REV C', ux(2.85, w), vz(1.42, h))
}

/* ---- BOTTOM SILKSCREEN ---- */
function drawBottom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = SILK
  ctx.strokeStyle = SILK_DIM
  ctx.lineWidth = 1.6

  /* test-point designators */
  const tps = ['TP1 3V3', 'TP2 1V8', 'TP3 VBAT', 'TP4 GND', 'TP5 BCLK', 'TP6 WS', 'TP7 DIN', 'TP8 BOOT']
  tps.forEach((t, i) => {
    ctx.font = '700 12px "JetBrains Mono", monospace'
    ctx.fillText(t, ux(-2.2 + (i % 4) * 0.62, w), vz(-1.32 + Math.floor(i / 4) * 0.42, h))
  })

  /* solder-side decoupling designators */
  ctx.font = '700 11px "JetBrains Mono", monospace'
  ctx.fillStyle = SILK_DIM
  ;['C41', 'C42', 'C43', 'C44', 'C45', 'C46'].forEach((t, i) =>
    ctx.fillText(t, ux(0.0 + (i % 3) * 0.55, w), vz(0.52 + Math.floor(i / 3) * 0.5, h)),
  )
  ;['R21', 'R22', 'R23'].forEach((t, i) => ctx.fillText(t, ux(1.95 + i * 0.42, w), vz(-0.35, h)))

  /* ground-plane hatch hint */
  ctx.strokeStyle = 'rgba(226,232,224,0.10)'
  ctx.lineWidth = 1
  for (let i = -h; i < w; i += 22) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + h, h)
    ctx.stroke()
  }

  /* identity block + compliance marks */
  ctx.textAlign = 'left'
  ctx.fillStyle = SILK
  ctx.font = '800 22px "JetBrains Mono", monospace'
  ctx.fillText('SHIELD-COM', ux(-2.8, w), vz(1.18, h))
  ctx.font = '600 14px "JetBrains Mono", monospace'
  ctx.fillStyle = SILK_DIM
  ctx.fillText('SC-PCB-A3 · REV C · 4L FR-4 1.6 mm · ENIG', ux(-2.8, w), vz(1.48, h))
  ctx.textAlign = 'right'
  ctx.fillText('ESP32-S3-WROOM-1  ·  ES7210 / ES8311', ux(2.85, w), vz(-1.66, h))

  /* layer-stack legend */
  ctx.textAlign = 'left'
  ctx.font = '600 12px "JetBrains Mono", monospace'
  ctx.fillText('L1 SIG · L2 GND · L3 PWR · L4 SIG', ux(-2.8, w), vz(0.55, h))
}

/* ------------------------------------------------------------------ */
/*  SOLDER-SIDE (BOTTOM) CONTENT                                       */
/*  Real 4-layer practice: local decoupling mirrored under the hot     */
/*  devices, series termination, a probe-pad field and the mounting    */
/*  pads. No invented ICs — the bottom carries passives + pads only.   */
/* ------------------------------------------------------------------ */
export function PcbBottom() {
  const top = useSilk(drawTop, 1210, 720)
  const bot = useSilk(drawBottom, 1210, 720)

  const caps: [number, number][] = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) caps.push([0.0 + i * 0.55, 0.52 + j * 0.5])
  const res: [number, number][] = [
    [1.95, -0.35],
    [2.37, -0.35],
    [2.79, -0.35],
  ]

  return (
    <group>
      {/* ---------- silkscreen layers ---------- */}
      <mesh position={[BX, PY + 0.009, BZ]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[BW, BD]} />
        <meshBasicMaterial map={top} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      <mesh position={[BX, BY - 0.009, BZ]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[BW, BD]} />
        <meshBasicMaterial map={bot} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-3} />
      </mesh>

      {/* ---------- bottom copper pour ---------- */}
      <Box id="main-pcb" mat={M.pcbEdge} size={[BW + 0.02, 0.012, BD + 0.02]} position={[BX, BY + 0.001, BZ]} />

      {/* ---------- solder-side decoupling (0402, 0.5 mm tall) ---------- */}
      {caps.map(([x, z], i) => (
        <Box key={`c${i}`} id="passives" mat={M.cap} size={[0.1, 0.04, 0.05]} position={[x, BY - 0.02, z]} />
      ))}
      {res.map(([x, z], i) => (
        <Box key={`r${i}`} id="passives" mat={M.res} size={[0.16, 0.055, 0.08]} position={[x, BY - 0.028, z]} />
      ))}
      {/* bulk reservoir under the power section (0805) */}
      <Box id="passives" mat={M.tant} size={[0.2, 0.07, 0.125]} position={[-2.6, BY - 0.035, 0.2]} />
      <Box id="passives" mat={M.tant} size={[0.2, 0.07, 0.125]} position={[-2.6, BY - 0.035, -0.1]} />

      {/* ---------- probe-pad field (bed-of-nails test) ---------- */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Cyl
          key={`tp${i}`}
          id="test-points"
          mat={M.gold}
          r={0.045}
          h={0.014}
          position={[-2.2 + (i % 4) * 0.62, BY - 0.007, -1.32 + Math.floor(i / 4) * 0.42]}
        />
      ))}

      {/* ---------- mounting-hole annular rings (bottom) ---------- */}
      {[
        [2.85, -1.85],
        [2.85, 1.35],
        [-2.85, -1.85],
        [-2.85, 1.35],
      ].map(([x, z], i) => (
        <Ring key={i} id="main-pcb" mat={M.gold} rO={0.24} rI={0.14} h={0.02} position={[x, BY - 0.022, z]} />
      ))}

      {/* ---------- stitching vias around the RF / analogue boundary ---------- */}
      {Array.from({ length: 14 }).map((_, i) => (
        <Cyl
          key={`v${i}`}
          id="main-pcb"
          mat={M.copper}
          r={0.022}
          h={0.17}
          position={[-0.5 + i * 0.16, 0.36, 1.05]}
        />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  FLIP RIG — rotates the whole board assembly about its long axis    */
/*  so the solder side can be inspected in PCB DETAIL mode.            */
/* ------------------------------------------------------------------ */
export function PcbFlip({ children }: { children: React.ReactNode }) {
  const { pcbFace, mode } = useViewer()
  const g = useRef<THREE.Group>(null)
  const pivotY = (PY + BY) / 2
  useFrame((_, dt) => {
    if (!g.current) return
    const want = pcbFace === 'bottom' && mode === 'pcb' ? Math.PI : 0
    const cur = g.current.rotation.x
    g.current.rotation.x = cur + (want - cur) * (1 - Math.exp(-dt * 5))
  })
  return (
    <group position={[BX, pivotY, BZ]}>
      <group ref={g}>
        <group position={[-BX, -pivotY, -BZ]}>{children}</group>
      </group>
    </group>
  )
}
