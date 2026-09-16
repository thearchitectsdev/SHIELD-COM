# SHIELD-COM — Parts Added & Changed

Date: 2026-09-17 · Envelope unchanged at **72.0 × 50.0 × 26.5 mm** (the teardown, PCB stack, battery and explode animation are untouched)

---

## 0. What SHIELD-COM is

The signal chain is:

```
walkie talkie  →  SHIELD-COM (voice cleaning)  →  walkie talkie
```

So SHIELD-COM is an **inline audio processor**, not a radio. It carries **no RF hardware of its own** — no antenna, no tuning knobs, no channel selector, no belt clip. Everything it does have is either an acoustic part or a control that belongs to its own job.

---

## 1. New parts that stayed (3)

Scale of the model: **1 unit = 10 mm**.

| # | Part ID | Name | Where it sits | Size |
|---|---------|------|---------------|------|
| 1 | `speaker-grille` | Water-Shedding Speaker Grille | Front wall, centred (X 0, Y −5.5) | 31.0 × 7.4 mm, 5 × 1.3 mm slots |
| 2 | `speaker-driver` | Speaker Driver | Inside, behind the grille (Z −19) | Ø 20 × 6.4 mm, 2 W into 8 Ω |
| 3 | `ptt-button` | PTT Pad (side) | −X wall, (Y 0, Z +14) | 13.6 × 8.6 mm, 1.8 mm proud |

**Speaker grille + driver** — five horizontal slots, each capped by a lip so rain and melt-water run off and out instead of pooling in the aperture. Recessed between the grip ribs so it never rests flat on a surface. Behind it, a Ø 20 mm neodymium driver, 6.4 mm deep, bonded to the front wall on a closed-cell gasket with a hydrophobic screen. Lets the operator monitor the cleaned audio without unplugging anything.

**PTT pad** — the most-used control in the field, so it's the largest target on the device: 13.6 × 8.6 mm, standing **1.8 mm proud** of the shell with three raised ridges. Never a bore for a glove to jam into.

---

## 2. Added, then removed again (5)

Built in the same pass, then taken back out once the signal chain was settled — a radio-shaped part has no business on a device that sits between two radios:

| Part ID | Name | Why it went |
|---------|------|-------------|
| `antenna` | Stubby Whip Antenna | SHIELD-COM has no transmitter. RF belongs to the host radios. |
| `channel-knob` | Channel Selector Knob | No channels to select — tuning is the radio's job. |
| `volume-knob` | Volume / Power Knob | Same: level is set on the host radio. |
| `belt-clip` | Spring-Steel Belt Clip | It isn't carried on a belt; it's inline in a cable run. |
| `top-deck` | Raised Control Deck | Existed only to carry the antenna and knobs. Empty without them, so it went too. |

Removed from the assembly, the parts database, the components tree, the callout list, the callout explode vectors and the free-move hierarchy. Verified absent from the live scene graph.

---

## 3. Existing parts fixed (5)

These stand — they were genuine defects, not styling.

| Part | Before | After | Why |
|------|--------|-------|-----|
| **SOS button** | Cap Ø 9.6 mm, top at Y +13.0 mm — sunk **1 mm inside** a bezel bore | Ø 13 mm cap on a 17.2 mm square escutcheon, cap top at Y +16.0 mm | A gloved thumb cannot reach into a bore. The cap now stands 1 mm proud of the escutcheon and 2 mm proud of the lid, with a guard rim above it against accidental presses |
| **MARK button** | Cap Ø 7.8 mm, also sunk, 13 mm from SOS | Ø 10 mm cap on a 14.2 mm escutcheon, proud, **19 mm centre-to-centre** from SOS | Same reason. 19 mm is the MIL-STD-1472 minimum separation for gloved operation, so one thumb can't bridge both |
| **Protective acoustic mesh** | Round disc Ø 6.4 mm in a **7 mm square** hole — all four corners open onto the internals | Square 6.8 × 6.8 mm woven disc with crossed strands, a hydrophobic backing screen and a **square** stainless retaining frame | You spotted this: round mesh in a square hole. Now the mesh is cut to the aperture |
| **Power switch** | 3.4 × 3.0 mm cap rattling in a **9.0 × 5.75 mm** slot | 8.6 × 5.3 mm slider filling the slot + three raised thumb ridges | The old cap left a 5 mm gap straight into the enclosure on every side |
| **LED window** | 4.25 mm deep window in a 5.75 mm deep aperture — 1.5 mm open at the back | Window extended to 5.8 mm, filling the aperture | Same class of leak as the mesh |

Also: the **demo timeline strip** was 880 px wide and covered the components panel — it's now 520 px.

---

## 4. Research basis

- **MIL-STD-1472G/H (human engineering)** — push buttons: minimum 13 mm for bare hands, **19 mm with gloves**; minimum centre separation **19 mm**; controls shall be "compatible with handwear to be utilized in the anticipated environment", and continuous rotary controls are the recommended choice for gloved use. Used for the button diameters, the 19 mm spacing, the proud caps and the raised PTT pad. [MIL-STD-1472G PDF](https://cvgstrategy.com/wp-content/uploads/2023/04/MIL-STD-1472G.pdf) · [MIL-STD-1472H summary](https://www.scribd.com/document/575841625/Mil-Std-1472h)
- **Tait TP9000 / TSM3 speaker mic** — "Tait design **water-shedding grille** and microphone", "**glove-friendly** orange programmable emergency button", IP67/IP68. Source of the slotted-and-lipped grille and the glove-first control philosophy. [Tait accessories](https://www.taitcommunications.com/products/find-your-accessories)
- **Rocky Talkie waterproof hand mic** — "**Compact and glove-friendly** design for cold-weather use", IP67. Corroborates the glove/snow requirement you raised. [Rocky Talkie](https://rockytalkie.com/products/waterproof-hand-mic-mountain-radio)
- **Icom portable radios** — IP67, MIL-STD-810-G, and the **AquaQuake draining function that clears water from the speaker grille**. Confirms water shedding at the grille is a real production feature, not a styling one. [Icom portables](https://www.atlanticradiocorp.com/collections/icom-portable-radios)

---

## 5. How to inspect

- **Components tree** → group **External Hardware** (3 entries, each selectable)
- **Callouts** → SPEAKER GRILLE and PTT PAD are in the leader-line set
- **Exploded view** (`2`) → grille and PTT come straight off their walls, the driver pulls out behind the grille
- **FREE MOVE** → grille, driver and PTT are children of the lower enclosure

Measured from the live scene graph after the removals (world bounding boxes, model group offset −1 mm in Y):

```
speaker-grille   x[-1.62,  1.62]  y[-1.07, -0.23]  z[-2.60, -2.49]
speaker-driver   x[-0.75,  0.75]  y[-1.33,  0.05]  z[-2.12, -1.64]
ptt-button       x[-3.79, -3.58]  y[-0.60,  0.40]  z[ 0.65,  2.15]
sos-button       x[-3.31, -1.59]  y[ 0.34,  1.53]  z[-1.81, -0.09]
mark-button      x[-3.16, -1.74]  y[ 0.34,  1.50]  z[ 0.24,  1.66]
```

Scene totals: **47 parts / 740 meshes**, down from 52 / 777 before the removals.
