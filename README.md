# SHIELD-COM — Inline Voice-Cleaning & Audio Intelligence Module

> An interactive 3D engineering viewer for **SHIELD-COM**, a concept inline audio-intelligence
> module that sits on the accessory audio path of a field radio — cleaning voice, managing
> levels, buffering short clips and tagging events, with **no RF of its own**.

Built with **React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · Three.js (React Three Fiber)**.
The whole site compiles down to a **single self-contained HTML file** via `vite-plugin-singlefile`.

---

## ✦ What this is

This repository is *not* firmware or CAD — it is a **web-based engineering explainer**: a fully
procedural 3D model of the product (enclosure, 4-layer PCB, battery, shields, host radio), wired
to a live device-state store, a scripted field demo, and a WebAudio engine that demonstrates the
*raw radio vs. SHIELD-COM processed* audio path with real voiced tactical transmissions.

Highlights:

- 🧊 **Interactive 3D viewer** — 45 procedural parts, 4 view modes, per-system isolation, part focus, labels & dimensions
- 📻 **Working virtual host radio** — walkie-talkie with LCD menus, VFO/MR, scan, PTT, torch, alarm — all live
- 🎚️ **Audio engine** — squelch bursts, pink-noise RF carrier, crackle pops, roger beeps, and 5 selectable voice transmissions, switchable between *raw* and *processed* feeds
- 🎬 **Scripted field demo** — a 10-step operator scenario driving the *same* store the 3D model reads
- 📊 **Live visualisations** — oscilloscope, spectrum bars, VU meter, raw-vs-clean comparison waves
- 📐 **Engineering content** — system cards, power rails, interfaces, materials, service plan, and an honesty section splitting *measured* vs *design target* vs *planned validation*

---

## 🚀 Quick start

```bash
npm install     # install dependencies
npm run dev     # start the dev server  → http://localhost:5173
```

Production build (emits **one** HTML file with everything inlined):

```bash
npm run build   # → dist/index.html  (fully self-contained, works offline)
npm run preview # serve the production build locally
```

| Script          | What it does                                        |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Vite dev server with HMR on port 5173               |
| `npm run build` | Single-file production build to `dist/index.html`   |
| `npm run preview` | Serves the built file for a final check           |

> **Note:** the audio engine needs a user gesture before it can start (browser autoplay
> policy) — click any transmission chip or the demo deck first.

---

## 🧰 Tech stack

| Layer        | Choice                                                              |
| ------------ | ------------------------------------------------------------------- |
| UI           | React 19, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`)          |
| 3D           | Three.js, `@react-three/fiber` 9, `@react-three/drei` 10            |
| State        | Hand-rolled external stores via `useSyncExternalStore` (no Redux)   |
| Audio        | Raw WebAudio API — procedural noise, filters, speech, tones         |
| Textures     | Procedural `CanvasTexture`s (PCB silkscreen, brushed metal, braid)  |
| Build        | Vite 7 + `vite-plugin-singlefile` → one `.html` artefact            |
| Styling util | `clsx` + `tailwind-merge`                                           |

---

## 🗂️ Project structure

```
shield-com/
├── index.html                  # entry, SEO/meta
├── vite.config.ts              # react + tailwind + singlefile, "@" alias
├── package.json
├── tsconfig.json
└── src/
    ├── main.tsx                # React bootstrap
    ├── App.tsx                 # page assembly (all sections)
    ├── index.css               # Tailwind + graphite/cyan/amber design tokens
    ├── assets/                 # hero-studio.jpg, field-use.jpg
    ├── components/
    │   ├── Viewer.tsx          # 3D canvas, mode toolbar, comms bar, HUD
    │   ├── Demo.tsx            # 2D interactive demo deck (mirrors the 3D)
    │   ├── Sections.tsx        # Nav/Hero/Overview/Architecture/PcbSystems/…
    │   ├── Diagrams.tsx        # SVG diagrams (overview, signal, power)
    │   └── Waveforms.tsx       # canvas scopes, spectrum, VU (audio-reactive)
    ├── three/
    │   ├── ShieldCom.tsx       # the full procedural 3D product model (~72 kB)
    │   ├── pcb.ts              # board geometry, footprints, canvas textures
    │   ├── device.ts           # live device store: radio + SHIELD-COM + LEDs
    │   ├── demo.ts             # 10-step scripted operator scenario
    │   ├── audio.ts            # tactical radio audio engine (WebAudio)
    │   └── state.ts            # viewer context: mode, isolate, selection
    ├── data/
    │   ├── parts.ts            # 45 PartDefs: systems, positions, explode maps
    │   └── content.ts          # cards, tables, claims, field copy
    └── utils/
        └── cn.ts               # clsx + tailwind-merge helper
