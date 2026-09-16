import { M } from '../lib/materials'
import { Box, Cyl, Ring, Tube } from '../lib/viewer'
import type { ReactElement } from 'react'

const PY = 0.44

/* ================================================================== */
/*  INTERNAL FRAME + MECHANICS                                         */
/* ================================================================== */
export function InternalFrame() {
  const wallY0 = -1.0
  const wallY1 = 0.28
  const h = wallY1 - wallY0
  const cy = (wallY0 + wallY1) / 2
  const ribs: [number, number, number, number][] = [
    [-2.5, 0, 0.12, 3.0],
    [1.9, 0, 0.12, 3.0],
    [0, -1.5, 4.52, 0.12],
    [0, 1.5, 4.52, 0.12],
  ]
  return (
    <group>
      {/* perimeter walls */}
      <Box id="internal-frame" mat={M.frame} size={[0.12, h, 4.52]} position={[-3.3, cy, 0]} />
      <Box id="internal-frame" mat={M.frame} size={[0.12, h, 4.52]} position={[3.3, cy, 0]} />
      <Box id="internal-frame" mat={M.frame} size={[6.48, h, 0.12]} position={[0, cy, -2.2]} />
      <Box id="internal-frame" mat={M.frame} size={[6.48, h, 0.12]} position={[0, cy, 2.2]} />
      {/* battery locating ribs */}
      {ribs.map(([x, z, sx, sz], i) => (
        <Box
          key={i}
          id="internal-frame"
          mat={M.frameAlt}
          size={[sx, 0.7, sz]}
          position={[x + (sx > 1 ? -0.33 : 0), -0.65, z + (sz > 1 ? 0 : 0)]}
        />
      ))}
      {/* PCB standoff bosses */}
      {[
        [2.85, -1.85],
        [2.85, 1.35],
        [-2.85, -1.85],
        [-2.85, 1.35],
      ].map(([x, z], i) => (
        <Cyl key={i} id="internal-frame" mat={M.frame} r={0.2} h={0.7} position={[x, -0.65, z]} />
      ))}
    </group>
  )
}

export function Standoffs() {
  return (
    <group>
      {[
        [2.85, -1.85],
        [2.85, 1.35],
        [-2.85, -1.85],
        [-2.85, 1.35],
      ].map(([x, z], i) => (
        <Cyl key={i} id="standoffs" mat={M.brass} r={0.18} h={0.58} seg={6} position={[x, -0.01, z]} />
      ))}
    </group>
  )
}

export function Screws() {
  const corners: [number, number][] = [
    [3.15, 2.12],
    [3.15, -2.12],
    [-3.15, 2.12],
    [-3.15, -2.12],
  ]
  const pcb: [number, number][] = [
    [2.85, -1.85],
    [2.85, 1.35],
    [-2.85, -1.85],
    [-2.85, 1.35],
  ]
  return (
    <group>
      {corners.map(([x, z], i) => (
        <group key={i}>
          <Cyl id="screws" mat={M.steel} r={0.1} h={2.19} position={[x, -0.045, z]} />
          <Cyl id="screws" mat={M.steel} r={0.2} h={0.08} position={[x, -1.18, z]} />
        </group>
      ))}
      {pcb.map(([x, z], i) => (
        <group key={`p${i}`}>
          <Cyl id="screws" mat={M.steel} r={0.09} h={0.54} position={[x, 0.17, z]} />
          <Cyl id="screws" mat={M.steel} r={0.17} h={0.07} position={[x, 0.475, z]} />
        </group>
      ))}
    </group>
  )
}

export function ThreadedInserts() {
  const corners: [number, number][] = [
    [3.15, 2.12],
    [3.15, -2.12],
    [-3.15, 2.12],
    [-3.15, -2.12],
  ]
  const pcb: [number, number][] = [
    [2.85, -1.85],
    [2.85, 1.35],
    [-2.85, -1.85],
    [-2.85, 1.35],
  ]
  return (
    <group>
      {corners.map(([x, z], i) => (
        <Ring key={i} id="threaded-inserts" mat={M.brass} rO={0.17} rI={0.1} h={0.2} position={[x, 0.98, z]} />
      ))}
      {pcb.map(([x, z], i) => (
        <Ring key={`p${i}`} id="threaded-inserts" mat={M.brass} rO={0.15} rI={0.095} h={0.18} position={[x, 0.19, z]} />
      ))}
    </group>
  )
}

export function CableManagement() {
  const clips: [number, number][] = [
    [-2.55, 1.88],
    [2.4, 1.9],
  ]
  const out: ReactElement[] = []
  clips.forEach(([x, z], i) => {
    out.push(
      <Box key={`b${i}`} id="cable-management" mat={M.frameAlt} size={[0.32, 0.1, 0.14]} position={[x, -0.05, z]} />,
      <Box key={`l${i}`} id="cable-management" mat={M.frameAlt} size={[0.06, 0.24, 0.14]} position={[x - 0.13, 0.08, z]} />,
      <Box key={`r${i}`} id="cable-management" mat={M.frameAlt} size={[0.06, 0.24, 0.14]} position={[x + 0.13, 0.08, z]} />,
    )
  })
  return <group>{out}</group>
}

