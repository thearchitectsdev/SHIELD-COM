/* ==================================================================
 * SIH26052 — IDEA SUBMISSION DECK
 *
 * Structured EXACTLY to the SIH idea-presentation template (6 slides):
 *   1 Title  2 Proposed Solution  3 Technical Approach
 *   4 Feasibility & Viability  5 Impact & Benefits  6 Research & References
 *
 * Content is drawn only from the SHIELD-COM website (src/data/*,
 * src/components/*). Nothing here is invented.
 *
 * Status vocabulary used throughout, so nothing planned reads as done:
 *   BUILT · IN DEVELOPMENT · DESIGN TARGET · PLANNED · NEEDS INPUT
 * ================================================================== */

export type Status = "BUILT" | "IN DEVELOPMENT" | "DESIGN TARGET" | "PLANNED" | "NEEDS INPUT";

export const PS = {
  id: "SIH26052",
  title: "NEEDS INPUT — paste the official PS title from the SIH portal",
  theme: "NEEDS INPUT — confirm theme exactly as listed on the portal",
  org: "NEEDS INPUT — ministry / organisation name from the portal",
  edition: "Hardware Edition",
};

export const TEAM = {
  name: "NEEDS INPUT",
  institute: "NEEDS INPUT",
  members: [
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
    ["NEEDS INPUT", "NEEDS INPUT — dept"],
  ],
  mentor: "NEEDS INPUT — mentor name (5+ yrs experience)",
  leader: "NEEDS INPUT",
};

/* ------------------------------ SLIDE 2 ------------------------------ */
export const PROBLEM = {
  headline: "Voice over a field radio stops being understandable when the environment gets loud.",
  causes: ["Rotor / propeller wash", "Wind and vehicle noise", "Crowd or machinery", "PPE and helmets over the ears"],
  consequence:
    "The operator repeats themselves, shouts, or moves to get clear. Time is lost, and in the worst case a call is not understood at all.",
  today: [
    "Shout and repeat — slow, tiring, unreliable",
    "Replace the radio with a noise-cancelling set — expensive, and the operator loses the radio they already trust",
    "Headset-only processing — does nothing for the transmission the far end actually receives",
  ],
  gap: "Nothing sits between an existing radio and its accessory and fixes only the voice.",
};

export const SOLUTION = {
  oneLiner: "SHIELD-COM is a small inline module that sits on the audio accessory path of a radio the operator already carries, cleans the voice, and hands it back.",
  does: ["Cleans and enhances voice", "Manages level automatically", "Buffers short audio events", "Tags transmissions with MARK", "Raises a deliberate SOS event"],
  doesNot: ["No transmitter, receiver or antenna", "No channel control, no menus", "No headphone or volume buttons", "It never becomes the radio"],
  differentiators: [
    ["Inline, not instead", "The operator keeps the radio they already trust. Nothing to retrain."],
    ["No RF of its own", "Transmission stays entirely with the host radio — no antenna, no transmitter certification burden."],
    ["Two controls on purpose", "Guarded SOS and ridged MARK, distinct by feel. Everything else is configured over USB-C."],
    ["Four LEDs, no screens", "The entire state model is four LEDs with one meaning each."],
    ["Serviceable by design", "Connectorised cell, clip-off shields, test points, replaceable gasket."],
  ],
};

/* ------------------------------ SLIDE 3 ------------------------------ */
export const CHAIN = [
  { id: "in", title: "Analogue in", ref: "U2", detail: "Protected and filtered at the connector, inside its own shield can", spec: "TVS + RC anti-alias · differential" },
  { id: "adc", title: "Convert", ref: "U2", detail: "Analogue voice digitised next to the input", spec: "24-bit audio ADC · QFN-16" },
  { id: "dsp", title: "Process", ref: "U1", detail: "Suppression, level management, voice activity, pop/click", spec: "ESP32-S3 SoM · dual core" },
  { id: "dac", title: "Convert back", ref: "U3", detail: "Processed voice returned to analogue with ramped enable", spec: "24-bit DAC + line driver" },
  { id: "out", title: "Analogue out", ref: "U3", detail: "Driven back toward the radio audio interface", spec: "AC-coupled · series protected" },
];