```

---

## 🧭 Architecture

### High-level application flow

```mermaid
flowchart TB
    subgraph Page["App.tsx — single-page layout"]
        NAV[Nav] --> HERO[Hero]
        HERO --> OV[Overview]
        OV --> VS["Viewer section<br/>(3D)"]
        VS --> DEMO[Demo deck]
        DEMO --> ARCH[Architecture]
        ARCH --> PCB[PcbSystems]
        PCB --> CTRL[Controls]
        CTRL --> ENG[Engineering]
        ENG --> FU[Field Use]
        FU --> FOOT[Footer]
    end

    VS --> V3D["components/Viewer.tsx<br/>R3F Canvas + HUD"]
    DEMO --> DECK["components/Demo.tsx<br/>2D device mirror"]

    subgraph Three["src/three — the live product simulation"]
        STORE[("device.ts<br/>external store")]
        MODEL["ShieldCom.tsx<br/>procedural 3D model"]
        AUDIO["audio.ts<br/>WebAudio engine"]
        SCRIPT["demo.ts<br/>10-step scenario"]
    end

    V3D <--> STORE
    DECK <--> STORE
    SCRIPT --> STORE
    STORE --> MODEL
    STORE --> AUDIO
    MODEL --> V3D
    AUDIO --> WAVES["components/Waveforms.tsx<br/>analyser-driven scopes"]
```

### One store, three faces

The heart of the app is a single hand-rolled store (`three/device.ts`, read with
`useSyncExternalStore`). The **3D model**, the **2D demo deck** and the **scripted demo** all
write to and read from it — press a button anywhere and everything reacts at once.

```mermaid
flowchart LR
    subgraph Writers["State writers"]
        A["3D model picking<br/>(SOS / MARK / keys / knobs)"]
        B["Demo deck<br/>(2D buttons &amp; sliders)"]
        C["Scripted demo<br/>(timed steps)"]
    end

    STORE[("device.ts store<br/>radio · shield-com · LEDs<br/>useSyncExternalStore")]

    subgraph Readers["State readers"]
        D["3D model<br/>LED glow · LCD · cap travel"]
        E["HUD &amp; readouts"]
        F["Audio engine<br/>PTT · beeps · transmissions"]
    end

    A --> STORE
    B --> STORE
    C --> STORE
    STORE --> D
    STORE --> E
    STORE --> F
```

### Viewer modes

```mermaid
stateDiagram-v2
    [*] --> assembled
    assembled --> exploded: Explode
    exploded --> assembled: Reassemble
    assembled --> pcb: PCB detail
    pcb --> assembled: Back
    assembled --> internal: Internal (ghost shell)
    internal --> assembled: Back
    exploded --> internal: Ghost
    internal --> exploded: Solid
    pcb --> pcb: Spread and seat packages

    assembled: assembled — sealed unit
    exploded: exploded — one assembly axis
    pcb: pcb — board + cabling only
    internal: internal — enclosure as ghost
```

State available in every mode (`three/state.ts` → `ViewerCtx`):

```mermaid
flowchart TB
    CTX["ViewerCtx"]
    CTX --> M["mode: assembled | exploded | pcb | internal"]
    CTX --> L["labels: boolean"]
    CTX --> D["dims: boolean"]
    CTX --> S["pcbSpread: boolean"]
    CTX --> C2["showContext: boolean<br/>(host radio visible)"]
    CTX --> I["isolate: SystemId | null<br/>(one of 12 systems)"]
    CTX --> SEL["selected: partId | null"]
    CTX --> HOV["hovered: partId | null"]
