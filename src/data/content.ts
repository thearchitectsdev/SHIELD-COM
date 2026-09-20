export const PCB_CARDS: {
  id: string;
  tag: string;
  title: string;
  ref: string;
  body: string;
  points: string[];
  color: string;
  part: string;
}[] = [
  {
    id: "processing",
    tag: "01",
    title: "Processing",
    ref: "U1 · ESP32-S3 module",
    body: "Dual-core embedded processor running the voice-cleaning pipeline, event logic and status behaviour. Shielded module, no external RF interface on the product.",
    points: ["Voice pipeline + control loop", "SOS / MARK event handling", "LED status logic", "USB service & configuration"],
    color: "#4fd1e0",
    part: "u1",
  },
  {
    id: "audio-in",
    tag: "02",
    title: "Audio Input",
    ref: "U2 · 24-bit audio ADC",
    body: "Protected analogue input from the host radio path, filtered and converted on a separated analogue island fed by its own low-noise rail.",
    points: ["TVS + series protection", "RC anti-alias & common-mode filter", "QFN-16, differential input", "I²S to the processor"],
    color: "#63b3ed",
    part: "u2",
  },
  {
    id: "audio-out",
    tag: "03",
    title: "Audio Output",
    ref: "U3 · DAC + line driver",
    body: "Processed voice returned to analogue and driven back toward the radio audio interface, with ramped enable so the operator never hears a transition.",
    points: ["24-bit mono DAC + driver", "Pop / click suppression", "AC-coupled, series protected", "No headphone control on the body"],
    color: "#8fa268",
    part: "u3",
  },
  {
    id: "power",
    tag: "04",
    title: "Power",
    ref: "BT1 · U5 · U6 · U7",
    body: "Single-cell Li-ion with charger, power path, buck regulation and a quiet analogue post-regulator. Charging and service share one sealed USB-C port.",
    points: ["1S Li-ion pouch + harness", "Charger / dynamic power path", "2.2 MHz buck, out of band", "Low-noise LDO for AVDD"],
    color: "#f0a93b",
    part: "battery",
  },
  {
    id: "memory",
    tag: "05",
    title: "Memory",
    ref: "U4 · 16 MB QSPI NOR",
    body: "Non-volatile storage for firmware, configuration, calibration and MARK event clips, so a tagged clip survives a power cycle.",
    points: ["Firmware + config + calibration", "MARK clip journal", "Quad SPI, 80 MHz", "Offload over USB-C"],
    color: "#c084fc",
    part: "u4",
  },
  {
    id: "protection",
    tag: "06",
    title: "Protection",
    ref: "D1 · U8 · SH1 · SH2",
    body: "Transient protection on every external interface, secondary cell protection independent of the charger, and shielded analogue islands.",
    points: ["Low-C TVS on USB + audio", "Cell OV / UV / OC / SC cut-off", "Two clip-on EMI cans", "Gold test points on every rail"],
    color: "#d8453c",
    part: "d1",
  },
  {
    id: "controls",
    tag: "07",
    title: "Controls",
    ref: "SW1 · SW2",
    body: "Two sealed tactile switches under guarded caps. Nothing else is user-actuable anywhere on the enclosure.",
    points: ["12 mm sealed switch — SOS", "6 mm sealed switch — MARK", "RC debounce + firmware qualifier", "Glove-rated actuation force"],
    color: "#ff6b5e",
    part: "sw1",
  },
  {
    id: "indication",
    tag: "08",
    title: "Status Indication",
    ref: "D2–D5 · light pipes",
    body: "Four LEDs on sealed light pipes report power, processing, SOS state and stored MARK events. They are indicators only — never buttons.",
    points: ["Green — power / charge", "Cyan — processing active", "Red — SOS raised", "Amber — MARK clip stored"],
    color: "#7ee787",
    part: "led-pipes",
  },
];

export const STORY: { k: string; t: string; d: string }[] = [
  { k: "01", t: "Intelligibility first", d: "SHIELD-COM exists to make a voice easier to understand when the environment is working against it." },
  { k: "02", t: "Inline, not instead", d: "It sits on the audio accessory path of a radio the operator already carries and trusts." },
  { k: "03", t: "No RF of its own", d: "No transmitter, no receiver, no antenna, no channel logic. Transmission stays entirely with the host radio." },
  { k: "04", t: "Clean · buffer · tag", d: "Voice cleaning, level management, short audio buffering and event tagging — nothing else competes for attention." },
  { k: "05", t: "Built for gloves", d: "Guarded, raised, tactilely distinct controls that can be found without looking down." },
  { k: "06", t: "No screens, no menus", d: "Four LEDs carry the entire state model. There is nothing to navigate in the field." },
  { k: "07", t: "Two controls on purpose", d: "SOS and MARK are the only physical controls. Everything else is configured over the service port." },
  { k: "08", t: "Serviceable by design", d: "Connectorised cell, removable shields, exposed test points and a documented teardown order." },
];

