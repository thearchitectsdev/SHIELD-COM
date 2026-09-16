import { M, DIM } from '../lib/materials'
import { Box, Cyl } from '../lib/viewer'

const OX = DIM.ox // 3.6
const OZ = DIM.oz // 2.5
const IX = DIM.innerX // 3.38
const W = DIM.wall // 0.22
const YB = DIM.yBottom // -1.25
const CROWN = DIM.crown // 0.72

/*  Z-bands of the lid ceiling with their remaining-X pieces.
    Holes are: LED window, power switch slot, SOS, MARK, MIC1, MIC2   */
const CEIL: [number, number, [number, number][]][] = [
  [-OZ, -2.075, [[-OX, OX]]],
  /* power-switch slot + LED window band */
  [-2.075, -1.75, [[-OX, -1.45], [-0.55, 0.35], [2.15, OX]]],
  /* same band with the SOS aperture opened on the left */
  [-1.75, -1.5, [[-OX, -3.25], [-1.65, -1.45], [-0.55, 0.35], [2.15, OX]]],
  /* SOS aperture */
  [-1.5, -0.15, [[-OX, -3.25], [-1.65, OX]]],
  /* solid web between the two controls */
  [-0.15, 0.3, [[-OX, OX]]],
  /* MARK aperture */
  [0.3, 0.95, [[-OX, -3.1], [-1.8, OX]]],
  /* MARK + both microphone ports */
  [0.95, 1.6, [[-OX, -3.1], [-1.8, -1.25], [-0.55, 2.37], [3.07, OX]]],
  /* microphone ports only */
  [1.6, 1.65, [[-OX, -1.25], [-0.55, 2.37], [3.07, OX]]],
  [1.65, OZ, [[-OX, OX]]],
]

const CEIL_Y0 = DIM.ceilY0 // 1.18
const CEIL_Y1 = DIM.ceilY1 // 1.40

export function UpperEnclosure() {
  return (
    <group>
      {/* ---- ceiling plate, built around every aperture ---- */}
      {CEIL.map(([z0, z1, xs], i) =>
        xs.map(([x0, x1], j) => (
          <Box
            key={`c${i}-${j}`}
            id="upper-enclosure"
            mat={M.shellTop}
            clip
            shell
            size={[x1 - x0, CEIL_Y1 - CEIL_Y0, z1 - z0]}
            position={[(x0 + x1) / 2, (CEIL_Y0 + CEIL_Y1) / 2, (z0 + z1) / 2]}
          />
        )),
      )}

      {/* ---- side walls ---- */}
      <Box
        id="upper-enclosure"
        mat={M.shellTop}
        clip
        shell
        size={[W, 1.4 - DIM.lidY0, 2 * OZ]}
        position={[-(OX - W / 2), (DIM.lidY0 + 1.4) / 2, 0]}
      />
      <Box
        id="upper-enclosure"
        mat={M.shellTop}
        clip
        shell
        size={[W, 1.4 - DIM.lidY0, 2 * OZ]}
        position={[OX - W / 2, (DIM.lidY0 + 1.4) / 2, 0]}
      />
      <Box
        id="upper-enclosure"
        mat={M.shellTop}
        clip
        shell
        size={[2 * IX, 1.4 - DIM.lidY0, W]}
        position={[0, (DIM.lidY0 + 1.4) / 2, -(OZ - W / 2)]}
      />
      <Box
        id="upper-enclosure"
        mat={M.shellTop}
        clip
        shell
        size={[2 * IX, 1.4 - DIM.lidY0, W]}
        position={[0, (DIM.lidY0 + 1.4) / 2, OZ - W / 2]}
      />

      {/* ---- screw bosses (4) ---- */}
      {[
        [3.15, 2.12],
        [3.15, -2.12],
        [-3.15, 2.12],
        [-3.15, -2.12],
      ].map(([x, z], i) => (
        <Cyl key={i} id="upper-enclosure" mat={M.shellTop} clip shell r={0.24} h={0.34} position={[x, 1.01, z]} />
      ))}

      {/* ---- protective ribs on the top face ---- */}
      {[-2.28, 2.28].map((z, i) => (
        <Box key={i} id="upper-enclosure" mat={M.shellTop} clip shell size={[6.2, 0.07, 0.18]} position={[0, 1.435, z]} />
      ))}

      {/* ---- precision chamfer trim along the top perimeter ---- */}
      <Box id="upper-enclosure" mat={M.shellTrim} clip shell size={[7.2, 0.035, 0.09]} position={[0, 1.4, -2.455]} />
      <Box id="upper-enclosure" mat={M.shellTrim} clip shell size={[7.2, 0.035, 0.09]} position={[0, 1.4, 2.455]} />
      <Box id="upper-enclosure" mat={M.shellTrim} clip shell size={[0.09, 0.035, 5.0]} position={[-3.555, 1.4, 0]} />
      <Box id="upper-enclosure" mat={M.shellTrim} clip shell size={[0.09, 0.035, 5.0]} position={[3.555, 1.4, 0]} />

      {/* ---- fine shadow-gap seam at the split line ---- */}
      <Box id="upper-enclosure" mat={M.seam} clip shell size={[7.21, 0.045, 0.012]} position={[0, 0.855, -2.5]} />
      <Box id="upper-enclosure" mat={M.seam} clip shell size={[7.21, 0.045, 0.012]} position={[0, 0.855, 2.5]} />
      <Box id="upper-enclosure" mat={M.seam} clip shell size={[0.012, 0.045, 5.01]} position={[-3.6, 0.855, 0]} />
      <Box id="upper-enclosure" mat={M.seam} clip shell size={[0.012, 0.045, 5.01]} position={[3.6, 0.855, 0]} />

      {/* ---- square microphone port retaining frames (stainless) ----
           square to match the square apertures, so no corner of the
           opening is left uncovered */}
      {[
        [2.72, 1.3],
        [-0.9, 1.3],
      ].map(([x, z], i) => (
        <group key={i}>
          <Box id="upper-enclosure" mat={M.steel} clip shell size={[0.78, 0.07, 0.09]} position={[x, 1.375, z - 0.355]} />
          <Box id="upper-enclosure" mat={M.steel} clip shell size={[0.78, 0.07, 0.09]} position={[x, 1.375, z + 0.355]} />
          <Box id="upper-enclosure" mat={M.steel} clip shell size={[0.09, 0.07, 0.62]} position={[x - 0.345, 1.375, z]} />
          <Box id="upper-enclosure" mat={M.steel} clip shell size={[0.09, 0.07, 0.62]} position={[x + 0.345, 1.375, z]} />
        </group>
      ))}

    </group>
  )
}