```

---

## 🔊 The product's signal chain (as modelled)

What the 3D model and the diagrams teach — the electronics story of the device itself:

```mermaid
flowchart LR
    subgraph Host["Host radio (context)"]
        RADIO["Operator's radio<br/>accessory audio port"]
    end

    subgraph Shield["SHIELD-COM module"]
        P1["TVS + RC filter<br/>protected analogue in"] --> U2["U2 · 24-bit ADC<br/>I2S out"]
        MK["MK1/MK2 · PDM MEMS pair<br/>voice + noise reference (9 mm apart)"] --> U1
        U2 --> U1["U1 · ESP32-S3<br/>voice-cleaning pipeline,<br/>event logic, buffer"]
        U1 --> U3["U3 · 24-bit DAC<br/>+ line driver<br/>(pop/click suppression)"]
        U1 <--> U4["U4 · 16 MB QSPI NOR<br/>firmware · config · MARK clips"]
        USB["USB-C service port<br/>firmware + clip offload"] <--> U1
        SW["SW1/SW2 · SOS + MARK<br/>RC debounce + qualifier"] --> U1
        U1 --> LED["D2–D5 · light pipes<br/>PWR · PRC · SOS · MARK"]
        U3 --> P2["AC-coupled,<br/>series protected out"]
    end

    RADIO --> P1
    P2 --> RADIO
```

### Power tree

```mermaid
flowchart TB
    VBUS["VBUS · 5 V<br/>USB-C in, TVS clamped"] --> U5["U5 · charger / PMIC<br/>dynamic power path"]
    BT1["BT1 · 1S Li-ion pouch<br/>50 × 27 × 5.8 mm"] --> U8["U8 · cell protection<br/>OV / UV / OC / SC"]
    U8 --> U5
    U5 --> U6["U6 + L1 · buck 2.2 MHz<br/>(switching kept above voice band)"]
    U6 --> V33["3V3 · 3.3 V<br/>processor · flash · logic · VLED"]
    U6 --> U7["U7 · low-noise LDO"]
    U7 --> AVDD["AVDD · 3.0 V<br/>ADC · DAC · analogue front end"]
```

---

## 🎧 The app's audio engine

`three/audio.ts` synthesises everything live in WebAudio — there are no audio files.
A transmission is a sequence of scheduled nodes:

```mermaid
flowchart LR
    K["PTT key-up<br/>mic click + squelch burst"] --> V["Voiced sentence<br/>speech + radio band-shape"]
    V --> N["Pink-noise carrier<br/>+ crackle pops + flutter"]
    N --> F{"Feed mode"}
    F -- "Raw radio" --> HF["Heavy static<br/>harsh band-pass"]
    F -- "SHIELD-COM" --> CF["Noise floor suppressed<br/>voice enhanced"]
    HF --> OUT["Speakers + analysers"]
    CF --> OUT
    OUT --> W["WaveScope / SpectrumBars / VuMeter"]
    V --> R["Two-tone roger beep<br/>1050 + 1580 Hz"] --> OUT
```

Available transmissions (`RADIO_SENTENCES`, 5 total) include a SITREP, a rotor-noise filter
check and more — each on its own VHF/UHF channel notice.

---

## 🎬 Scripted field demo

`three/demo.ts` plays a 10-step operator scenario through the same store, framing the camera on
the relevant part at each step:

```mermaid
sequenceDiagram
    participant Op as Demo script
    participant Store as device store
    participant M3 as 3D model
    participant Aud as Audio engine
    participant Hud as HUD/readouts

    Op->>Store: radioPower()
    Store-->>M3: LCD lights, VFO shown
    Op->>Store: PTT + transmitSentence(0)
    Store-->>Aud: squelch burst → voice → roger
    Store-->>M3: TX LED on host radio
    Store-->>Hud: PRC indicator accelerates
    Op->>Store: markPress()
    Store-->>M3: MARK cap travels, amber LED
    Store-->>Hud: clip-journal counter +1
    Op->>Store: sosHold(1200 ms qualify)
    Store-->>M3: SOS cap glow → red LED raised
    Note over Store,Hud: every step visible in 3D, 2D deck and readouts at once
```

---

## 🧱 Data model

Everything the 3D viewer knows about a part comes from `data/parts.ts` — position, assembly
behaviour, labelling and the engineering copy shown on selection:

```mermaid
classDiagram
    class PartDef {
        +string id
        +string ref
        +string name
        +SystemId system
        +string group
        +string pkg
        +string summary
        +[string,string][] specs
        +ModeId[] modes
        +number[3] pos
        +number[3] explode
        +number pcbLift
        +number[3] anchor
        +number[3] labelDir
        +number labelPriority
    }

    class SystemMeta {
        +SystemId id
        +string name
        +string color
        +string short
    }

    class ModeId {
        <<union>>
        assembled
        exploded
        pcb
        internal
    }

    class SystemId {
        <<union>>
        processing · audio-in · audio-out
        power · memory · protection
        controls · indication
        mechanical · acoustic · io · context
    }

    PartDef --> ModeId
    PartDef --> SystemId
    SystemMeta --> SystemId
