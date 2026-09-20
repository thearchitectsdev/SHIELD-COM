import { FOOT_BY_ID } from "@/three/pcb";

export type ModeId = "assembled" | "exploded" | "pcb" | "internal";

export type SystemId =
  | "processing"
  | "audio-in"
  | "audio-out"
  | "power"
  | "memory"
  | "protection"
  | "controls"
  | "indication"
  | "mechanical"
  | "acoustic"
  | "io"
  | "context";

export interface SystemMeta {
  id: SystemId;
  name: string;
  color: string;
  short: string;
}

export const SYSTEMS: SystemMeta[] = [
  { id: "processing", name: "Processing", color: "#4fd1e0", short: "DSP / control" },
  { id: "audio-in", name: "Audio Input", color: "#63b3ed", short: "Analogue capture" },
  { id: "audio-out", name: "Audio Output", color: "#8fa268", short: "Analogue drive" },
  { id: "power", name: "Power", color: "#f0a93b", short: "Cell / rails" },
  { id: "memory", name: "Memory", color: "#c084fc", short: "NV storage" },
  { id: "protection", name: "Protection", color: "#d8453c", short: "ESD / fault" },
  { id: "controls", name: "Controls", color: "#ff6b5e", short: "SOS / MARK" },
  { id: "indication", name: "Status", color: "#7ee787", short: "4 × LED" },
  { id: "mechanical", name: "Mechanical", color: "#98a09e", short: "Enclosure" },
  { id: "acoustic", name: "Acoustic", color: "#5eead4", short: "MEMS / ducts" },
  { id: "io", name: "Interfaces", color: "#e8c46a", short: "Connectors" },
  { id: "context", name: "Context", color: "#6b7574", short: "Host radio" },
];

export const SYSTEM_COLOR: Record<SystemId, string> = SYSTEMS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.color }),
  {} as Record<SystemId, string>,
);

export interface PartDef {
  id: string;
  ref: string;
  name: string;
  system: SystemId;
  group: string;
  pkg?: string;
  summary: string;
  specs: [string, string][];
  modes: ModeId[];
  /** base position in world/scene units (1 unit = 10 mm) */
  pos: [number, number, number];
  /** offset applied in EXPLODED mode */
  explode: [number, number, number];
  /** offset applied in PCB-DETAIL inspection mode */
  pcbLift?: number;
  /** label anchor, relative to part origin */
  anchor?: [number, number, number];
  /** direction the callout leader is drawn */
  labelDir?: [number, number, number];
  labelPriority?: number;
}

const ALL: ModeId[] = ["assembled", "exploded", "pcb", "internal"];
const INNER: ModeId[] = ["exploded", "internal"];
const PCB_MODES: ModeId[] = ["exploded", "pcb", "internal"];

