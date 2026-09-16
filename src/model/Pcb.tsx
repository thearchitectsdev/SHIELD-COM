import type { ReactElement } from 'react'
import { M, type MatSpec } from '../lib/materials'
import { Box, Cyl, Ring, Trace } from '../lib/viewer'
import { useViewer } from '../lib/viewer'
import { useComponentLift } from '../lib/lift'

const PY = 0.44 // top copper surface

/* ------------------------------------------------------------------ */
/*  discrete passive placement                                         */
/* ------------------------------------------------------------------ */
type PS = { p: [number, number]; s: [number, number, number]; m: string }

function grid(
  x0: number,
  z0: number,
  cols: number,
  rows: number,
  dx: number,
  dz: number,
  s: [number, number, number],
  m: string,
): PS[] {
  const out: PS[] = []
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) out.push({ p: [x0 + i * dx, z0 + j * dz], s, m })
  return out
}

const S0402: [number, number, number] = [0.1, 0.04, 0.05]
const S0603: [number, number, number] = [0.16, 0.055, 0.08]
const S0805: [number, number, number] = [0.2, 0.07, 0.125]

const PASSIVES: PS[] = [
  /* decoupling bank right of the ESP32 */
  ...grid(1.72, -0.62, 3, 8, 0.22, 0.21, S0402, 'cap'),
  /* bulk / reservoir caps, right edge */
  ...grid(2.6, -1.62, 2, 3, 0.24, 0.22, S0805, 'tant'),
  ...grid(2.28, -1.82, 3, 2, 0.22, 0.2, S0402, 'res'),
  /* digital fill under / below the module */
  ...grid(-0.55, -1.62, 9, 3, 0.24, 0.2, S0402, 'cap'),
  /* power section fill */
  ...grid(-3.02, 1.34, 2, 3, 0.22, 0.2, S0603, 'res'),
  ...grid(-3.02, 0.82, 2, 2, 0.22, 0.2, S0805, 'cap'),
  /* between inductor and codec */
  ...grid(-2.3, -1.62, 4, 2, 0.22, 0.22, S0603, 'cap'),
  /* above the ADC */
  ...grid(-2.28, 0.72, 4, 2, 0.22, 0.2, S0402, 'res'),
  /* right of the LDO, front-left quadrant */
  ...grid(-1.3, 1.0, 4, 3, 0.22, 0.2, S0402, 'cap'),
  /* below the analogue filter */
  ...grid(-1.5, -1.62, 4, 2, 0.22, 0.2, S0603, 'res'),
  /* top-right fill */
  ...grid(0.32, 1.22, 3, 2, 0.22, 0.2, S0402, 'cap'),
  /* rear-right fill */
  ...grid(2.2, 0.78, 3, 2, 0.22, 0.2, S0402, 'res'),
]

