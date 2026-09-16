import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 1024, h = 512) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* laser-engraving tone: light grey, restrained opacity */
const INK = 'rgba(190,198,206,0.72)'
const INK_DIM = 'rgba(190,198,206,0.42)'

/* stencil-style product markings printed on the lid */
export function TopMarkings() {
  const plate = useMemo(
    () =>
      makeTex((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        /* frame */
        ctx.strokeStyle = INK_DIM
        ctx.lineWidth = 3
        ctx.strokeRect(10, 10, w - 20, h - 20)
        ctx.strokeRect(22, 22, w - 44, h - 44)
        /* title */
        ctx.fillStyle = INK
        ctx.font = '900 118px "JetBrains Mono", monospace'
        ctx.fillText('SHIELD-COM', 52, 168)
        ctx.font = '700 44px "JetBrains Mono", monospace'
        ctx.fillStyle = INK_DIM
        ctx.fillText('ESP32 VOICE ENHANCEMENT MODULE', 54, 240)
        /* data block */
        ctx.font = '600 36px "JetBrains Mono", monospace'
        ctx.fillStyle = INK_DIM
        ctx.fillText('P/N SC-72-A3   ·   REV C', 54, 330)
        ctx.fillText('NSN 5965-01-682-4417', 54, 388)
        ctx.fillText('DC 3.7V  ⎓  1.2A MAX', 54, 446)
        /* separator */
        ctx.fillRect(52, 268, w - 110, 3)
        /* warning triangle */
        ctx.strokeStyle = INK_DIM
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(w - 130, 440)
        ctx.lineTo(w - 60, 440)
        ctx.lineTo(w - 95, 375)
        ctx.closePath()
        ctx.stroke()
        ctx.font = '900 44px "JetBrains Mono", monospace'
        ctx.fillText('!', w - 104, 430)
      }),
    [],
  )

  const leds = useMemo(
    () =>
      makeTex(
        (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h)
          ctx.textAlign = 'center'
          ctx.fillStyle = INK
          ctx.font = '700 52px "JetBrains Mono", monospace'
          const u = [0.083, 0.361, 0.639, 0.917]
          const names = ['PWR', 'STAT', 'SOS', 'MRK']
          names.forEach((n, i) => ctx.fillText(n, u[i] * w, h * 0.72))
        },
        1024,
        128,
      ),
    [],
  )

  const sos = useMemo(
    () =>
      makeTex(
        (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h)
          ctx.textAlign = 'center'
          ctx.fillStyle = 'rgba(235,190,178,0.85)'
          ctx.font = '900 96px "JetBrains Mono", monospace'
          ctx.fillText('SOS', w / 2, h * 0.68)
        },
        256,
        128,
      ),
    [],
  )

  const mark = useMemo(
    () =>
      makeTex(
        (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h)
          ctx.textAlign = 'center'
          ctx.fillStyle = INK
          ctx.font = '900 74px "JetBrains Mono", monospace'
          ctx.fillText('MARK', w / 2, h * 0.68)
        },
        256,
        128,
      ),
    [],
  )

  useEffect(
    () => () => {
      plate.dispose()
      leds.dispose()
      sos.dispose()
      mark.dispose()
    },
    [plate, leds, sos, mark],
  )

  const flat: [number, number, number] = [-Math.PI / 2, 0, 0]
  return (
    <group raycast={() => null}>
      {/* product marking plate, centre-right of the lid */}
      <mesh rotation={flat} position={[1.05, 1.406, 0.18]} raycast={() => null}>
        <planeGeometry args={[2.5, 1.25]} />
        <meshBasicMaterial map={plate} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {/* LED legend in front of the indicator window */}
      <mesh rotation={flat} position={[1.25, 1.406, -1.6]} raycast={() => null}>
        <planeGeometry args={[1.8, 0.22]} />
        <meshBasicMaterial map={leds} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {/* SOS / MARK bezel captions printed on the lid beside each guard */}
      <mesh rotation={flat} position={[-2.35, 1.406, -1.79]} raycast={() => null}>
        <planeGeometry args={[0.68, 0.3]} />
        <meshBasicMaterial map={sos} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh rotation={flat} position={[-2.35, 1.406, 1.33]} raycast={() => null}>
        <planeGeometry args={[0.6, 0.26]} />
        <meshBasicMaterial map={mark} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}