/* ================================================================== */
/*  POWER SUBSYSTEM                                                    */
/* ================================================================== */
export function Battery() {
  return (
    <group>
      <Box id="battery" mat={M.batt} size={[4.2, 0.56, 2.8]} position={[-0.3, -0.7, 0]} />
      <Box id="battery" mat={M.battWrap} size={[4.22, 0.06, 2.82]} position={[-0.3, -0.7, 0]} />
      <Box id="battery" mat={M.silver} size={[0.1, 0.3, 1.2]} position={[-2.41, -0.7, 0]} />
      {/* protection module bonded to the cell */}
      <Box id="protection-circuit" mat={M.pcb} size={[0.12, 0.5, 1.6]} position={[-2.52, -0.7, 0]} />
      <Box id="protection-circuit" mat={M.ic} size={[0.14, 0.1, 0.34]} position={[-2.52, -0.55, 0.35]} />
      <Box id="protection-circuit" mat={M.ic} size={[0.14, 0.1, 0.34]} position={[-2.52, -0.55, -0.35]} />
      <Cyl id="protection-circuit" mat={M.tant} r={0.07} h={0.16} position={[-2.52, -0.62, 0]} />
    </group>
  )
}

export function BatteryCable() {
  return (
    <group>
      <Tube
        id="battery-cable"
        mat={M.wireRed}
        r={0.05}
        points={[
          [-2.52, -0.55, 0.42],
          [-2.64, -0.2, 1.28],
          [-2.68, 0.15, 1.86],
          [-2.62, 0.5, 1.82],
          [-2.57, 0.59, 1.55],
        ]}
      />
      <Tube
        id="battery-cable"
        mat={M.wireBlk}
        r={0.05}
        points={[
          [-2.52, -0.62, 0.55],
          [-2.57, -0.22, 1.34],
          [-2.6, 0.15, 1.92],
          [-2.55, 0.5, 1.88],
          [-2.51, 0.59, 1.58],
        ]}
      />
    </group>
  )
}

/* ================================================================== */
/*  AUDIO SYSTEM — microphones + acoustics                             */
/* ================================================================== */
function Mic({ x, z, id }: { x: number; z: number; id: string }) {
  return (
    <group>
      <Box id={id} mat={M.mic} size={[0.35, 0.1, 0.35]} position={[x, PY + 0.05, z]} />
      <Cyl id={id} mat={M.micPort} r={0.06} h={0.02} position={[x, PY + 0.11, z]} />
      <Box id={id} mat={M.gold} size={[0.09, 0.03, 0.09]} position={[x - 0.13, PY + 0.015, z - 0.16]} />
      <Box id={id} mat={M.gold} size={[0.09, 0.03, 0.09]} position={[x + 0.13, PY + 0.015, z - 0.16]} />
      <Box id={id} mat={M.gold} size={[0.09, 0.03, 0.09]} position={[x - 0.13, PY + 0.015, z + 0.16]} />
      <Box id={id} mat={M.gold} size={[0.09, 0.03, 0.09]} position={[x + 0.13, PY + 0.015, z + 0.16]} />
    </group>
  )
}

export function Microphones() {
  return (
    <group>
      <Mic x={2.72} z={1.3} id="mic-voice" />
      <Mic x={-0.9} z={1.3} id="mic-ref" />
    </group>
  )
}

export function AcousticGaskets() {
  return (
    <group>
      <Ring id="acoustic-gasket" mat={M.gasket} rO={0.25} rI={0.09} h={0.12} position={[2.72, 0.54, 1.3]} />
      <Ring id="acoustic-gasket" mat={M.gasket} rO={0.25} rI={0.09} h={0.12} position={[-0.9, 0.54, 1.3]} />
    </group>
  )
}

export function AcousticDucts() {
  return (
    <group>
      <Cyl id="acoustic-duct" mat={M.duct} r={0.19} h={0.52} position={[2.72, 0.92, 1.3]} />
      <Cyl id="acoustic-duct" mat={M.duct} r={0.19} h={0.52} position={[-0.9, 0.92, 1.3]} />
    </group>
  )
}

/* Square woven discs: the lid apertures are square, so a round mesh left the
   corners of the opening exposing the internals. Cut to the aperture instead. */
