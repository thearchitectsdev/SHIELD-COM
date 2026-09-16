import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { M } from '../lib/materials'
import { Box, Cyl, RBox, Tube } from '../lib/viewer'

/* ------------------------------------------------------------------ */
/*  HOST RADIO — Radmor 3501-class VHF tactical handheld               */
/*  TRUE SCALE, 1 unit = 10 mm.                                        */
/*  Datasheet (manufacturer, 2023): 230 (H) × 91/75 (W) × 43 (D) mm    */
/*  with battery, without antenna · 940 g with Li-Ion · 30–88 MHz      */
/* ------------------------------------------------------------------ */
export const RADIO = {
  cx: 10.6, // centre X  (module sits at the origin, radio ~30 mm to its right)
  y0: -2.44, // floor contact in model space (scene floor is at −2.54 world, group −0.1)
  w: 7.5, // body width  (X)   → 75 mm
  d: 4.3, // body depth  (Z)   → 43 mm
  hBatt: 7.5, // battery pack height → 75 mm
  hBody: 15.5, // olive transceiver body → 155 mm   (total 230 mm)
  ant: 34.7, // flexible whip above the deck → ≈ 350 mm
}
const R = RADIO
export const RADIO_TOP = R.y0 + R.hBatt + R.hBody // 20.56
const TOP = RADIO_TOP
const FZ = R.d / 2 // front face plane (+Z, faces the viewer)
const BY = R.y0 + R.hBatt // battery / body seam

/* audio accessory connector that SHIELD-COM plugs into */
export const RADIO_AUDIO_PORT: [number, number, number] = [R.cx - 0.5, TOP, 0.75]

/* ------------------------------------------------------------------ */
/*  canvas textures                                                    */
/* ------------------------------------------------------------------ */
function useTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
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

function drawDisplay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#10221a')
  g.addColorStop(1, '#060d09')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  /* amber header bar */
  ctx.fillStyle = 'rgba(232,180,74,0.92)'
  ctx.fillRect(0, 0, w, h * 0.17)
  ctx.fillStyle = '#1a1206'
  ctx.font = '700 34px "JetBrains Mono", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText('CH 07', 22, h * 0.085)
  ctx.fillText('41.250 MHz', 150, h * 0.085)
  /* battery glyph */
  ctx.strokeStyle = '#1a1206'
  ctx.lineWidth = 4
  ctx.strokeRect(w - 96, h * 0.045, 62, h * 0.08)
  ctx.fillRect(w - 32, h * 0.065, 8, h * 0.04)
  ctx.fillRect(w - 90, h * 0.06, 14, h * 0.05)
  ctx.fillRect(w - 72, h * 0.06, 14, h * 0.05)
  ctx.fillRect(w - 54, h * 0.06, 14, h * 0.05)
  /* body lines */
  ctx.fillStyle = '#86f2a8'
  ctx.font = '600 31px "JetBrains Mono", monospace'
  ctx.fillText('RADIO ID   3F2A', 22, h * 0.32)
  ctx.fillText('MODE   FH · SEC', 22, h * 0.48)
  ctx.fillText('SQ ON   PWR HI   GPS 3D', 22, h * 0.64)
  /* soft-key row */
  ctx.fillStyle = 'rgba(134,242,168,0.16)'
  ctx.fillRect(0, h * 0.83, w, h * 0.17)
  ctx.fillStyle = '#86f2a8'
  ctx.font = '700 27px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ;['MENU', 'SCAN', 'ZERO', 'LOCK'].forEach((s, i) => ctx.fillText(s, (w / 4) * (i + 0.5), h * 0.915))
}

