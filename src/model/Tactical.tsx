import { M } from '../lib/materials'
import { Box, Cyl } from '../lib/viewer'

/* ================================================================== */
/*  EXTERNAL HARDWARE                                                  */
/*                                                                     */
/*  Fitted to the existing 72 × 50 × 26.5 mm envelope, so the internals, */
/*  the PCB stack and the teardown are untouched:                       */
/*    · water-shedding speaker grille, driver behind it                 */
/*    · side PTT pad, large enough for a gloved thumb                   */
/*                                                                     */
/*  SHIELD-COM is an inline voice-cleaning module that sits between      */
/*  two radios (radio → SHIELD-COM → radio), so it deliberately carries  */
/*  no RF hardware of its own — no antenna, no tuning knobs, no clip.    */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  SPEAKER — water-shedding grille + driver behind it                 */
/* ------------------------------------------------------------------ */
export function SpeakerGrille() {
  const z = -2.53
  return (
    <group>
      {/* recessed panel on the front wall, sitting between the grip ribs */}
      <Box id="speaker-grille" mat={M.shellIn} clip shell size={[3.1, 0.74, 0.06]} position={[0, -0.55, z]} />
      {/* horizontal slots, each shed by a lip above — water runs off and
          out instead of sitting in the aperture */}
      {[-0.83, -0.7, -0.57, -0.44, -0.31].map((y, i) => (
        <group key={i}>
          <Box id="speaker-grille" mat={M.darkSteel} size={[2.86, 0.075, 0.05]} position={[0, y, z - 0.03]} />
          <Box id="speaker-grille" mat={M.steel} size={[2.86, 0.02, 0.1]} position={[0, y + 0.055, z - 0.02]} />
        </group>
      ))}
      {/* stainless surround */}
      <Box id="speaker-grille" mat={M.steel} clip shell size={[3.24, 0.06, 0.08]} position={[0, -0.16, z]} />
      <Box id="speaker-grille" mat={M.steel} clip shell size={[3.24, 0.06, 0.08]} position={[0, -0.94, z]} />
      <Box id="speaker-grille" mat={M.steel} clip shell size={[0.06, 0.84, 0.08]} position={[-1.59, -0.55, z]} />
      <Box id="speaker-grille" mat={M.steel} clip shell size={[0.06, 0.84, 0.08]} position={[1.59, -0.55, z]} />
    </group>
  )
}

export function SpeakerDriver() {
  return (
    <group>
      <Cyl id="speaker-driver" mat={M.darkPoly} r={0.5} h={0.12} axis="z" position={[0, -0.55, -2.04]} />
      <Cyl id="speaker-driver" mat={M.steel} r={0.62} h={0.18} axis="z" position={[0, -0.55, -1.89]} />
      <Cyl id="speaker-driver" mat={M.darkSteel} r={0.34} h={0.16} axis="z" position={[0, -0.55, -1.72]} />
      <Cyl id="speaker-driver" mat={M.darkPoly} r={0.18} h={0.05} axis="z" position={[0, -0.55, -2.09]} />
      {/* mounting flange tying the driver to the front wall */}
      <Box id="speaker-driver" mat={M.frameAlt} size={[1.5, 0.1, 0.14]} position={[0, 0.1, -2.04]} />
      <Box id="speaker-driver" mat={M.frameAlt} size={[1.5, 0.1, 0.14]} position={[0, -1.18, -2.04]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  SIDE PTT                                                           */
/* ------------------------------------------------------------------ */
export function PttButton() {
  return (
    <group>
      {/* boss through the −X wall */}
      <Box id="ptt-button" mat={M.shellIn} clip shell size={[0.1, 1.0, 1.5]} position={[-3.63, 0, 1.4]} />
      {/* pad standing proud: a gloved thumb presses the side, never a bore */}
      <Box id="ptt-button" mat={M.mark} size={[0.14, 0.86, 1.36]} position={[-3.71, 0, 1.4]} />
      {[-0.3, 0, 0.3].map((y, i) => (
        <Box key={i} id="ptt-button" mat={M.markRib} size={[0.03, 0.06, 1.2]} position={[-3.78, y, 1.4]} />
      ))}
    </group>
  )
}