function Passives({ id, list }: { id: string; list: PS[] }) {
  return (
    <group>
      {list.map((q, i) => (
        <Box
          key={i}
          id={id}
          mat={M[q.m] as MatSpec}
          size={q.s}
          position={[q.p[0], PY + q.s[1] / 2, q.p[1]]}
        />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  leaded IC helper                                                   */
/* ------------------------------------------------------------------ */
function Qfn({
  id,
  x,
  z,
  w,
  d,
  h = 0.09,
  leads = true,
}: {
  id: string
  x: number
  z: number
  w: number
  d: number
  h?: number
  leads?: boolean
}) {
  const parts: React.ReactElement[] = []
  if (leads) {
    const n = Math.max(4, Math.round(w / 0.1))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const px = x - w / 2 + t * w
      parts.push(
        <Box key={`a${i}`} id={id} mat={M.gold} size={[w / n - 0.02, 0.035, 0.07]} position={[px, PY + 0.018, z - d / 2 - 0.02]} />,
        <Box key={`b${i}`} id={id} mat={M.gold} size={[w / n - 0.02, 0.035, 0.07]} position={[px, PY + 0.018, z + d / 2 + 0.02]} />,
      )
    }
  }
  return (
    <group>
      <Box id={id} mat={M.ic} size={[w, h, d]} position={[x, PY + h / 2, z]} />
      <Cyl id={id} mat={M.icLid} r={0.03} h={0.012} position={[x - w / 2 + 0.07, PY + h + 0.005, z - d / 2 + 0.07]} />
      {parts}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  MAIN PCB                                                           */
/* ------------------------------------------------------------------ */
export function MainPcb() {
  return (
    <group>
      {/* ---------- substrate ---------- */}
      <Box id="main-pcb" mat={M.pcb} size={[6.05, 0.16, 3.6]} position={[-0.075, 0.36, -0.22]} />
      {/* copper pour edge / board edge relief */}
      <Box id="main-pcb" mat={M.pcbEdge} size={[6.07, 0.012, 3.62]} position={[-0.075, 0.439, -0.22]} />

      {/* ---------- mounting hole annular rings ---------- */}
      {[
        [2.85, -1.85],
        [2.85, 1.35],
        [-2.85, -1.85],
        [-2.85, 1.35],
      ].map(([x, z], i) => (
        <Ring key={i} id="main-pcb" mat={M.gold} rO={0.24} rI={0.14} h={0.02} position={[x, PY + 0.002, z]} />
      ))}

      {/* ---------- copper signal traces ---------- */}
      <Trace pts={[[2.72, 1.1], [2.72, 0.95], [-1.6, 0.95], [-1.6, 0.42]]} />
      <Trace pts={[[-0.9, 1.1], [-0.9, 0.8], [-1.8, 0.8], [-1.8, 0.52]]} />
      <Trace pts={[[-1.65, 0.35], [-1.2, 0.35], [-1.2, -0.3], [-0.5, -0.3]]} />
      <Trace pts={[[-0.5, -0.6], [-1.2, -0.6], [-1.2, -0.85], [-1.65, -0.85]]} />
      <Trace pts={[[-1.65, -0.85], [-1.65, -1.62], [2.75, -1.62], [2.75, -0.02]]} />
      <Trace pts={[[-2.55, 0.96], [-2.55, -0.2], [-2.65, -0.2]]} />
      <Trace pts={[[-2.38, -1.3], [-2.38, -0.3], [-2.65, -0.3]]} />
      <Trace pts={[[-2.67, 0.55], [-2.45, 0.55], [-2.45, -1.62], [1.7, -1.62], [1.7, -0.9], [1.6, -0.9]]} />
      <Trace pts={[[1.94, -1.2], [1.7, -1.2], [1.7, -0.7], [1.6, -0.7]]} />
      <Trace pts={[[1.25, -1.72], [1.25, -1.5], [0.9, -1.5], [0.9, -0.85]]} />
      <Trace pts={[[-2.05, -0.7], [-1.55, -0.7], [-1.55, -0.15], [-0.5, -0.15]]} />
      <Trace pts={[[-2.05, 0.7], [-1.55, 0.7], [-1.55, 0.1], [-0.5, 0.1]]} />
      <Trace pts={[[-1.0, 1.36], [-1.0, -1.72], [-0.5, -1.72], [-0.5, -0.85]]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  ESP32-S3-WROOM-1 — Espressif mechanical datasheet:                 */
/*  25.5 (L) × 18.0 (W) × 3.1 (H) mm, 1.27 mm castellated pitch,      */
/*  PCB antenna at one short end, metal shield can over the rest.      */
/*  Long axis (25.5) runs along Z, antenna toward the +Z keep-out.     */
/* ------------------------------------------------------------------ */
export function Esp32() {
  const { pcbExplode, pcbComponentExplode } = useViewer()
  const lift = pcbExplode ? 1.0 : 0
  const extra = pcbComponentExplode === 'esp32' ? 2.4 : 0
  const yOff = lift + extra
  const x = 0.55
  const zc = -0.2 // module centre → spans z −1.475 … +1.075
  const pads: ReactElement[] = []
  for (let i = 0; i < 17; i++) {
    const pz = zc - 1.02 + i * 0.127 // 1.27 mm pitch, 17 per long edge
    pads.push(
      <Box key={`l${i}`} id="esp32" mat={M.gold} size={[0.05, 0.08, 0.08]} position={[x - 0.9, PY + 0.04, pz]} />,
      <Box key={`r${i}`} id="esp32" mat={M.gold} size={[0.05, 0.08, 0.08]} position={[x + 0.9, PY + 0.04, pz]} />,
    )
  }
  return (
    <group position={[0, yOff, 0]}>
      {/* module PCB — 0.8 mm, full 18 × 25.5 footprint */}
      <Box id="esp32" mat={M.icLid} size={[1.8, 0.08, 2.55]} position={[x, PY + 0.04, zc]} />
      {pads}
      {/* exposed module margin components (in-package flash/PSRAM edge) */}
      <Box id="passives" mat={M.ic} size={[0.14, 0.05, 0.2]} position={[x - 0.72, PY + 0.105, zc - 0.95]} />
      {/* antenna region of the module — bare-board radiator, no copper fill */}
      <Box id="esp32" mat={M.icLid} size={[1.8, 0.015, 0.85]} position={[x, PY + 0.085, zc + 0.85]} />
      {/* PCB antenna keep-out / ground clearance beyond the module edge */}
      <Box id="esp32" mat={M.pcb} size={[2.2, 0.012, 0.3]} position={[x, PY + 0.006, 1.27]} />
    </group>
  )
}

export function Esp32Shield() {
  const lift = useComponentLift('esp32-shield')
  /* shield can per WROOM-1 drawing: covers module except the ~8.5 mm antenna end */
  return (
    <group position={[0, lift, 0]}>
      <Box id="esp32-shield" mat={M.shield} size={[1.76, 0.23, 1.68]} position={[0.55, PY + 0.08 + 0.115, -0.63]} />
      {/* corner weld tabs to module ground */}
      {[
        [-0.82, -1.4],
        [0.82, 0.14],
      ].map(([dx, dz], i) => (
        <Box key={i} id="esp32-shield" mat={M.shield} size={[0.08, 0.24, 0.08]} position={[0.55 + dx, PY + 0.08 + 0.115, -0.63 + dz]} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Audio conversion chain                                             */
/* ------------------------------------------------------------------ */
export function AudioCodec() {
  const lift = Math.max(useComponentLift('audio-adc') ?? 0, useComponentLift('audio-dac') ?? 0)
  return (
    <group position={[0, lift, 0]}>
      {/* Everest Semi ES7210 — 4-ch 24-bit ADC, QFN-20, 4.0 × 4.0 × 0.9 mm */}
      <Qfn id="audio-adc" x={-1.85} z={0.35} w={0.4} d={0.4} />
      {/* Everest Semi ES8311 — low-power mono codec + line/headphone driver, QFN-20, 3.0 × 3.0 × 0.75 mm */}
      <Qfn id="audio-dac" x={-1.85} z={-0.85} w={0.3} d={0.3} />
    </group>
  )
}

export function AnalogFilter() {
  const lift = useComponentLift('analog-filter')
  const parts: PS[] = [
    { p: [-1.25, 0.3], s: [0.35, 0.12, 0.2], m: 'tant' },
    { p: [-1.25, -0.8], s: [0.35, 0.12, 0.2], m: 'tant' },
    { p: [-1.05, 0.12], s: S0603, m: 'res' },
    { p: [-1.05, 0.02], s: S0603, m: 'res' },
    { p: [-1.05, -0.62], s: S0603, m: 'res' },
    { p: [-1.05, -0.96], s: S0603, m: 'res' },
    { p: [-1.25, 0.55], s: S0805, m: 'cap' },
    { p: [-1.25, -1.05], s: S0805, m: 'cap' },
  ]
  return <group position={[0, lift, 0]}><Passives id="analog-filter" list={parts} /></group>
}

/* ------------------------------------------------------------------ */
/*  Power section                                                      */
/* ------------------------------------------------------------------ */
export function PowerSection() {
  const lift = Math.max(useComponentLift('power-mgmt') ?? 0, useComponentLift('inductor') ?? 0, useComponentLift('ldo-reg') ?? 0)
  const leads: ReactElement[] = []
  for (let i = 0; i < 5; i++) {
    leads.push(
      <Box
        key={`a${i}`}
        id="ldo-reg"
        mat={M.silver}
        size={[0.05, 0.03, 0.1]}
        position={[-2.32 + i * 0.11, PY + 0.015, 1.115]}
      />,
      <Box
        key={`b${i}`}
        id="ldo-reg"
        mat={M.silver}
        size={[0.05, 0.03, 0.1]}
        position={[-2.32 + i * 0.11, PY + 0.015, 1.285]}
      />,
    )
  }
  return (
    <group position={[0, lift, 0]}>
      {/* Microchip MCP73871 — USB Li-ion charge manager, QFN-20, 4.0 × 4.0 mm */}
      <Qfn id="power-mgmt" x={-2.85} z={-0.3} w={0.4} d={0.4} />
      {/* TI TPS62260 — 2.25 MHz buck, SOT-23-6, 2.9 × 2.8 × 1.1 mm */}
      <Qfn id="buck-reg" x={-2.85} z={0.55} w={0.29} d={0.28} />
      {/* LDO SOT-23-5 */}
      <Box id="ldo-reg" mat={M.ic} size={[0.3, 0.11, 0.17]} position={[-2.2, PY + 0.055, 1.2]} />
      {leads}
      {/* shielded power inductor */}
      <Box id="inductor" mat={M.ind} size={[0.32, 0.15, 0.32]} position={[-2.85, PY + 0.075, -0.95]} />
      <Box id="inductor" mat={M.darkSteel} size={[0.34, 0.04, 0.34]} position={[-2.85, PY + 0.15, -0.95]} />
      {/* bulk electrolytic / polymer cap */}
      <Cyl id="passives" mat={M.elec} r={0.19} h={0.3} position={[-2.2, PY + 0.15, -1.35]} />
      <Box id="passives" mat={M.silver} size={[0.39, 0.02, 0.39]} position={[-2.2, PY + 0.3, -1.35]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Memory + passives + protection                                     */
/* ------------------------------------------------------------------ */
export function MemoryAndPassives() {
  const liftFlash = useComponentLift('flash')
  const liftCrystal = useComponentLift('crystal')
  const lift = Math.max(liftFlash ?? 0, liftCrystal ?? 0, useComponentLift('passives') ?? 0)
  return (
    <group position={[0, lift, 0]}>
      {/* 16 MB SPI NOR flash, SOIC-8 */}
      <Box id="flash" mat={M.ic} size={[0.52, 0.1, 0.4]} position={[2.2, PY + 0.05, -1.2]} />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={`f${i}`}
          id="flash"
          mat={M.silver}
          size={[0.08, 0.035, 0.1]}
          position={[2.06 + i * 0.1, PY + 0.015, -1.2 - 0.25]}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={`g${i}`}
          id="flash"
          mat={M.silver}
          size={[0.08, 0.035, 0.1]}
          position={[2.06 + i * 0.1, PY + 0.015, -1.2 + 0.25]}
        />
      ))}
      <Cyl id="flash" mat={M.icLid} r={0.04} h={0.012} position={[1.99, PY + 0.106, -1.05]} />

      {/* 12.288 MHz audio-MCLK crystal, Abracon ABM8-class 3.2 × 2.5 × 0.8 mm */}
      <Box id="crystal" mat={M.crystal} size={[0.32, 0.08, 0.25]} position={[0.05, PY + 0.04, 1.35]} />
      <Box id="crystal" mat={M.darkSteel} size={[0.34, 0.015, 0.27]} position={[0.05, PY + 0.085, 1.35]} />

      {/* ESD / TVS array */}
      <Box id="esd-protection" mat={M.ic} size={[0.3, 0.08, 0.17]} position={[2.55, PY + 0.04, 0.55]} />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          id="esd-protection"
          mat={M.silver}
          size={[0.06, 0.03, 0.08]}
          position={[2.44 + i * 0.075, PY + 0.015, 0.55 - 0.12]}
        />
      ))}

      {/* test points */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          id="test-points"
          mat={M.gold}
          size={[0.09, 0.016, 0.09]}
          position={[-0.35 + i * 0.11, PY + 0.008, 1.5]}
        />
      ))}

      <Passives id="passives" list={PASSIVES} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Connectors mounted on the PCB                                      */
/* ------------------------------------------------------------------ */
export function PcbConnectors() {
  const lift = useComponentLift('usb-c') ?? Math.max(useComponentLift('battery-connector') ?? 0, useComponentLift('io-header') ?? 0)
  return (
    <group position={[0, lift, 0]}>
      {/* USB-C service / charge receptacle */}
      <Box id="usb-c" mat={M.darkPoly} size={[0.68, 0.32, 0.89]} position={[-2.72, PY + 0.16, -1.3]} />
      <Box id="usb-c" mat={M.steel} size={[0.06, 0.34, 0.91]} position={[-3.09, PY + 0.16, -1.3]} />
      <Box id="usb-c" mat={M.ic} size={[0.4, 0.08, 0.5]} position={[-2.95, PY + 0.16, -1.3]} />

      {/* battery connector J1 */}
      <Box id="battery-connector" mat={M.cap} size={[0.35, 0.3, 0.55]} position={[-2.55, PY + 0.15, 1.25]} />
      <Box id="battery-connector" mat={M.ic} size={[0.2, 0.16, 0.3]} position={[-2.49, PY + 0.22, 1.25]} />
      {[-0.09, 0.09].map((dz, i) => (
        <Box key={i} id="battery-connector" mat={M.gold} size={[0.16, 0.06, 0.05]} position={[-2.62, PY + 0.2, 1.25 + dz]} />
      ))}

      {/* audio harness header J2 */}
      <Box id="audio-harness" mat={M.darkPoly} size={[0.3, 0.25, 0.6]} position={[2.75, PY + 0.125, -0.3]} />
      {[-0.15, 0.15].map((dz, i) => (
        <Box key={i} id="audio-harness" mat={M.gold} size={[0.08, 0.2, 0.05]} position={[2.75, PY + 0.2, -0.3 + dz]} />
      ))}

      {/* debug / service header */}
      <Box id="io-header" mat={M.darkPoly} size={[0.6, 0.22, 0.3]} position={[1.4, PY + 0.11, 1.35]} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Cyl
          key={i}
          id="io-header"
          mat={M.gold}
          r={0.03}
          h={0.26}
          position={[1.22 + (i % 3) * 0.18, PY + 0.2, 1.28 + Math.floor(i / 3) * 0.14]}
        />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Status LEDs on the PCB                                             */
/* ------------------------------------------------------------------ */
export function StatusLeds() {
  const lift = useComponentLift('status-leds') ?? 0
  const leds: [number, string][] = [
    [0.5, 'ledGreen'],
    [1.0, 'ledBlue'],
    [1.5, 'ledAmber'],
    [2.0, 'ledRed'],
  ]
  return (
    <group position={[0, lift, 0]}>
      {leds.map(([x, m], i) => (
        <group key={i}>
          <Box id="status-leds" mat={M[m] as MatSpec} size={[0.2, 0.06, 0.12]} position={[x, PY + 0.03, -1.8]} />
          <Box id="status-leds" mat={M.gold} size={[0.05, 0.055, 0.12]} position={[x - 0.12, PY + 0.028, -1.8]} />
          <Box id="status-leds" mat={M.gold} size={[0.05, 0.055, 0.12]} position={[x + 0.12, PY + 0.028, -1.8]} />
        </group>
      ))}
    </group>
  )
}