function drawKeypad(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const L = [
    ['1', '2', '3', 'C'],
    ['4', '5', '6', 'E'],
    ['7', '8', '9', '▲'],
    ['✱', '0', '#', '▼'],
  ]
  const S = [
    ['', 'ABC', 'DEF', ''],
    ['GHI', 'JKL', 'MNO', ''],
    ['PQRS', 'TUV', 'WXYZ', ''],
    ['', '', '', ''],
  ]
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const x = (w / 4) * (c + 0.5)
      const y = (h / 4) * (r + 0.5)
      ctx.fillStyle = 'rgba(236,240,232,0.92)'
      ctx.font = '800 54px "Inter", sans-serif'
      ctx.fillText(L[r][c], x, y - (S[r][c] ? 10 : 0))
      if (S[r][c]) {
        ctx.fillStyle = 'rgba(236,240,232,0.6)'
        ctx.font = '600 20px "Inter", sans-serif'
        ctx.fillText(S[r][c], x, y + 34)
      }
    }
}

/* perforated speaker-grille dot field */
function drawGrille(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(8,10,8,0.95)'
  const step = 16
  for (let y = step / 2; y < h; y += step)
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath()
      ctx.arc(x + (Math.floor(y / step) % 2 ? step / 2 : 0), y, 4.2, 0, Math.PI * 2)
      ctx.fill()
    }
}

function drawMarking(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(210,216,200,0.55)'
  ctx.font = '700 46px "JetBrains Mono", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText('VHF 30–88 MHz  ·  3 W', 8, h / 2)
}

/* ------------------------------------------------------------------ */
/*  connector helper — U-229-style 6-pin audio / data socket           */
/* ------------------------------------------------------------------ */
function AudioSocket({ x, z, pins = true }: { x: number; z: number; pins?: boolean }) {
  return (
    <group>
      <Cyl id="host-radio" mat={M.darkSteel} r={0.55} h={0.75} position={[x, TOP + 0.53, z]} />
      <Cyl id="host-radio" mat={M.steel} r={0.66} h={0.3} seg={14} position={[x, TOP + 1.05, z]} />
      <Cyl id="host-radio" mat={M.brass} r={0.3} h={0.05} position={[x, TOP + 1.22, z]} />
      {pins &&
        [0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <Cyl
              key={i}
              id="host-radio"
              mat={M.gold}
              r={0.045}
              h={0.14}
              position={[x + Math.cos(a) * 0.17, TOP + 1.3, z + Math.sin(a) * 0.17]}
            />
          )
        })}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  HOST RADIO                                                         */