```

The 12 colour-coded systems:

| System      | Contents (examples)                          | Colour  |
| ----------- | -------------------------------------------- | ------- |
| processing  | U1 ESP32-S3 module                           | cyan    |
| audio-in    | U2 ADC, input protection/filter island       | blue    |
| audio-out   | U3 DAC + line driver                         | olive   |
| power       | BT1 cell, U5–U7, rails                       | amber   |
| memory      | U4 16 MB QSPI NOR                            | purple  |
| protection  | D1 TVS, U8 cell cut-off, EMI cans            | red     |
| controls    | SW1 SOS, SW2 MARK sealed switches            | coral   |
| indication  | D2–D5 LEDs + light pipes                     | green   |
| mechanical  | enclosure, frame, gasket, fasteners          | grey    |
| acoustic    | MEMS pair, ePTFE membrane, ducts             | teal    |
| io          | USB-C, audio harnesses, cell connector       | gold    |
| context     | host radio + cabling                         | slate   |

---

## ⚙️ Engineering content modelled in the viewer

Power rails, interfaces and key components come from `data/content.ts`:

```mermaid
flowchart TB
    subgraph Rails["Power rails"]
        R1["VBUS 5 V"]
        R2["VBAT 3.0–4.2 V"]
        R3["3V3 3.3 V"]
        R4["AVDD 3.0 V"]
        R5["VLED 3.3 V"]
    end
    subgraph Ifaces["External interfaces"]
        I1["Audio in · 4-pin latched"]
        I2["Audio out · 4-pin keyed differently"]
        I3["USB-C 2.0 service port · gasketed"]
        I4["Cell · 2-pin polarised locking"]
        I5["Debug · 6-pin pads (unpopulated)"]
    end
    subgraph Claims["Honesty gating"]
        C1["Measured: none published yet"]
        C2["Design targets: IP67 intent, 2-mic spacing,<br/>switching above voice band, glove force"]
        C3["Planned: intelligibility scoring, IEC 61000-4-2,<br/>ingress/drop/pull-out, cell cycling"]
    end
```

Key components: **U1** ESP32-S3 SoM · **U2** 24-bit ADC (QFN-16) · **U3** DAC + driver
(QFN-20) · **U4** QSPI NOR (SOIC-8) · **U5** charger/PMIC · **U6** 2.2 MHz buck · **U7**
low-noise LDO · **U8** cell protection · **D1** TVS array · **MK1/MK2** PDM MEMS mics ·
**SW1/SW2** sealed tactiles · **BT1** 1S pouch cell.

---

## 🏗️ Build pipeline

```mermaid
flowchart LR
    SRC["src/*.tsx · data · three"] --> VITE["Vite 7 bundle<br/>tsc types via IDE"]
    VITE --> SF["vite-plugin-singlefile"]
    SF --> HTML["dist/index.html<br/>~2.1 MB · js+css+images inlined"]
    HTML --> ANY["Any static host / file:// open<br/>works offline"]

    classDef dim fill:#16181a,stroke:#4a5250,color:#aab2b4;
    class SRC,VITE,SF,HTML,ANY dim;
```

Because the output is one file, deployment is: copy `dist/index.html` anywhere — GitHub Pages,
S3, an email attachment, or double-click it locally.

---

## 📄 Content sections of the page

1. **Hero** — hero-studio render, one-line product thesis
2. **Overview** — the 8-point story (intelligibility first, *inline not instead*, no RF…)
3. **Viewer** — the interactive 3D module with the four modes and comms bar
4. **Demo** — glove-sized 2D deck + scripted scenario runner
5. **Architecture** — signal-chain diagram and system cards (01–08)
6. **PCB systems** — per-subsystem deep dives tied to 3D part IDs
7. **Controls** — SOS long-press + MARK semantics, LED language
8. **Engineering** — components, interfaces, rails, materials, service plan, claims
9. **Field use** — the six field behaviours that shaped the design
10. **Footer** — colophon and disclaimers

---

## ⚠️ Disclaimers

- SHIELD-COM is a **concept/engineering communication piece**; performance figures are labelled
  as *design target* or *planned validation* where no measurements exist — see the claims
  section in-app.
- The host radio, its menus and procedures are a **generic fictional walkie-talkie** built for
  the demo, not a clone of any specific product.
- Audio playback requires a user gesture (browser policy) and WebAudio support.

---

## 📝 License

No license file is included yet. Add one before distributing beyond private use.