export const STACK: { label: string; value: string; status?: Status }[] = [
  { label: "Processor", value: "ESP32-S3 shielded module (U1) — DSP pipeline, events, LEDs, USB" },
  { label: "Audio front end", value: "24-bit ADC (U2, QFN-16) · 24-bit DAC + driver (U3, QFN-20)" },
  { label: "Microphones", value: "MEMS PDM pair (MK1/MK2) — voice + noise reference" },
  { label: "Storage", value: "16 MB QSPI NOR (U4) — firmware, config, calibration, MARK clips" },
  { label: "Power", value: "1S Li-ion (BT1) · charger / PMIC (U5) · 2.2 MHz buck (U6/L1) · low-noise LDO (U7)" },
  { label: "Protection", value: "TVS array (D1) · cell OV/UV/OC/SC cut-off (U8) · two EMI shields" },
  { label: "Board", value: "FR-4 1.6 mm, 4 layer, ENIG · 66 × 34 mm" },
  { label: "Enclosure", value: "6061-T6 hardcoat · silicone seal · braided aramid cable" },
  { label: "Firmware pipeline", value: "IN DEVELOPMENT — voice pipeline runs on U1, not on a host PC", status: "IN DEVELOPMENT" },
];

export const RAILS: [string, string, string][] = [
  ["VBUS", "5 V", "USB-C in, current limited, TVS clamped"],
  ["VBAT", "3.0 – 4.2 V", "Cell behind pack + board protection"],
  ["3V3", "3.3 V", "Buck — processor, flash, logic"],
  ["AVDD", "3.0 V", "LDO — ADC, DAC, analogue front end"],
];

export const INTERFACES: [string, string][] = [
  ["Audio in", "4-pin latched board-to-wire + shield tab"],
  ["Audio out", "4-pin latched, keyed differently to in"],
  ["Service", "USB-C 2.0 — charge, firmware, clip offload"],
  ["Cell", "2-pin polarised locking connector"],
  ["Digital audio", "I²S / TDM between codecs and processor"],
  ["Mics", "PDM pair on a shared clock"],
  ["Telemetry", "I²C charger state and fault reporting"],
];

/* ------------------------------ SLIDE 4 ------------------------------ */
export const FEASIBILITY: { status: Status; title: string; items: string[]; tone: string }[] = [
  {
    status: "BUILT",
    tone: "#7ee787",
    title: "Done — full 3D engineering model + interactive demo",
    items: [
      "Complete enclosure, frame, cell bay and fastener set, modelled to size",
      "Populated PCB with every footprint placed and collision-checked, copper routed",
      "Interactive teardown: assembled → exploded → PCB → internal cut-away",
      "Working UI demo of both controls, the radio keypad and the live audio chain",
      "Parts index with reference designators, packages and specifications",
    ],
  },
  {
    status: "IN DEVELOPMENT",
    tone: "#4fd1e0",
    title: "In progress — the part that makes it a product",
    items: [
      "Voice-cleaning firmware on the ESP32-S3 module",
      "Prototype PCB fabrication and assembly",
      "Enclosure machining / moulding and seal verification",
    ],
  },
  {
    status: "DESIGN TARGET",
    tone: "#f0a93b",
    title: "Design intent — not yet measured",
    items: [
      "IP67 sealing intent for the assembled enclosure",
      "Two-mic suppression, reference mic 9 mm from the voice mic",
      "Switching fundamental kept above the voice band",
      "Glove-operable actuation force on both controls",
    ],
  },
  {
    status: "PLANNED",
    tone: "#63b3ed",
    title: "Validation we intend to run",
    items: [
      "Intelligibility scoring against recorded field noise",
      "IEC 61000-4-2 ESD immunity on all external interfaces",
      "Ingress, drop and cable pull-out testing",
      "Charge / discharge cycling on the production cell",
    ],
  },
];

export const HONESTY = "No field measurements are published yet. Bench data will be added per build with the test setup stated.";

export const WHY_FEASIBLE = [
  "Every active is a catalogue part — QFN / SOIC / SOT packages, no custom silicon",
  "4-layer 1.6 mm FR-4, standard assembly house, no RF tuning step",
  "No transmitter means no antenna design risk and no RF type-approval on our side",
  "Board is frame-carried, so shock is taken by the chassis and not by solder joints",
];