export function LowerEnclosure() {
  const grip: [number, number][] = [
    [-2.4, -1],
    [-1.44, -1],
    [-0.48, -1],
    [0.48, -1],
    [1.44, -1],
    [2.4, -1],
    [-2.4, 1],
    [-1.44, 1],
    [-0.48, 1],
    [0.48, 1],
    [1.44, 1],
    [2.4, 1],
  ]
  return (
    <group>
      {/* ---- floor ---- */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[2 * OX, DIM.floor, 2 * OZ]}
        position={[0, YB + DIM.floor / 2, 0]}
      />

      {/* ---- -X wall with a genuine through-opening for the USB-C bay ----
          (the wall is split around the port so the connector is truly exposed,
          not buried behind an opaque face) */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, CROWN - YB, 0.68]}
        position={[-(OX - W / 2), (YB + CROWN) / 2, -2.16]}
      />
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, CROWN - YB, 3.3]}
        position={[-(OX - W / 2), (YB + CROWN) / 2, 0.85]}
      />
      {/* lintel above the port opening */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, CROWN - 0.44, 1.02]}
        position={[-(OX - W / 2), (0.44 + CROWN) / 2, -1.31]}
      />
      {/* sill below the port opening */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, 0.22, 1.02]}
        position={[-(OX - W / 2), YB + 0.11, -1.31]}
      />

      {/* ---- +X wall with protected audio connector bay ---- */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, 1.3, 2 * OZ]}
        position={[OX - W / 2, YB + 0.65, 0]}
      />
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, 0.67, 2.4]}
        position={[OX - W / 2, 0.385, -1.3]}
      />
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[W, 0.67, 1.3]}
        position={[OX - W / 2, 0.385, 1.85]}
      />

      {/* ---- front / rear walls ---- */}
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[2 * IX, CROWN - YB, W]}
        position={[0, (YB + CROWN) / 2, -(OZ - W / 2)]}
      />
      <Box
        id="lower-enclosure"
        mat={M.shell}
        clip
        shell
        size={[2 * IX, CROWN - YB, W]}
        position={[0, (YB + CROWN) / 2, OZ - W / 2]}
      />

      {/* ---- grip ribs ---- */}
      {grip.map(([x, s], i) => (
        <Box
          key={i}
          id="lower-enclosure"
          mat={M.bumper}
          clip
          shell
          size={[0.16, 1.55, 0.12]}
          position={[x, -0.225, s * 2.56]}
        />
      ))}

      {/* ---- TPE corner impact bumpers ---- */}
      {[
        [3.58, 2.48],
        [3.58, -2.48],
        [-3.58, 2.48],
        [-3.58, -2.48],
      ].map(([x, z], i) => (
        <Cyl key={i} id="lower-enclosure" mat={M.bumper} clip shell r={0.26} h={2.0} position={[x, -0.28, z]} />
      ))}

      {/* ---- M3 bracket threaded inserts (visible in the floor) ---- */}
      {[-0.95, 0.95].map((dx, i) => (
        <Cyl key={i} id="lower-enclosure" mat={M.brass} clip shell r={0.2} h={0.2} position={[0.2 + dx, -1.1, 0]} />
      ))}
    </group>
  )
}

export function Gasket() {
  const y = (DIM.gasketY0 + DIM.gasketY1) / 2
  const h = DIM.gasketY1 - DIM.gasketY0
  const seg: [number, number, number, number][] = [
    // [cx, cz, sx, sz]
    [-3.49, 0, 0.16, 4.78],
    [3.49, 0, 0.16, 4.78],
    [0, -2.39, 6.82, 0.16],
    [0, 2.39, 6.82, 0.16],
  ]
  return (
    <group>
      {seg.map(([cx, cz, sx, sz], i) => (
        <Box key={i} id="gasket" mat={M.gasket} clip shell size={[sx, h, sz]} position={[cx, y, cz]} />
      ))}
      {[
        [3.49, 2.39],
        [3.49, -2.39],
        [-3.49, 2.39],
        [-3.49, -2.39],
      ].map(([x, z], i) => (
        <Box key={`k${i}`} id="gasket" mat={M.gasket} clip shell size={[0.16, h, 0.16]} position={[x, y, z]} />
      ))}
    </group>
  )
}