/* ------------------------------------------------------------------ */
export function HostRadio() {
  const disp = useTex(drawDisplay, 640, 384)
  const keys = useTex(drawKeypad, 512, 512)
  const mark = useTex(drawMarking, 640, 80)
  const grille = useTex(drawGrille, 256, 96)

  const KY = 10.6 // keypad centre
  const cols = [-2.1, -0.7, 0.7, 2.1]
  const rows = [12.7, 11.3, 9.9, 8.5]
  const ribs: number[] = []
  for (let y = BY + 0.75; y < TOP - 0.6; y += 0.95) ribs.push(y)

  return (
    <group>
      {/* ================= BATTERY PACK (black, 75 mm tall) ================= */}
      <RBox id="host-radio" mat={M.radioBlk} size={[8.0, R.hBatt, 4.4]} radius={0.35} position={[R.cx, R.y0 + R.hBatt / 2, 0]} />
      <Box id="host-radio" mat={M.radioBlk} size={[8.05, 0.2, 4.45]} position={[R.cx, BY, 0]} />
      {/* side grip grooves */}
      {[0.6, 1.5, 2.4, 3.3, 4.2].map((dy, i) => (
        <group key={i}>
          <Box id="host-radio" mat={M.radioRub} size={[0.08, 0.16, 3.6]} position={[R.cx - 4.02, R.y0 + dy, 0]} />
          <Box id="host-radio" mat={M.radioRub} size={[0.08, 0.16, 3.6]} position={[R.cx + 4.02, R.y0 + dy, 0]} />
        </group>
      ))}
      {/* battery release latch */}
      <Box id="host-radio" mat={M.darkSteel} size={[1.6, 0.34, 0.22]} position={[R.cx, BY - 0.5, 2.2]} />
      <Box id="host-radio" mat={M.radioRub} size={[1.0, 0.14, 0.08]} position={[R.cx, BY - 0.5, 2.34]} />

      {/* ================= TRANSCEIVER BODY (olive, 155 mm tall) ================= */}
      <RBox id="host-radio" mat={M.radio} size={[R.w, R.hBody, R.d]} radius={0.45} position={[R.cx, BY + R.hBody / 2, 0]} />
      {/* darker top plate */}
      <Box id="host-radio" mat={M.radioPlate} size={[7.3, 0.16, 4.1]} position={[R.cx, TOP + 0.08, 0]} />
      {/* side grip ribs (rear half, both sides) */}
      {ribs.map((y, i) => (
        <group key={i}>
          <Box id="host-radio" mat={M.radioDark} size={[0.12, 0.2, 1.3]} position={[R.cx - R.w / 2 - 0.05, y, -1.35]} />
          <Box id="host-radio" mat={M.radioDark} size={[0.12, 0.2, 3.4]} position={[R.cx + R.w / 2 + 0.05, y, -0.2]} />
        </group>
      ))}

      {/* ================= FRONT PANEL (recessed charcoal) ================= */}
      <Box id="host-radio" mat={M.radioPanel} size={[6.6, 14.6, 0.1]} position={[R.cx, BY + 0.45 + 7.3, FZ + 0.03]} />

      {/* display bezel + screen */}
      <Box id="host-radio" mat={M.radioBlk} size={[6.0, 4.0, 0.14]} position={[R.cx, 17.9, FZ + 0.1]} />
      <mesh position={[R.cx, 17.9, FZ + 0.18]} raycast={() => null}>
        <planeGeometry args={[5.2, 3.12]} />
        <meshStandardMaterial map={disp} emissiveMap={disp} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.35} />
      </mesh>
      {/* perforated speaker grille (recessed dark acoustic mesh) */}
      <Box id="host-radio" mat={M.radioBlk} size={[4.0, 1.5, 0.1]} position={[R.cx - 0.9, 14.85, FZ + 0.08]} />
      <mesh position={[R.cx - 0.9, 14.85, FZ + 0.14]} raycast={() => null}>
        <planeGeometry args={[3.7, 1.25]} />
        <meshStandardMaterial map={grille} transparent roughness={0.9} metalness={0.05} color="#23281f" />
      </mesh>
      {/* model marking beside the speaker */}
      <mesh position={[R.cx + 1.9, 14.85, FZ + 0.09]} raycast={() => null}>
        <planeGeometry args={[2.2, 0.28]} />
        <meshBasicMaterial map={mark} transparent depthWrite={false} />
      </mesh>
      {/* function-key row */}
      {cols.map((dx, i) => (
        <RBox
          key={i}
          id="host-radio"
          mat={i === 3 ? M.keyLight : M.key}
          size={[1.15, 0.6, 0.2]}
          radius={0.06}
          position={[R.cx + dx, 13.85, FZ + 0.18]}
        />
      ))}

      {/* keypad backing + 16 keys + printed legends */}
      <Box id="host-radio" mat={M.radioBlk} size={[6.0, 6.2, 0.06]} position={[R.cx, KY, FZ + 0.09]} />
      {rows.map((y, r) =>
        cols.map((dx, c) => (
          <RBox
            key={`${r}-${c}`}
            id="host-radio"
            mat={c === 3 ? M.keyLight : M.key}
            size={[1.15, 1.0, 0.24]}
            radius={0.08}
            position={[R.cx + dx, y, FZ + 0.2]}
          />
        )),
      )}
      <mesh position={[R.cx, KY, FZ + 0.325]} raycast={() => null}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial map={keys} transparent depthWrite={false} />
      </mesh>
      {/* microphone port */}
      {[-0.25, 0, 0.25].map((dx, i) => (
        <Cyl key={i} id="host-radio" mat={M.radioBlk} r={0.06} h={0.08} axis="z" position={[R.cx + dx, 6.6, FZ + 0.08]} />
      ))}

      {/* ================= TOP DECK ================= */}
      {/* antenna — TNC base, knurled nut, rubber sleeve, tapered flexible whip (~350 mm) */}
      <Cyl id="host-radio" mat={M.darkSteel} r={0.6} h={0.4} position={[R.cx - 2.55, TOP + 0.36, -0.85]} />
      <Cyl id="host-radio" mat={M.steel} r={0.68} h={0.35} seg={14} position={[R.cx - 2.55, TOP + 0.74, -0.85]} />
      {/* rubber strain boot at the antenna base */}
      <Cyl id="host-radio" mat={M.radioRub} r={0.52} h={0.35} position={[R.cx - 2.55, TOP + 1.05, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.47} h={0.4} position={[R.cx - 2.55, TOP + 1.35, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.45} h={1.4} position={[R.cx - 2.55, TOP + 1.6, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.34} h={8} position={[R.cx - 2.55, TOP + 6.3, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.29} h={8} position={[R.cx - 2.55, TOP + 14.3, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.25} h={8} position={[R.cx - 2.55, TOP + 22.3, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.21} h={8} position={[R.cx - 2.55, TOP + 30.3, -0.85]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.24} h={0.4} position={[R.cx - 2.55, TOP + 34.5, -0.85]} />
      <Cyl id="host-radio" mat={M.keyLight} r={0.3} h={0.15} position={[R.cx - 2.55, TOP + 10.3, -0.85]} />

      {/* twin audio / data sockets (U-229 style) */}
      <AudioSocket x={RADIO_AUDIO_PORT[0]} z={RADIO_AUDIO_PORT[2]} pins={false} />
      <AudioSocket x={R.cx + 0.9} z={0.75} />

      {/* channel selector + volume / power knobs (skirted, indexed) */}
      <Cyl id="host-radio" mat={M.radioBlk} r={0.82} h={0.18} seg={20} position={[R.cx + 2.5, TOP + 0.26, -0.8]} />
      <Cyl id="host-radio" mat={M.radioBlk} r={0.74} h={0.85} seg={20} position={[R.cx + 2.5, TOP + 0.72, -0.8]} />
      <Cyl id="host-radio" mat={M.radioDark} r={0.5} h={0.06} position={[R.cx + 2.5, TOP + 1.16, -0.8]} />
      <Box id="host-radio" mat={M.keyLight} size={[0.1, 0.05, 0.55]} position={[R.cx + 2.5, TOP + 1.2, -0.8]} />
      <Cyl id="host-radio" mat={M.radioBlk} r={0.64} h={0.16} seg={20} position={[R.cx + 2.5, TOP + 0.24, 0.95]} />
      <Cyl id="host-radio" mat={M.radioBlk} r={0.56} h={0.7} seg={20} position={[R.cx + 2.5, TOP + 0.62, 0.95]} />
      <Cyl id="host-radio" mat={M.radioDark} r={0.36} h={0.05} position={[R.cx + 2.5, TOP + 0.99, 0.95]} />
      <Box id="host-radio" mat={M.keyLight} size={[0.42, 0.045, 0.09]} position={[R.cx + 2.5, TOP + 1.02, 0.95]} />

      {/* ================= SIDE CONTROLS (left) ================= */}
      <Box id="host-radio" mat={M.radioDark} size={[0.25, 3.7, 2.0]} position={[R.cx - R.w / 2 - 0.07, 14.6, 0.2]} />
      <RBox id="host-radio" mat={M.radioRub} size={[0.55, 3.2, 1.5]} radius={0.2} position={[R.cx - R.w / 2 - 0.2, 14.6, 0.2]} />
      {/* tactile ribs on the PTT bar */}
      {[-0.9, -0.3, 0.3, 0.9].map((dy, i) => (
        <Box key={i} id="host-radio" mat={M.radioDark} size={[0.1, 0.18, 1.1]} position={[R.cx - R.w / 2 - 0.46, 14.6 + dy, 0.2]} />
      ))}
      <Cyl id="host-radio" mat={M.radioRub} r={0.33} h={0.3} axis="x" position={[R.cx - R.w / 2 - 0.1, 12.3, 0.2]} />
      <Cyl id="host-radio" mat={M.radioRub} r={0.28} h={0.3} axis="x" position={[R.cx - R.w / 2 - 0.1, 11.4, 0.2]} />

      {/* ================= BELT CLIP (rear) ================= */}
      <Box id="host-radio" mat={M.darkSteel} size={[2.4, 1.2, 0.4]} position={[R.cx, 17.5, -FZ - 0.2]} />
      <Box id="host-radio" mat={M.darkSteel} size={[1.8, 8.5, 0.15]} position={[R.cx, 13.6, -FZ - 0.46]} />
      {[-0.7, 0.7].map((dx, i) => (
        <Cyl key={i} id="host-radio" mat={M.steel} r={0.16} h={0.06} axis="z" position={[R.cx + dx, 17.5, -FZ - 0.43]} />
      ))}

      <Html position={[R.cx + 1.6, TOP + 5.2, 1.6]} center zIndexRange={[12, 8]}>
        <div
          className="lbl"
          style={{ borderColor: 'rgba(148,163,184,0.45)', borderLeftColor: '#94a3b8', color: '#cbd5e1' }}
        >
          EXISTING RADIO (HOST) · 230 × 75 × 43 mm · NOT PART OF SHIELD-COM
        </div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  RADIO INTERFACE CABLE — SHIELD-COM side socket → radio top port   */
/* ------------------------------------------------------------------ */
export function RadioCable() {
  const y = 0.385
  const z = 0.55
  const [px, , pz] = RADIO_AUDIO_PORT
  return (
    <group>
      {/* --- SHIELD-COM end: 4-pin circular plug engaged in the protected bay --- */}
      <Cyl id="radio-cable" mat={M.silver} r={0.19} h={0.36} axis="x" position={[3.54, y, z]} />
      <Cyl id="radio-cable" mat={M.darkSteel} r={0.28} h={0.25} axis="x" position={[3.725, y, z]} />
      <Cyl id="radio-cable" mat={M.darkPoly} r={0.28} h={0.65} axis="x" position={[4.175, y, z]} />
      <Cyl id="strain-relief" mat={M.rubber} r={0.3} h={0.1} axis="x" position={[4.54, y, z]} />
      <Cyl id="strain-relief" mat={M.rubber} r={0.26} h={0.7} axis="x" position={[4.85, y, z]} />
      <Cyl id="strain-relief" mat={M.rubber} r={0.23} h={0.16} axis="x" position={[5.24, y, z]} />

      {/* --- 300 mm PUR cable, routed up the radio's left flank --- */}
      <Tube
        id="radio-cable"
        mat={M.cable}
        r={0.22}
        seg={96}
        points={[
          [5.3, y, z],
          [5.75, 0.42, 0.6],
          [6.0, 1.3, 0.7],
          [6.0, 5.0, 0.72],
          [6.0, 12.0, 0.72],
          [6.05, 19.0, 0.72],
          [6.3, 23.6, 0.72],
          [7.4, 25.9, 0.74],
          [9.1, 26.2, 0.75],
          [px + 0.1, 25.2, pz],
          [px, TOP + 3.65, pz],
        ]}
      />

      {/* --- radio end: U-229-style 6-pin plug, coupling nut and boot --- */}
      <Cyl id="radio-cable" mat={M.darkSteel} r={0.7} h={0.4} seg={14} position={[px, TOP + 1.4, pz]} />
      <Cyl id="radio-cable" mat={M.darkPoly} r={0.58} h={1.2} position={[px, TOP + 2.15, pz]} />
      <Cyl id="strain-relief" mat={M.rubber} r={0.42} h={0.5} position={[px, TOP + 2.95, pz]} />
      <Cyl id="strain-relief" mat={M.rubber} r={0.32} h={0.75} position={[px, TOP + 3.4, pz]} />
    </group>
  )
}