export const VIABILITY_GAPS: [string, string][] = [
  ["Bill of materials cost", "NEEDS INPUT — priced BOM required"],
  ["Unit cost at volume", "NEEDS INPUT"],
  ["Team roles at the finale", "NEEDS INPUT — assign per member"],
  ["Component lead times", "NEEDS INPUT — confirm distributor stock"],
  ["Firmware milestone dates", "NEEDS INPUT"],
];

/* ------------------------------ SLIDE 5 ------------------------------ */
export const IMPACT: { who: string; benefit: string; detail: string }[] = [
  {
    who: "The operator",
    benefit: "Fewer repeats, less shouting",
    detail: "Voice arrives readable over rotor, wind and vehicle noise without raising their voice.",
  },
  {
    who: "The unit",
    benefit: "Nothing new to learn",
    detail: "It clips onto the accessory path of a radio already in service. No retraining, no new SOP.",
  },
  {
    who: "Safety of life",
    benefit: "Deliberate escalation and tagging",
    detail: "SOS needs a long press under a guard so a snag cannot raise it. MARK freezes a short audio buffer for review.",
  },
  {
    who: "Procurement",
    benefit: "Accessory economics, not radio economics",
    detail: "Adds capability to existing inventory instead of replacing radios — lower cost, less waste.",
  },
  {
    who: "Maintainers",
    benefit: "Field-serviceable",
    detail: "Cell swaps without soldering, clip-off shields expose both analogue islands, TP1–TP8 cover every rail.",
  },
];

export const SCALE = [
  ["Disaster response", "Same board, different enclosure and controls for rescue teams working near pumps and machinery"],
  ["Industrial and plant", "Noisy floors where hand-held radio clarity is a safety function"],
  ["Aviation ground crew", "Apron and taxiway noise with existing headset habits"],
  ["Same core, new variants", "One PCB, one firmware line, changed enclosure, cable and control caps"],
];

export const IMPACT_GAPS: [string, string][] = [
  ["Understandability improvement", "NEEDS INPUT — requires intelligibility scoring, not yet measured"],
  ["Noise reduction figure", "NEEDS INPUT — no dB claim can be made yet"],
  ["Latency", "NEEDS INPUT — must be measured on hardware"],
  ["Battery life", "NEEDS INPUT — depends on cell cycling results"],
  ["Deployment sites / pilots", "NEEDS INPUT"],
];

/* ------------------------------ SLIDE 6 ------------------------------ */
export const REFERENCES: [string, string, string][] = [
  ["IEC 60529", "Degrees of protection provided by enclosures (IP Code)", "Sealing intent behind the IP67 design target"],
  ["IEC 61000-4-2", "Electrostatic discharge immunity test", "Planned ESD validation on USB-C and both audio interfaces"],
  ["ITU-T P.800", "Methods for subjective determination of transmission quality", "Method for the planned intelligibility scoring"],
  ["ITU-T P.863", "POLQA — perceptual objective prediction of speech quality", "Candidate objective metric for the voice pipeline"],
  ["MIL-STD-810H", "Environmental engineering considerations and laboratory tests", "Reference for drop, vibration and environmental test planning"],
  ["IPC-A-610", "Acceptability of electronic assemblies", "Assembly acceptance class for the 4-layer ENIG board"],
  ["S. Boll, 1979", "Suppression of acoustic noise in speech using spectral subtraction, IEEE Trans. ASSP 27(2)", "Baseline single-channel suppression approach"],
  ["B. Widrow & S. Stearns, 1985", "Adaptive Signal Processing, Prentice-Hall", "Adaptive reference-mic cancellation basis"],
  ["Espressif", "ESP32-S3 Series Datasheet", "Processor module U1 — the DSP host"],
];

export const REF_GAPS: [string, string][] = [
  ["Specific dual-microphone suppression papers we will implement", "NEEDS INPUT — select and cite 2–3 concrete papers"],
  ["Ministry / department field data or noise recordings", "NEEDS INPUT — no dataset was supplied with the statement"],
  ["Prior art comparison against commercial inline accessories", "NEEDS INPUT"],
];