export const PARTS: PartDef[] = [
  /* ───────────────────────── MECHANICAL ───────────────────────── */
  {
    id: "upper-enclosure",
    ref: "MEC-01",
    name: "Upper Enclosure",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Machined 6061-T6 / GF-PA hybrid",
    summary:
      "Load-bearing lid carrying the guarded SOS and MARK controls, the four-LED window and the acoustic inlets. Bead-blasted graphite finish, no through-holes other than sealed control and acoustic interfaces.",
    specs: [
      ["Material", "6061-T6 shell, 30% GF-PA insert"],
      ["Finish", "Type II hardcoat, graphite"],
      ["Wall", "2.2 mm nominal"],
      ["Interfaces", "Gasket land, 4 × M2 inserts"],
      ["Openings", "2 × acoustic, 4 × LED pipe"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, 4.3, 0],
    anchor: [-2.6, 0.95, 0.9],
    labelDir: [-1, 0.9, 0.3],
    labelPriority: 9,
  },
  {
    id: "lower-enclosure",
    ref: "MEC-02",
    name: "Lower Enclosure",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Machined tray, gasket land",
    summary:
      "Sealed lower tray with cable-exit bosses at both ends, integral standoff bosses and two low-profile mounting lugs. Carries all fastener load through threaded inserts.",
    specs: [
      ["Material", "6061-T6, hardcoat"],
      ["Sealing", "Continuous gasket land, 1.2 mm"],
      ["Cable exits", "2 × Ø6.5 mm bosses"],
      ["Mounting", "2 × low-profile lugs"],
      ["Target rating", "IP67 design intent"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, -2.9, 0],
    anchor: [-2.4, -0.7, -1.6],
    labelDir: [-1, -0.7, -0.4],
    labelPriority: 8,
  },
  {
    id: "gasket",
    ref: "MEC-03",
    name: "Perimeter Sealing Gasket",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Compression O-profile",
    summary:
      "Single continuous silicone gasket seated in the lower tray land. Compression is set by the enclosure step, not by fastener torque, so the seal is repeatable after service.",
    specs: [
      ["Material", "Silicone 50 Sh A"],
      ["Section", "1.5 mm O-profile"],
      ["Compression", "22 – 28 %"],
      ["Cycles", "50 service cycles design target"],
    ],
    modes: INNER,
    pos: [0, 0.6, 0],
    explode: [0, 3.15, 0],
    anchor: [2.9, 0, 1.6],
    labelDir: [1, 0.4, 0.6],
    labelPriority: 5,
  },
  {
    id: "frame",
    ref: "MEC-04",
    name: "Internal Chassis Frame",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Die-cast ZA / Al frame",
    summary:
      "Rigid frame that carries the PCB, isolates the cell from board flex and provides the thermal and ground path between the board ground stitch and the enclosure.",
    specs: [
      ["Function", "PCB carrier + ground bond"],
      ["Bond", "4 × ground stitch to inserts"],
      ["Cell", "Retains pouch cell, no pressure"],
      ["Cable mgmt", "2 × harness channels"],
    ],
    modes: INNER,
    pos: [0, 0.1, 0],
    explode: [0, 2.2, 0],
    anchor: [-3.2, 0.1, 1.3],
    labelDir: [-1, 0.5, 0.5],
    labelPriority: 4,
  },
  {
    id: "fasteners",
    ref: "MEC-05",
    name: "Fasteners & Threaded Inserts",
    system: "mechanical",
    group: "Mechanical",
    pkg: "M2 × 8 torx, heat-set inserts",
    summary:
      "Six captive M2 torx fasteners into brass heat-set inserts. Fasteners are accessed from the underside only; no exterior fastener sits inside a sealing path.",
    specs: [
      ["Count", "6 × M2 × 8 T6 torx"],
      ["Inserts", "Brass heat-set, 4.0 mm"],
      ["Torque", "0.25 N·m target"],
      ["Access", "Top, bonded sealing washer"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, 5.6, 0],
    anchor: [2.95, -0.95, 1.5],
    labelDir: [1, -0.8, 0.4],
    labelPriority: 3,
  },
  {
    id: "standoffs",
    ref: "MEC-06",
    name: "PCB Standoffs",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Ø3.6 mm alloy standoff",
    summary:
      "Four standoffs set the board plane above the cell bay and carry the board ground to the frame. They also define the acoustic duct height at the microphone end.",
    specs: [
      ["Height", "8.0 mm"],
      ["Count", "4"],
      ["Function", "Board plane + ground"],
    ],
    modes: INNER,
    pos: [0, 0, 0],
    explode: [0, 0.25, 0],
    anchor: [2.95, -0.4, -1.5],
    labelDir: [1, -0.4, -0.6],
    labelPriority: 1,
  },
  {
    id: "control-guards",
    ref: "MEC-07",
    name: "Protective Control Bezels",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Raised guard frame / ring",
    summary:
      "Raised guard geometry stands proud of both control caps so a dropped or dragged module cannot actuate them. Both guards are open enough for a gloved fingertip.",
    specs: [
      ["SOS guard", "Rect. frame, +1.4 mm over cap"],
      ["MARK guard", "Ring, +1.0 mm over cap"],
      ["Glove clearance", "18 mm entry, design target"],
      ["Function", "Anti-snag, anti-actuation"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, 5.2, 0],
    anchor: [-0.95, 1.14, -1.05],
    labelDir: [-0.4, 1, -1],
    labelPriority: 6,
  },
  {
    id: "strain-relief",
    ref: "MEC-08",
    name: "Cable Strain Relief",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Over-moulded TPE boot",
    summary:
      "Over-moulded boots at both cable exits. The bend radius is controlled by the boot, the seal by a compressed bushing, and the pull-out load by an internal cable anchor on the frame.",
    specs: [
      ["Material", "TPE 60 Sh A over-mould"],
      ["Bend radius", "≥ 8 × cable Ø"],
      ["Pull-out", "80 N design target"],
      ["Seal", "Compressed bushing at boss"],
    ],
    modes: ALL,
    pos: [0, 0, 0],
    explode: [0, 0, 0],
    anchor: [-4.15, 0, 0],
    labelDir: [-1, 0.6, 0],
    labelPriority: 2,
  },

  {
    id: "usb-plug",
    ref: "MEC-09",
    name: "USB-C Sealing Plug",
    system: "mechanical",
    group: "Mechanical",
    pkg: "Tethered TPE plug, captive",
    summary:
      "Captive elastomer plug that seals the service port when no cable is fitted. The tether anchors to the tray so the plug cannot be lost in the field; shown unseated so the port remains visible.",
    specs: [
      ["Material", "TPE 55 Sh A"],
      ["Retention", "Tethered to tray anchor"],
      ["Seal", "Double-lip, interference fit"],
      ["State", "Modelled open — port visible"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, -3.2, -1.2],
    anchor: [-1.55, -0.3, -2.4],
    labelDir: [-0.6, -0.5, -1],
    labelPriority: 3,
  },

  /* ───────────────────────── CONTROLS ───────────────────────── */
  {
    id: "sos-control",
    ref: "CTL-01",
    name: "SOS Emergency Control",
    system: "controls",
    group: "Controls",
    pkg: "Sealed cap over 12 mm tactile switch",
    summary:
      "Large raised emergency control. A deliberate long press raises an emergency event in the control system and drives the SOS status indication. Guarded against accidental actuation.",
    specs: [
      ["Cap", "15 × 12 mm, high-visibility red"],
      ["Actuation", "Long press, deliberate"],
      ["Switch", "12 mm sealed tactile, IP67"],
      ["Force", "3.5 N target, glove-rated"],
      ["Event", "Raises SOS event + indication"],
      ["Guard", "Raised frame, +1.4 mm"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [-0.95, 0.94, -1.05],
    explode: [0, 5.9, 0],
    anchor: [0, 0.2, 0],
    labelDir: [-0.9, 1.1, -0.9],
    labelPriority: 10,
  },
  {
    id: "mark-control",
    ref: "CTL-02",
    name: "MARK Event Control",
    system: "controls",
    group: "Controls",
    pkg: "Sealed round cap over 6 mm tactile switch",
    summary:
      "Smaller round control with a ridged crown, tactilely distinct from SOS. A short press tags the current transmission and freezes the pre/post event audio buffer into flash.",
    specs: [
      ["Cap", "Ø8.4 mm ridged crown"],
      ["Actuation", "Short press"],
      ["Switch", "6 mm sealed tactile"],
      ["Force", "2.2 N target"],
      ["Event", "Tags clip, writes buffer"],
      ["Guard", "Raised ring, +1.0 mm"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0.75, 0.92, -1.15],
    explode: [0, 5.9, 0],
    anchor: [0, 0.2, 0],
    labelDir: [0.6, 1.1, -0.9],
    labelPriority: 10,
  },
  {
    id: "sw1",
    ref: "SW1",
    name: "SOS Tactile Switch",
    system: "controls",
    group: "PCB — Controls",
    pkg: "12 × 12 mm sealed tactile, THT",
    summary:
      "Sealed through-hole tactile switch under the SOS cap. Debounced in firmware; a hardware RC network suppresses contact bounce before the GPIO edge.",
    specs: [
      ["Package", "12 × 12 mm THT, sealed"],
      ["Travel", "0.5 mm"],
      ["Life", "200 k cycles rated"],
      ["Interface", "GPIO + RC debounce"],
      ["Logic", "Long-press qualified in FW"],
    ],
    modes: PCB_MODES,
    pos: [-1.25, 0.29, -1.05],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.16, 0],
    labelDir: [-0.9, 0.9, -0.7],
    labelPriority: 7,
  },
  {
    id: "sw2",
    ref: "SW2",
    name: "MARK Tactile Switch",
    system: "controls",
    group: "PCB — Controls",
    pkg: "6 × 6 mm sealed tactile, SMD",
    summary:
      "Sealed SMD tactile switch under the MARK cap, on the same debounce and event path as SW1 but with a short-press qualifier.",
    specs: [
      ["Package", "6 × 6 mm SMD, sealed"],
      ["Travel", "0.25 mm"],
      ["Interface", "GPIO + RC debounce"],
      ["Logic", "Short press → MARK event"],
    ],
    modes: PCB_MODES,
    pos: [0.5, 0.26, -1.15],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.14, 0],
    labelDir: [0.9, 0.9, -0.7],
    labelPriority: 7,
  },

  /* ───────────────────────── INDICATION / ACOUSTIC ───────────────────────── */
  {
    id: "led-pipes",
    ref: "IND-01",
    name: "Status Light Pipes ×4",
    system: "indication",
    group: "Status & Acoustics",
    pkg: "Sealed PMMA light pipe array",
    summary:
      "Four sealed light pipes carry the board LEDs to the lid: POWER, PROCESS, SOS and MARK. They are recessed below the lid surface and are not user-actuable.",
    specs: [
      ["Pipes", "4 × Ø2.4 mm PMMA"],
      ["Mapping", "PWR · PROC · SOS · MARK"],
      ["Seal", "Interference fit + O-ring"],
      ["Finish", "Matte diffuser tip"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, 5.0, 0],
    anchor: [1.8, 0.95, -1.55],
    labelDir: [0.6, 1.0, -1],
    labelPriority: 9,
  },
  {
    id: "leds",
    ref: "D2–D5",
    name: "Status LEDs",
    system: "indication",
    group: "PCB — Status",
    pkg: "0603 side-view / top-view LED",
    summary:
      "Four board LEDs driven directly by the controller. Green = power / charge, cyan = processing active, red = SOS state, amber = MARK event stored.",
    specs: [
      ["Package", "4 × 0603"],
      ["Drive", "GPIO + series limit, PWM dim"],
      ["Colours", "Green · Cyan · Red · Amber"],
      ["Night mode", "Low-duty dim, design target"],
    ],
    modes: PCB_MODES,
    pos: [0, 0.19, 0],
    explode: [0, 0.8, 0],
    pcbLift: 1.0,
    anchor: [1.72, 0.06, -1.45],
    labelDir: [0.5, 0.9, -0.9],
    labelPriority: 6,
  },
  {
    id: "acoustic-inlet",
    ref: "ACO-01",
    name: "Acoustic Inlets & Mesh",
    system: "acoustic",
    group: "Status & Acoustics",
    pkg: "PTFE mesh + ducted inlet",
    summary:
      "Two subtle ducted inlets over the MEMS pair. A hydrophobic PTFE membrane blocks water and dust while passing voice band energy; the duct and gasket set the acoustic response.",
    specs: [
      ["Inlets", "2 × Ø2.0 mm ducted"],
      ["Membrane", "Hydrophobic PTFE, ePTFE weld"],
      ["Duct", "Sealed to mic gasket"],
      ["Intent", "IP67 while acoustically open"],
    ],
    modes: ["assembled", "exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, 5.0, 0],
    anchor: [2.75, 0.95, 0.6],
    labelDir: [0.8, 1.0, 0.7],
    labelPriority: 7,
  },
  {
    id: "mk1",
    ref: "MK1",
    name: "MEMS Voice Microphone",
    system: "acoustic",
    group: "PCB — Acoustics",
    pkg: "Bottom-port MEMS, 3.5 × 2.65 mm",
    summary:
      "Primary voice microphone on the PDM bus. Ducted to the forward acoustic inlet and isolated from the enclosure by a compressed acoustic gasket.",
    specs: [
      ["Package", "MEMS, 3.5 × 2.65 × 1.0 mm"],
      ["Output", "PDM digital"],
      ["SNR", "64 dB(A) class device"],
      ["Mount", "Ducted + acoustic gasket"],
    ],
    modes: PCB_MODES,
    pos: [2.7, 0.22, 1.2],
    explode: [0, 0.8, 0],
    pcbLift: 1.3,
    anchor: [0, 0.12, 0],
    labelDir: [0.9, 0.8, 0.5],
    labelPriority: 6,
  },
  {
    id: "mk2",
    ref: "MK2",
    name: "MEMS Noise-Reference Mic",
    system: "acoustic",
    group: "PCB — Acoustics",
    pkg: "Bottom-port MEMS, 3.5 × 2.65 mm",
    summary:
      "Second microphone on the same PDM clock, spaced 9 mm from MK1. It supplies the noise reference used by the two-mic suppression stage.",
    specs: [
      ["Spacing", "9.0 mm from MK1"],
      ["Output", "PDM, shared clock"],
      ["Role", "Noise reference / coherence"],
      ["Matching", "±1 dB pair, design target"],
    ],
    modes: PCB_MODES,
    pos: [2.7, 0.22, 0.3],
    explode: [0, 0.8, 0],
    pcbLift: 1.3,
    anchor: [0, 0.12, 0],
    labelDir: [0.9, 0.8, -0.4],
    labelPriority: 5,
  },

  /* ───────────────────────── PCB CORE ───────────────────────── */
  {
    id: "pcb",
    ref: "PCB-01",
    name: "Main PCB — 4 Layer",
    system: "processing",
    group: "PCB — Board",
    pkg: "66 × 34 mm, 1.6 mm FR-4",
    summary:
      "Four-layer controlled-stack board. Signal / GND / PWR / signal, with a continuous ground reference under the digital audio bus and a split analogue island under the front end.",
    specs: [
      ["Outline", "66 × 34 mm, 1.6 mm"],
      ["Stack", "L1 SIG · L2 GND · L3 PWR · L4 SIG"],
      ["Copper", "1 oz outer, 0.5 oz inner"],
      ["Finish", "ENIG, gold flash on pads"],
      ["Mask", "Matte dark green, white silk"],
      ["Mounting", "4 × Ø2.2 mm plated"],
    ],
    modes: PCB_MODES,
    pos: [0, 0.08, 0],
    explode: [0, 0.8, 0],
    anchor: [-3.0, 0, 1.55],
    labelDir: [-1, 0.5, 0.6],
    labelPriority: 10,
  },
  {
    id: "u1",
    ref: "U1",
    name: "ESP32-S3 Module",
    system: "processing",
    group: "PCB — Processing",
    pkg: "Shielded SoM, 25.5 × 18 × 3.1 mm",
    summary:
      "Main embedded processor. Runs the voice-cleaning pipeline, event logic for SOS and MARK, LED status logic, the MARK ring buffer and USB service. Used for processing and connectivity inside the module — it is not an independent radio.",
    specs: [
      ["Core", "Dual-core LX7, 240 MHz"],
      ["Memory", "512 kB SRAM + PSRAM"],
      ["Audio bus", "I²S / TDM + PDM"],
      ["Shield", "Full RF can over module"],
      ["Roles", "DSP · events · LEDs · USB"],
      ["Boot", "Service mode over USB-C"],
    ],
    modes: PCB_MODES,
    pos: [-0.65, 0.32, 0.72],
    explode: [0, 0.8, 0],
    pcbLift: 1.7,
    anchor: [0, 0.2, 0],
    labelDir: [-0.7, 1.1, 0.5],
    labelPriority: 10,
  },
  {
    id: "u2",
    ref: "U2",
    name: "Audio ADC",
    system: "audio-in",
    group: "PCB — Audio",
    pkg: "QFN-16, 3 × 3 mm",
    summary:
      "Input conversion stage. Converts the protected analogue line/mic input from the host radio path to digital audio for the processor. Sits inside the analogue front-end shield, on its own LDO rail.",
    specs: [
      ["Package", "QFN-16, 3 × 3 mm"],
      ["Resolution", "24-bit, 16/48 kHz"],
      ["Input", "Differential, AC-coupled"],
      ["Filter", "RC anti-alias + common-mode"],
      ["Rail", "AVDD from low-noise LDO"],
      ["Bus", "I²S to U1"],
    ],
    modes: PCB_MODES,
    pos: [-2.45, 0.205, -0.45],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.1, 0],
    labelDir: [-0.9, 0.9, -0.6],
    labelPriority: 9,
  },
  {
    id: "u3",
    ref: "U3",
    name: "Audio DAC / Output Stage",
    system: "audio-out",
    group: "PCB — Audio",
    pkg: "QFN-20, 3.5 × 3.5 mm",
    summary:
      "Converts the processed voice back to analogue and drives the output toward the host radio or accessory interface. Integrated line driver with pop/click suppression on enable and mute.",
    specs: [
      ["Package", "QFN-20, 3.5 × 3.5 mm"],
      ["Resolution", "24-bit mono DAC + driver"],
      ["Output", "AC-coupled, series-protected"],
      ["Pop/click", "Ramped enable, soft mute"],
      ["Rail", "Analogue LDO rail"],
      ["Bus", "I²S from U1"],
    ],
    modes: PCB_MODES,
    pos: [1.6, 0.205, -0.75],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.1, 0],
    labelDir: [0.8, 0.9, -0.7],
    labelPriority: 9,
  },
  {
    id: "u4",
    ref: "U4",
    name: "NOR Flash Memory",
    system: "memory",
    group: "PCB — Memory",
    pkg: "SOIC-8, quad SPI",
    summary:
      "Non-volatile storage for firmware, configuration, calibration and MARK event clips. The MARK buffer is committed here so a tagged clip survives power loss.",
    specs: [
      ["Package", "SOIC-8 208 mil"],
      ["Density", "16 MB (128 Mbit)"],
      ["Bus", "Quad SPI, 80 MHz"],
      ["Holds", "FW · config · cal · MARK clips"],
      ["Wear", "Journaled clip region"],
    ],
    modes: PCB_MODES,
    pos: [1.25, 0.21, 1.3],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.1, 0],
    labelDir: [0.7, 0.9, 0.7],
    labelPriority: 8,
  },
  {
    id: "y1",
    ref: "Y1",
    name: "Reference Crystal",
    system: "processing",
    group: "PCB — Processing",
    pkg: "3.2 × 2.5 mm SMD",
    summary: "Low-drift reference for the RTC and audio clock domain, keeping event timestamps coherent across power cycles.",
    specs: [
      ["Package", "3.2 × 2.5 mm SMD"],
      ["Stability", "±20 ppm"],
      ["Use", "RTC + timestamping"],
    ],
    modes: PCB_MODES,
    pos: [1.25, 0.2, 0.75],
    explode: [0, 0.8, 0],
    pcbLift: 0.85,
    anchor: [0, 0.08, 0],
    labelDir: [0.6, 0.8, 0.3],
    labelPriority: 2,
  },

  /* ───────────────────────── POWER ───────────────────────── */
  {
    id: "u5",
    ref: "U5",
    name: "Charger / Power Management",
    system: "power",
    group: "PCB — Power",
    pkg: "QFN-20, 4 × 4 mm",
    summary:
      "Single-cell Li-ion charger and power path. Arbitrates between USB-C input and the cell, reports charge state to the processor and keeps the audio chain alive during source changeover.",
    specs: [
      ["Package", "QFN-20, 4 × 4 mm"],
      ["Charge", "Up to 1 A, thermally folded"],
      ["Path", "Dynamic power-path, USB or cell"],
      ["Telemetry", "I²C state + fault to U1"],
      ["Input", "5 V USB-C, current-limited"],
    ],
    modes: PCB_MODES,
    pos: [-2.95, 0.205, 0.45],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.1, 0],
    labelDir: [-0.9, 0.9, 0.5],
    labelPriority: 8,
  },
  {
    id: "u6",
    ref: "U6",
    name: "Buck Regulator",
    system: "power",
    group: "PCB — Power",
    pkg: "QFN-8, 2 × 2 mm",
    summary:
      "Synchronous buck producing the main digital rail from the cell. Switching edge and frequency are chosen to keep the fundamental and its harmonics out of the voice band.",
    specs: [
      ["Package", "QFN-8, 2 × 2 mm"],
      ["Output", "3.3 V digital rail"],
      ["Frequency", "2.2 MHz, out of audio band"],
      ["Mode", "Forced PWM during capture"],
      ["Loop", "Compensated, low ripple target"],
    ],
    modes: PCB_MODES,
    pos: [-2.9, 0.2, 1.05],
    explode: [0, 0.8, 0],
    pcbLift: 1.15,
    anchor: [0, 0.08, 0],
    labelDir: [-0.9, 0.9, 0.7],
    labelPriority: 6,
  },
  {
    id: "l1",
    ref: "L1",
    name: "Power Inductor",
    system: "power",
    group: "PCB — Power",
    pkg: "Shielded 4 × 4 mm, 2.2 µH",
    summary: "Shielded composite inductor for the buck stage, placed to keep the switching loop area minimal and away from the analogue island.",
    specs: [
      ["Value", "2.2 µH shielded"],
      ["Isat", "2.4 A"],
      ["Placement", "Tight loop with U6, far from U2"],
    ],
    modes: PCB_MODES,
    pos: [-2.45, 0.235, 1.15],
    explode: [0, 0.8, 0],
    pcbLift: 1.0,
    anchor: [0, 0.12, 0],
    labelDir: [-0.5, 0.8, 0.9],
    labelPriority: 4,
  },
  {
    id: "u7",
    ref: "U7",
    name: "Low-Noise Analogue LDO",
    system: "power",
    group: "PCB — Power",
    pkg: "SOT-23-5",
    summary:
      "Quiet post-regulator for the codec analogue rails. It is fed from the digital rail through a ferrite and feeds only the analogue island, so switching noise never shares a return with audio.",
    specs: [
      ["Package", "SOT-23-5"],
      ["Output", "3.0 V AVDD"],
      ["Noise", "< 20 µVrms class device"],
      ["PSRR", "High at buck fundamental"],
      ["Island", "Separate analogue return"],
    ],
    modes: PCB_MODES,
    pos: [-1.9, 0.215, -0.6],
    explode: [0, 0.8, 0],
    pcbLift: 1.0,
    anchor: [0, 0.1, 0],
    labelDir: [-0.2, 0.9, -1],
    labelPriority: 6,
  },
  {
    id: "u8",
    ref: "U8",
    name: "Cell Protection Circuit",
    system: "protection",
    group: "PCB — Power",
    pkg: "DFN + dual N-MOSFET",
    summary:
      "Secondary protection for the single-cell pack: over-voltage, under-voltage, over-current and short-circuit cut-off, independent of the charger IC.",
    specs: [
      ["Protects", "OV · UV · OC · SC"],
      ["Switch", "Back-to-back N-MOSFET"],
      ["Redundancy", "Independent of U5"],
      ["Reset", "Auto on source removal"],
    ],
    modes: PCB_MODES,
    pos: [-2.4, 0.2, 0.0],
    explode: [0, 0.8, 0],
    pcbLift: 1.0,
    anchor: [0, 0.08, 0],
    labelDir: [-1, 0.8, -0.2],
    labelPriority: 5,
  },
  {
    id: "insulator",
    ref: "INS-01",
    name: "Cell Insulator Sheet",
    system: "mechanical",
    group: "Power Pack",
    pkg: "0.18 mm polyimide / PET laminate",
    summary:
      "Die-cut insulator between the board underside and the cell. It blocks any chance of a via or lead touching the pouch and carries the cut-outs for the harness route and the standoff bosses.",
    specs: [
      ["Material", "PET / polyimide laminate"],
      ["Thickness", "0.18 mm"],
      ["Cut-outs", "Harness route + 4 standoffs"],
      ["Function", "Cell / board isolation"],
    ],
    modes: ["exploded", "internal"],
    pos: [-0.2, -0.16, 0],
    explode: [0, -2.55, 0],
    anchor: [2.2, 0, 1.2],
    labelDir: [0.9, -0.5, 0.7],
    labelPriority: 3,
  },
  {
    id: "battery",
    ref: "BT1",
    name: "Li-ion Cell Pack",
    system: "power",
    group: "Power Pack",
    pkg: "Single-cell pouch, 50 × 27 × 5.8 mm",
    summary:
      "Single-cell Li-ion pouch with integrated pack protection, seated in the lower tray below the board. It is a real serviceable assembly with a connectorised harness — not a soldered-in cell.",
    specs: [
      ["Chemistry", "Li-ion, 1 S"],
      ["Size", "50 × 27 × 5.8 mm"],
      ["Nominal", "3.7 V"],
      ["Protection", "Pack PCM + board-side U8"],
      ["Harness", "2-pin locking, polarised"],
      ["Service", "Replaceable, no soldering"],
    ],
    modes: ["exploded", "internal"],
    pos: [-0.2, -0.49, 0],
    explode: [0, -1.6, 0],
    anchor: [0, 0.3, 0],
    labelDir: [-0.6, -0.9, 0.8],
    labelPriority: 9,
  },
  {
    id: "battery-cable",
    ref: "W1",
    name: "Cell Harness",
    system: "power",
    group: "Power Pack",
    pkg: "26 AWG twisted pair",
    summary: "Twisted, routed and retained in the frame channel so the harness cannot chafe against the board edge or lie across the analogue island.",
    specs: [
      ["Gauge", "26 AWG twisted"],
      ["Connector", "2-pin locking"],
      ["Routing", "Frame channel, retained"],
    ],
    modes: ["exploded", "internal"],
    pos: [0, 0, 0],
    explode: [0, -1.6, 0],
    anchor: [-2.9, -0.3, -0.4],
    labelDir: [-1, -0.6, -0.5],
    labelPriority: 1,
  },

  /* ───────────────────────── I/O & PROTECTION ───────────────────────── */
  {
    id: "j1",
    ref: "J1",
    name: "USB-C Service Port",
    system: "io",
    group: "PCB — Interfaces",
    pkg: "USB-C 16-pin, mid-mount",
    summary:
      "Charging, firmware service and MARK clip offload. Mid-mount receptacle with a reinforcement bracket and four board anchors; the opening is gasketed at the enclosure wall.",
    specs: [
      ["Package", "USB-C 2.0, 16-pin"],
      ["Mount", "Mid-mount + reinforcement"],
      ["Roles", "Charge · service · offload"],
      ["Protection", "ESD array + series"],
      ["Seal", "Gasketed port collar"],
    ],
    modes: PCB_MODES,
    pos: [-2.6, 0.12, -1.5],
    explode: [0, 0.8, 0],
    pcbLift: 0.8,
    anchor: [0, 0.18, 0],
    labelDir: [-0.7, 0.9, -0.9],
    labelPriority: 9,
  },
  {
    id: "d1",
    ref: "D1",
    name: "ESD / Transient Protection",
    system: "protection",
    group: "PCB — Protection",
    pkg: "SOT-563 TVS array",
    summary:
      "Low-capacitance TVS array on the USB-C data and VBUS lines, with a second protection group on both audio interfaces so field cabling transients never reach the codecs.",
    specs: [
      ["USB", "Low-C TVS on D+/D−/CC/VBUS"],
      ["Audio", "TVS + series R on both ports"],
      ["Target", "IEC 61000-4-2 ±8 kV contact"],
      ["Note", "Design target — validation planned"],
    ],
    modes: PCB_MODES,
    pos: [-2.15, 0.19, -1.15],
    explode: [0, 0.8, 0],
    pcbLift: 0.9,
    anchor: [0, 0.08, 0],
    labelDir: [-0.9, 0.8, -0.9],
    labelPriority: 6,
  },
  {
    id: "j2",
    ref: "J2",
    name: "Battery Connector",
    system: "io",
    group: "PCB — Interfaces",
    pkg: "2-pin locking, 2.0 mm pitch",
    summary: "Polarised, locking cell connector. Keyed so the pack cannot be reversed during service.",
    specs: [
      ["Pins", "2, 2.0 mm pitch"],
      ["Feature", "Polarised + latched"],
      ["Rating", "3 A continuous"],
    ],
    modes: PCB_MODES,
    pos: [-3.0, 0.3, 0.05],
    explode: [0, 0.8, 0],
    pcbLift: 0.8,
    anchor: [0, 0.16, 0],
    labelDir: [-1, 0.8, 0],
    labelPriority: 4,
  },
  {
    id: "j3",
    ref: "J3",
    name: "Radio Audio Input Connector",
    system: "io",
    group: "PCB — Interfaces",
    pkg: "4-pin board-to-wire, latched",
    summary:
      "Terminates the cable from the host radio: audio in, audio return, shield and sense. The shield lands on chassis ground, not on the analogue return.",
    specs: [
      ["Pins", "4 + shield tab"],
      ["Signals", "AIN · AGND · SHLD · SENSE"],
      ["Latch", "Positive latch, keyed"],
      ["Bonding", "Shield to chassis, single point"],
    ],
    modes: PCB_MODES,
    pos: [-3.05, 0.32, -0.7],
    explode: [0, 0.8, 0],
    pcbLift: 0.8,
    anchor: [0, 0.18, 0],
    labelDir: [-1, 0.8, -0.5],
    labelPriority: 7,
  },
  {
    id: "j4",
    ref: "J4",
    name: "Audio Output Connector",
    system: "io",
    group: "PCB — Interfaces",
    pkg: "4-pin board-to-wire, latched",
    summary:
      "Drives the processed voice back into the host radio audio interface or accessory path, with series protection and a separated return.",
    specs: [
      ["Pins", "4 + shield tab"],
      ["Signals", "AOUT · AGND · SHLD · SENSE"],
      ["Protection", "Series R + TVS"],
      ["Latch", "Positive latch, keyed"],
    ],
    modes: PCB_MODES,
    pos: [3.05, 0.32, -0.9],
    explode: [0, 0.8, 0],
    pcbLift: 0.8,
    anchor: [0, 0.18, 0],
    labelDir: [1, 0.8, -0.5],
    labelPriority: 7,
  },
  {
    id: "j5",
    ref: "J5",
    name: "Service / Debug Header",
    system: "io",
    group: "PCB — Interfaces",
    pkg: "6-pin 1.27 mm, unpopulated",
    summary: "Factory and depot header: UART console, boot strap and programming. Unpopulated pads in the field build so nothing can be probed casually.",
    specs: [
      ["Pins", "6 × 1.27 mm"],
      ["Signals", "TX · RX · BOOT · RST · 3V3 · GND"],
      ["Field build", "Pads only, unpopulated"],
    ],
    modes: PCB_MODES,
    pos: [1.95, 0.28, 1.4],
    explode: [0, 0.8, 0],
    pcbLift: 0.8,
    anchor: [0, 0.14, 0],
    labelDir: [0.8, 0.8, 0.8],
    labelPriority: 3,
  },
  {
    id: "testpoints",
    ref: "TP1–TP8",
    name: "Test Points",
    system: "protection",
    group: "PCB — Protection",
    pkg: "ENIG pads + 2 × loop",
    summary: "Gold test pads on every rail plus the audio input and output nodes, so a board can be characterised without unsoldering anything.",
    specs: [
      ["Count", "8 pads, 2 loops"],
      ["Coverage", "VBAT · 3V3 · AVDD · AIN · AOUT"],
      ["Finish", "ENIG, probe-friendly"],
    ],
    modes: PCB_MODES,
    pos: [0, 0.17, 0],
    explode: [0, 0.8, 0],
    pcbLift: 0.5,
    anchor: [0.3, 0.06, -1.55],
    labelDir: [0.2, 0.8, -1],
    labelPriority: 2,
  },
  {
    id: "shield-in",
    ref: "SH1",
    name: "Analogue Front-End Shield",
    system: "protection",
    group: "PCB — Protection",
    pkg: "Tinplate can, clipped",
    summary: "Removable can over the analogue input island. It closes the loop between the input filter and the ADC and keeps the buck node out of the front end.",
    specs: [
      ["Type", "Two-piece clip-on can"],
      ["Covers", "U2 · U7 · input filter"],
      ["Service", "Removable without rework"],
    ],
    modes: PCB_MODES,
    pos: [-2.3, 0.29, -0.55],
    explode: [0, 1.8, 0],
    pcbLift: 2.1,
    anchor: [0, 0.16, 0],
    labelDir: [-0.8, 1, -0.8],
    labelPriority: 5,
  },
  {
    id: "shield-out",
    ref: "SH2",
    name: "Output Stage Shield",
    system: "protection",
    group: "PCB — Protection",
    pkg: "Tinplate can, clipped",
    summary: "Can over the DAC and line-driver island, protecting the output node from radiated pickup where the cable leaves the enclosure.",
    specs: [
      ["Type", "Two-piece clip-on can"],
      ["Covers", "U3 · driver · output filter"],
      ["Bond", "Stitched to L2 ground"],
    ],
    modes: PCB_MODES,
    pos: [1.9, 0.29, -0.7],
    explode: [0, 1.8, 0],
    pcbLift: 2.1,
    anchor: [0, 0.16, 0],
    labelDir: [0.8, 1, -0.8],
    labelPriority: 5,
  },
  {
    id: "passives",
    ref: "R/C/FB",
    name: "Passive Network",
    system: "processing",
    group: "PCB — Board",
    pkg: "0402 / 0603 / ferrite beads",
    summary:
      "Decoupling, anti-alias filtering, bulk storage, ferrite isolation between the digital and analogue rails, and the RC debounce network for both controls.",
    specs: [
      ["Sizes", "0402 / 0603 / 0805 bulk"],
      ["Decoupling", "Per-rail, per-pin at U1–U3"],
      ["Filtering", "RC anti-alias + CM chokes"],
      ["Isolation", "Ferrite between 3V3 / AVDD"],
    ],
    modes: PCB_MODES,
    pos: [0, 0.18, 0],
    explode: [0, 0.8, 0],
    pcbLift: 0.6,
    anchor: [0, 0.06, 0],
    labelDir: [0, 1, 0],
    labelPriority: 0,
  },

  /* ───────────────────────── CABLES / CONTEXT ───────────────────────── */
  {
    id: "cable-in",
    ref: "IO-05",
    name: "Radio Interface Cable",
    system: "io",
    group: "Cabling",
    pkg: "Braided, shielded 4-conductor",
    summary:
      "Shielded cable from the host radio audio accessory interface into SHIELD-COM. Braided abrasion jacket, controlled bend at the boot, shield bonded at the module end only.",
    specs: [
      ["Build", "4-conductor + braid shield"],
      ["Jacket", "Braided aramid over TPU"],
      ["Length", "300 mm standard"],
      ["Bonding", "Single-point shield bond"],
    ],
    modes: ALL,
    pos: [0, 0, 0],
    explode: [0, 0, 0],
    anchor: [-6.0, 0.4, -0.6],
    labelDir: [-0.8, 0.9, -0.5],
    labelPriority: 8,
  },
  {
    id: "cable-out",
    ref: "IO-06",
    name: "Accessory Output Cable",
    system: "io",
    group: "Cabling",
    pkg: "Braided, shielded 4-conductor",
    summary:
      "Returns cleaned voice to the host radio audio interface or on to the operator's accessory. Identical build to the input cable, keyed differently at the module.",
    specs: [
      ["Build", "4-conductor + braid shield"],
      ["Keying", "Distinct from input cable"],
      ["Length", "300 mm standard"],
    ],
    modes: ALL,
    pos: [0, 0, 0],
    explode: [0, 0, 0],
    anchor: [5.8, 0.4, -0.5],
    labelDir: [0.9, 0.9, -0.4],
    labelPriority: 8,
  },
  {
    id: "host-radio",
    ref: "CTX-01",
    name: "Host Field Radio",
    system: "context",
    group: "Context",
    pkg: "Not supplied — context only",
    summary:
      "The operator's existing radio. SHIELD-COM sits inline on its audio accessory path and never touches the RF chain: no transmitter, no receiver, no antenna, no channel control.",
    specs: [
      ["Model context", "Handheld dual-band walkie-talkie (e.g. UV-82)"],
      ["Relationship", "Host radio → SHIELD-COM → host/accessory"],
      ["Interface", "Kenwood 2-pin audio accessory port"],
      ["RF chain", "Remains entirely with the radio (no module antenna)"],
      ["Supplied", "No — operator's existing radio"],
    ],
    modes: ["assembled", "pcb", "internal"],
    pos: [0, 0, 0],
    explode: [0, 0, 0],
    anchor: [-11.2, 9.9, 2.2],
    labelDir: [0.5, 0.7, 0.4],
    labelPriority: 7,
  },
];

/* ------------------------------------------------------------------ *
 * Derived geometry — single source of truth
 *
 * 1. Every PCB-mounted part takes its X/Z from the collision-checked
 *    footprint table and its Y from the board plane + package height,
 *    so the data panel and the 3D model can never drift apart.
 * 2. Every part takes its EXPLODED offset from one controlled assembly
 *    ladder, so the exploded view reads bottom-to-top in service order
 *    and always returns to exactly the same seated position.
 * ------------------------------------------------------------------ */
const BOARD_TOP = 0.16;

/** exploded ladder, in assembly order (negative = below the board); a vector keeps a part with its carrier */
const LADDER: Record<string, number | [number, number, number]> = {
  "lower-enclosure": -3.2,
  "cable-in": -3.2,
  "cable-out": -3.2,
  "strain-relief": -3.2,
  "usb-plug": [0, -3.2, -1.2],
  insulator: -2.55,
  battery: -1.95,
  "battery-cable": -1.95,
  frame: -1.35,
  standoffs: -0.75,
  "shield-in": 1.9,
  "shield-out": 1.9,
  gasket: 2.9,
  "upper-enclosure": 3.9,
  "led-pipes": 4.9,
  "acoustic-inlet": 4.9,
  "control-guards": 5.6,
  "sos-control": 6.3,
  "mark-control": 6.3,
  fasteners: 7.1,
};
/** everything that rides on the board lifts as one layer */
const PCB_LAYER = 0.9;

for (const p of PARTS) {
  const f = FOOT_BY_ID[p.id];
  if (f) p.pos = [f.x, BOARD_TOP + f.h / 2, f.z];

  const rung = LADDER[p.id];
  if (rung === undefined) p.explode = [0, p.group.startsWith("PCB") ? PCB_LAYER : 0, 0];
  else if (Array.isArray(rung)) p.explode = rung;
  else p.explode = [0, rung, 0];
}

export const PARTS_BY_ID: Record<string, PartDef> = PARTS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, PartDef>,
);

export const PART_GROUPS = Array.from(new Set(PARTS.map((p) => p.group)));

export function isVisible(part: PartDef, mode: ModeId): boolean {
  return part.modes.includes(mode);
}
