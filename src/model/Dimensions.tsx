import { Html, Line } from '@react-three/drei'
import { useViewer } from '../lib/viewer'
import { RADIO, RADIO_TOP } from './Radio'

type V = [number, number, number]
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]

/* CAD-style dimension: main line, end ticks, label */
function Dim({ a, b, t, label, lo = 2.4 }: { a: V; b: V; t: V; label: string; lo?: number }) {
  const pts: V[] = [a, b, add(a, t, -0.5), add(a, t, 0.5), add(b, t, -0.5), add(b, t, 0.5)]
  const mid: V = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  return (
    <group>
      <Line points={pts} segments color="#f5c542" lineWidth={1.25} transparent opacity={0.92} />
      <Html position={add(mid, t, lo)} center zIndexRange={[14, 6]}>
        <div className="dimlbl">{label}</div>
      </Html>
    </group>
  )
}

/* 100 mm floor scale bar with 10 mm ticks */
function ScaleBar() {
  const x0 = -3.6
  const z = 4.9
  const y = -2.4
  const pts: V[] = [[x0, y, z], [x0 + 10, y, z]]
  for (let i = 0; i <= 10; i++) pts.push([x0 + i, y, z], [x0 + i, y, z + (i % 5 === 0 ? 0.55 : 0.3)])
  return (
    <group>
      <Line points={pts} segments color="#cbd5e1" lineWidth={1.4} transparent opacity={0.9} />
      {[0, 5, 10].map((i) => (
        <Html key={i} position={[x0 + i, y, z + 1.15]} center zIndexRange={[14, 6]}>
          <div className="dimlbl neutral">{i === 0 ? '0' : `${i} cm`}</div>
        </Html>
      ))}
      <Html position={[x0 + 5, y, z + 2.0]} center zIndexRange={[14, 6]}>
        <div className="dimlbl neutral">TRUE SCALE · 1 UNIT = 10 mm</div>
      </Html>
    </group>
  )
}

export function Dimensions() {
  const { dims } = useViewer()
  if (!dims) return null
  const R = RADIO
  const T = RADIO_TOP
  return (
    <group>
      {/* ---- SHIELD-COM ---- */}
      <Dim a={[-3.6, -1.5, 3.4]} b={[3.6, -1.5, 3.4]} t={[0, 0, 0.3]} label="72 mm" />
      <Dim a={[4.6, -1.5, -2.5]} b={[4.6, -1.5, 2.5]} t={[0.3, 0, 0]} label="50 mm" />
      <Dim a={[-4.6, -1.35, 2.6]} b={[-4.6, 1.3, 2.6]} t={[0.3, 0, 0]} label="26.5 mm" />

      {/* ---- HOST RADIO ---- */}
      <Dim a={[R.cx + 4.7, R.y0, 2.3]} b={[R.cx + 4.7, R.y0 + 23, 2.3]} t={[0.35, 0, 0]} label="230 mm" />
      <Dim a={[R.cx - 3.75, T + 1.9, 2.5]} b={[R.cx + 3.75, T + 1.9, 2.5]} t={[0, 0.35, 0]} label="75 mm" />
      <Dim a={[R.cx + 4.7, R.y0 + 0.9, -2.15]} b={[R.cx + 4.7, R.y0 + 0.9, 2.15]} t={[0.35, 0, 0]} label="43 mm" lo={3.4} />
      <Dim
        a={[R.cx - 3.9, T + 0.9, -0.85]}
        b={[R.cx - 3.9, T + R.ant, -0.85]}
        t={[0.35, 0, 0]}
        label="≈ 350 mm whip"
        lo={-3.6}
      />

      <ScaleBar />
    </group>
  )
}