export const ENG_COMPONENTS: [string, string, string, string][] = [
  ["U1", "ESP32-S3 module", "Shielded SoM · 25.5 × 18 × 3.1 mm", "DSP pipeline, events, LEDs, USB"],
  ["U2", "Audio ADC", "QFN-16 · 3 × 3 mm", "Analogue input conversion, 24-bit"],
  ["U3", "Audio DAC + driver", "QFN-20 · 3.5 × 3.5 mm", "Output stage toward host radio"],
  ["U4", "QSPI NOR flash", "SOIC-8 · 208 mil", "Firmware, config, MARK clips"],
  ["U5", "Charger / PMIC", "QFN-20 · 4 × 4 mm", "1S charge + dynamic power path"],
  ["U6 / L1", "Buck + inductor", "QFN-8 · 2.2 µH shielded", "3.3 V digital rail, 2.2 MHz"],
  ["U7", "Low-noise LDO", "SOT-23-5", "3.0 V analogue rail (AVDD)"],
  ["U8", "Cell protection", "DFN + dual N-FET", "OV / UV / OC / SC cut-off"],
  ["D1", "TVS array", "SOT-563", "USB and audio transient clamp"],
  ["MK1 / MK2", "MEMS microphone pair", "3.5 × 2.65 mm bottom port", "Voice + noise reference, PDM"],
  ["SW1 / SW2", "Sealed tactile switches", "12 mm THT / 6 mm SMD", "SOS and MARK only"],
  ["BT1", "Li-ion cell pack", "1S pouch · 50 × 27 × 5.8 mm", "Field-replaceable, connectorised"],
];

export const ENG_INTERFACES: [string, string][] = [
  ["Audio input", "4-pin latched board-to-wire, shield tab"],
  ["Audio output", "4-pin latched board-to-wire, keyed differently"],
  ["Service port", "USB-C 2.0, mid-mount, reinforced + gasketed"],
  ["Cell", "2-pin polarised locking connector"],
  ["Debug", "6-pin 1.27 mm pads, unpopulated in field build"],
  ["Digital audio", "I²S / TDM between codecs and processor"],
  ["Microphones", "PDM pair on a shared clock"],
  ["Telemetry", "I²C charger state and fault reporting"],
];

export const ENG_RAILS: [string, string, string][] = [
  ["VBUS", "5 V", "USB-C input, current limited, TVS clamped"],
  ["VBAT", "3.0 – 4.2 V", "Cell rail behind pack + board protection"],
  ["3V3", "3.3 V", "Buck rail — processor, flash, logic"],
  ["AVDD", "3.0 V", "LDO rail — ADC, DAC, analogue front end"],
  ["VLED", "3.3 V", "Current-limited status indication"],
];

export const ENG_MATERIALS: [string, string][] = [
  ["Upper / lower enclosure", "6061-T6 with hardcoat, graphite finish"],
  ["Internal frame", "Die-cast alloy carrier, ground-bonded"],
  ["Seal", "Silicone 50 Sh A, continuous O-profile"],
  ["Control caps", "Sealed elastomer boot + rigid cap"],
  ["Acoustic membrane", "Hydrophobic ePTFE mesh"],
  ["Cable", "Braided aramid over shielded TPU"],
  ["Fasteners", "M2 torx into brass heat-set inserts"],
  ["Board", "FR-4, 1.6 mm, 4 layer, ENIG"],
];

export const ENG_SERVICE: string[] = [
  "Six top fasteners, documented removal order",
  "Cell disconnects at the board — no soldering",
  "Clip-off EMI cans expose both analogue islands",
  "TP1–TP8 cover every rail plus audio in / out",
  "USB-C service mode for firmware and clip offload",
  "Gasket is a replaceable service item",
];

export const ENV_CONCEPTS: [string, string][] = [
  ["Ingress", "IP67 design intent — sealed seam, ducted acoustics"],
  ["Acoustic", "ePTFE membrane over both inlets"],
  ["Shock / drop", "Frame-carried board, no cantilevered mass"],
  ["Cable", "Boot-controlled bend radius, anchored strain relief"],
  ["Thermal", "Charge current thermally folded by the PMIC"],
  ["EMI", "Two shield cans, single-point shield bonding"],
];

export const CLAIM_GROUPS: { kind: string; tone: string; items: string[] }[] = [
  {
    kind: "Measured",
    tone: "#7ee787",
    items: ["No field measurements are published yet.", "Bench data will be added per build with the test setup stated."],
  },
  {
    kind: "Design target",
    tone: "#f0a93b",
    items: [
      "IP67 sealing intent for the assembled enclosure",
      "Two-mic suppression with the reference mic 9 mm from the voice mic",
      "Switching fundamental kept above the voice band",
      "Glove-operable actuation force on both controls",
    ],
  },
  {
    kind: "Planned validation",
    tone: "#4fd1e0",
    items: [
      "Intelligibility scoring against recorded field noise",
      "IEC 61000-4-2 ESD immunity on all external interfaces",
      "Ingress, drop and cable pull-out testing",
      "Charge / discharge cycling on the production cell",
    ],
  },
];

export const FIELD_POINTS: { t: string; d: string }[] = [
  { t: "Stays on the audio path", d: "Clipped or pouched between the radio and the operator's existing accessory. The radio keeps doing what it already does." },
  { t: "Found by feel", d: "A raised rectangular SOS cap and a smaller round MARK cap — distinguishable through a glove, in the dark." },
  { t: "Read at a glance", d: "Four LEDs, one meaning each. Nothing to scroll, nothing to confirm, nothing to dismiss." },
  { t: "Tag it, move on", d: "MARK freezes a short pre- and post-event buffer for later review instead of asking for a repeat." },
  { t: "Escalate deliberately", d: "SOS needs a long, intentional press under a guard frame, so a snagged strap cannot raise an event." },
  { t: "Service between tasks", d: "One USB-C port for charge, firmware and clip offload. The cell swaps without tools beyond a torx driver." },
];