export function AcousticMesh() {
  return (
    <group>
      {[
        [2.72, 1.3],
        [-0.9, 1.3],
      ].map(([x, z], i) => (
        <group key={i}>
          <Box id="acoustic-mesh" mat={M.meshDisc} size={[0.68, 0.03, 0.68]} position={[x, 1.261, z]} />
          {/* crossed strands read as woven wire over the aperture */}
          {[-0.18, -0.06, 0.06, 0.18].map((o, j) => (
            <Box key={`x${j}`} id="acoustic-mesh" mat={M.meshDisc} size={[0.016, 0.012, 0.68]} position={[x + o, 1.27, z]} />
          ))}
          {[-0.18, -0.06, 0.06, 0.18].map((o, j) => (
            <Box key={`z${j}`} id="acoustic-mesh" mat={M.meshDisc} size={[0.68, 0.012, 0.016]} position={[x, 1.27, z + o]} />
          ))}
          {/* hydrophobic backing screen under the weave */}
          <Box id="acoustic-mesh" mat={M.gasket} size={[0.72, 0.02, 0.72]} position={[x, 1.238, z]} />
        </group>
      ))}
    </group>
  )
}

/* ================================================================== */
/*  CONTROLS                                                           */
/* ================================================================== */
/* Glove-friendly control geometry, per MIL-STD-1472:
   - caps stand proud of the lid instead of sitting sunk in a bore
   - 13 mm SOS cap / 10 mm MARK cap on raised square escutcheons
   - 19 mm centre-to-centre so a gloved thumb cannot bridge both
   - each escutcheon fills its lid aperture, so nothing inside is visible  */
export function SosButton() {
  const x = -2.45
  const z = -0.95
  return (
    <group>
      {/* actuator stack */}
      <Box id="sos-button" mat={M.darkPoly} size={[0.6, 0.25, 0.6]} position={[x, 0.565, z]} />
      <Cyl id="sos-button" mat={M.steel} r={0.1} h={0.06} position={[x, 0.72, z]} />
      <Cyl id="sos-button" mat={M.shellIn} r={0.13} h={0.37} position={[x, 0.935, z]} />
      <Box id="sos-button" mat={M.shellIn} size={[0.32, 0.37, 0.06]} position={[x, 0.935, z]} />
      <Box id="sos-button" mat={M.shellIn} size={[0.06, 0.37, 0.32]} position={[x, 0.935, z]} />
      {/* square escutcheon, 1 mm proud of the lid, sealing the aperture */}
      <Box id="sos-button" mat={M.shellTop} shell clip size={[1.72, 0.1, 1.72]} position={[x, 1.45, z]} />
      {/* guard rim standing above the cap: blocks accidental side presses */}
      <Box id="sos-button" mat={M.sosRing} size={[1.72, 0.12, 0.1]} position={[x, 1.56, z - 0.81]} />
      <Box id="sos-button" mat={M.sosRing} size={[1.72, 0.12, 0.1]} position={[x, 1.56, z + 0.81]} />
      <Box id="sos-button" mat={M.sosRing} size={[0.1, 0.12, 1.62]} position={[x - 0.81, 1.56, z]} />
      <Box id="sos-button" mat={M.sosRing} size={[0.1, 0.12, 1.62]} position={[x + 0.81, 1.56, z]} />
      {/* cap, 13 mm across, standing 1 mm proud of the escutcheon */}
      <Cyl id="sos-button" mat={M.sos} r={0.65} h={0.2} position={[x, 1.5, z]} />
      <Cyl id="sos-button" mat={M.sosDark} r={0.46} h={0.025} position={[x, 1.605, z]} />
      <Ring id="sos-button" mat={M.sosDark} rO={0.65} rI={0.58} h={0.03} position={[x, 1.6, z]} />
    </group>
  )
}

export function MarkButton() {
  const x = -2.45
  const z = 0.95
  return (
    <group>
      <Box id="mark-button" mat={M.darkPoly} size={[0.55, 0.22, 0.55]} position={[x, 0.55, z]} />
      <Cyl id="mark-button" mat={M.steel} r={0.09} h={0.05} position={[x, 0.685, z]} />
      <Cyl id="mark-button" mat={M.shellIn} r={0.11} h={0.43} position={[x, 0.925, z]} />
      <Box id="mark-button" mat={M.shellIn} size={[0.27, 0.43, 0.05]} position={[x, 0.925, z]} />
      <Box id="mark-button" mat={M.shellIn} size={[0.05, 0.43, 0.27]} position={[x, 0.925, z]} />
      {/* square escutcheon sealing the aperture */}
      <Box id="mark-button" mat={M.shellTop} shell clip size={[1.42, 0.1, 1.42]} position={[x, 1.45, z]} />
      <Box id="mark-button" mat={M.sosRing} size={[1.42, 0.1, 0.09]} position={[x, 1.55, z - 0.665]} />
      <Box id="mark-button" mat={M.sosRing} size={[1.42, 0.1, 0.09]} position={[x, 1.55, z + 0.665]} />
      <Box id="mark-button" mat={M.sosRing} size={[0.09, 0.1, 1.33]} position={[x - 0.665, 1.55, z]} />
      <Box id="mark-button" mat={M.sosRing} size={[0.09, 0.1, 1.33]} position={[x + 0.665, 1.55, z]} />
      {/* cap, 10 mm across, proud of the escutcheon */}
      <Cyl id="mark-button" mat={M.mark} r={0.5} h={0.18} position={[x, 1.49, z]} />
      <Box id="mark-button" mat={M.markRib} size={[0.64, 0.03, 0.08]} position={[x, 1.585, z]} />
      <Box id="mark-button" mat={M.markRib} size={[0.08, 0.03, 0.64]} position={[x, 1.585, z]} />
    </group>
  )
}

