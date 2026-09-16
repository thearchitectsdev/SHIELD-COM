# SHIELD-COM viewer — change log

## 1 · Service colour scheme (armed-forces palette)
`src/index.css`

The Tailwind colour ramps are **remapped at the theme level**, so every panel,
chip, button, callout, slider and toast in the app follows the new palette with
no per-component edits:

| ramp | now | used for |
|---|---|---|
| `sky-*` | **brass / coyote** `#cba86a → #241c0e` | primary HUD accent, active states, borders |
| `slate-*` | **gunmetal / field grey** (olive cast) `#f3f5ee → #0a0c08` | all neutrals, panels, text |
| `emerald/cyan` | olive-drab signal green | function / DSP chips |
| `red` | subdued service red | destructive actions |

Also in `src/index.css`: olive-gunmetal `body` (`#090c0a`), brass hairlines and
machined **rivets** on every panel, brushed-metal panel gradient, brass range
sliders, olive-tinted grid + hatch, brass title shimmer, and a new `.grain`
film-grain layer (inline SVG, works offline).

`src/App.tsx` — studio backdrop rebuilt: olive/charcoal gradients with a brass
key glow, plus a soft vignette and grain overlay behind the canvas.
`src/Scene.tsx` — olive-tinted three-point rig, gunmetal deck `#0e120c`,
brass section plane, callouts, reticle and signal-flow packets; deeper vignette,
slightly lower exposure for a moodier, more premium render.

## 2 · FREE MOVE rebuilt (easy, forgiving movement)
`src/model/FreeMoveGizmo.tsx`, `src/lib/dragmove.ts`, `src/lib/viewer.tsx`

* **Grab the part itself** — press `M` (FREE MOVE) and just drag any component;
  it slides in the screen plane. No gizmo aiming required.
* **Real drag maths** — axis drags project the pointer onto the world axis
  (closest-point-on-line), plane/screen drags use a true ray→plane intersection.
  Movement now matches the cursor at any zoom level, from any camera angle.
* **Handles that are easy to hit** — fat invisible grab volumes (arms ~1.3 units,
  0.17 r), drawn with `depthTest: false` so they are never hidden inside the
  enclosure, and the whole gizmo **scales with camera distance**.
* **Gizmo always wins** — handles are hit-tested as an overlay, so geometry in
  front can never steal a drag aimed at an arrow or pad.
* **Callouts no longer swallow drags** — engineering labels switch to
  `pointer-events: none` while FREE MOVE is on.
* 3 axis arrows · 3 plane pads · centre hub · hover highlight · `grab`/`grabbing` cursors.
* **Keyboard nudge** — ← → ↑ ↓ slide in the screen plane, `PgUp/PgDn` on Y,
  `Backspace` resets the selected part. `Shift` = fine (0.2×), `Alt` = snap to 0.1.
* **Live XYZ readout** + part name + *"+ N attached parts move with it"*.
* **RESET THIS PART** on the gizmo and **RESET MOVES (n)** in the toolbar
  (the toolbar button is always reachable — the floating one can sit under a side panel).

## 3 · Moving the PCB carries its components
`src/lib/viewer.tsx`

New mechanical parent → child map (`PART_PARENT`) plus `resolveOffset()`, so an
offset applied to a parent is inherited by everything mounted to it:

* `main-pcb` → ESP32 (+ its shield can), audio ADC/DAC, analogue filter, power
  section (+ buck, LDO, inductor), flash, crystal, passives, ESD, test points,
  USB-C, battery + I/O headers, status LEDs, harness, both MEMS mics
* `internal-frame` → main PCB, standoffs, screws, inserts, cable management, battery
* `upper-enclosure` → light pipes, SOS / MARK / power switch, acoustic mesh, duct, gasket
* `lower-enclosure` → audio jack, mounting bracket, perimeter gasket
* `esp32` → shield can · `power-mgmt` → regulators · `battery` → protection circuit + cable
* `radio-cable` → strain relief

Verified in-browser: dragging the board moves ESP32, shield can and ADC by
**exactly** the same delta, while the frame and shells stay put.

## 4 · PCB DETAIL now explodes the board
`src/lib/viewer.tsx`

Entering **PCB DETAIL** (key `4`) lifts the board out of the enclosure and then
(≈0.4 s later, once it has settled) raises every package by its real height:
ESP32 **+2.5**, shield can **+3.55**, audio codec **+1.85**, board **+0.1**.
The EXPLODE PCB button reflects the state (`STACK ON`), and it stays manual —
you can still collapse the stack by hand.