export function PowerSwitch() {
  return (
    <group>
      <Box id="power-switch" mat={M.darkPoly} size={[0.9, 0.28, 0.5]} position={[-1.0, 0.58, -1.75]} />
      <Box id="power-switch" mat={M.steel} size={[0.5, 0.06, 0.26]} position={[-1.0, 0.75, -1.75]} />
      <Box id="power-switch" mat={M.shellIn} size={[0.2, 0.44, 0.2]} position={[-1.0, 0.94, -1.75]} />
      {/* slider sized to the slot: closes the opening into the enclosure */}
      <Box id="power-switch" mat={M.mark} size={[0.86, 0.16, 0.53]} position={[-1.0, 1.32, -1.7875]} />
      {/* raised ridges so a gloved thumb can find and drive it */}
      <Box id="power-switch" mat={M.markRib} size={[0.62, 0.05, 0.06]} position={[-1.0, 1.425, -1.97]} />
      <Box id="power-switch" mat={M.markRib} size={[0.62, 0.05, 0.06]} position={[-1.0, 1.425, -1.85]} />
      <Box id="power-switch" mat={M.markRib} size={[0.62, 0.05, 0.06]} position={[-1.0, 1.425, -1.73]} />
    </group>
  )
}

export function LightPipes() {
  return (
    <group>
      {[0.5, 1.0, 1.5, 2.0].map((x, i) => (
        <Cyl key={i} id="light-pipes" mat={M.lightPipe} r={0.105} h={0.76} position={[x, 0.88, -1.8]} />
      ))}
      {/* recessed window sits 0.5 mm below the machined bezel frame */}
      <Box id="light-pipes" mat={M.window} size={[1.84, 0.1, 0.58]} position={[1.25, 1.3, -1.7875]} />
      <Box id="light-pipes" mat={M.windowBezel} size={[1.92, 0.05, 0.06]} position={[1.25, 1.39, -2.1]} />
      <Box id="light-pipes" mat={M.windowBezel} size={[1.92, 0.05, 0.06]} position={[1.25, 1.39, -1.625]} />
      <Box id="light-pipes" mat={M.windowBezel} size={[0.06, 0.05, 0.535]} position={[0.32, 1.39, -1.8625]} />
      <Box id="light-pipes" mat={M.windowBezel} size={[0.06, 0.05, 0.535]} position={[2.18, 1.39, -1.8625]} />
    </group>
  )
}

/* ================================================================== */
/*  EXTERNAL INTERFACES (module side)                                  */
/* ================================================================== */
export function AudioConnector() {
  const y = 0.385
  const z = 0.55
  return (
    <group>
      <Cyl id="audio-jack" mat={M.steel} r={0.26} h={0.38} axis="x" position={[3.19, y, z]} />
      <Cyl id="audio-jack" mat={M.darkSteel} r={0.3} h={0.08} seg={6} axis="x" position={[3.29, y, z]} />
      <Cyl id="audio-jack" mat={M.steel} r={0.32} h={0.05} axis="x" position={[3.352, y, z]} />
      <Cyl id="audio-jack" mat={M.darkPoly} r={0.21} h={0.04} axis="x" position={[3.34, y, z]} />
      <Cyl id="audio-jack" mat={M.rubber} r={0.17} h={0.12} axis="x" position={[3.02, y, z]} />
      {[
        [0.1, 0.1],
        [-0.1, 0.1],
        [0.1, -0.1],
        [-0.1, -0.1],
      ].map(([dy, dz], i) => (
        <Cyl key={i} id="audio-jack" mat={M.gold} r={0.035} h={0.12} axis="x" position={[3.3, y + dy, z + dz]} />
      ))}
    </group>
  )
}

export function AudioHarness() {
  return (
    <Tube
      id="audio-harness"
      mat={M.cable}
      r={0.075}
      points={[
        [3.04, 0.385, 0.55],
        [2.9, 0.47, 0.3],
        [2.86, 0.53, 0.0],
        [2.8, 0.57, -0.2],
        [2.75, 0.6, -0.3],
      ]}
    />
  )
}
