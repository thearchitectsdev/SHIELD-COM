import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * Board geometry. 1 scene unit = 10 mm.
 * Board local coordinates: x ∈ [-3.3, 3.3], z ∈ [-1.7, 1.7]
 * ------------------------------------------------------------------ */
export const BOARD = { w: 6.6, d: 3.4, t: 0.16, top: 0.16, y: 0.08 };

export type FootKind = "qfn" | "soic" | "sot" | "module" | "conn" | "usbc" | "sw" | "mic" | "led" | "xtal" | "ind" | "hdr";

export interface Foot {
  id: string;
  ref: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind: FootKind;
  pins?: number;
  rot?: number;
}

/* Placement is collision-checked: no two footprints, holes, pads or cans overlap. */
export const FOOTS: Foot[] = [
  { id: "u1", ref: "U1", x: -0.6, z: 0.6, w: 2.55, d: 1.7, h: 0.32, kind: "module" },
  { id: "u2", ref: "U2", x: -2.45, z: -0.6, w: 0.42, d: 0.42, h: 0.09, kind: "qfn", pins: 16 },
  { id: "u3", ref: "U3", x: 1.85, z: -0.85, w: 0.48, d: 0.48, h: 0.09, kind: "qfn", pins: 20 },
  { id: "u4", ref: "U4", x: 1.3, z: 1.15, w: 0.52, d: 0.4, h: 0.1, kind: "soic", pins: 8 },
  { id: "u5", ref: "U5", x: -2.45, z: 0.75, w: 0.42, d: 0.42, h: 0.09, kind: "qfn", pins: 20 },
  { id: "u6", ref: "U6", x: -3.0, z: 1.05, w: 0.3, d: 0.3, h: 0.08, kind: "qfn", pins: 8 },
  { id: "l1", ref: "L1", x: -2.5, z: 1.28, w: 0.42, d: 0.42, h: 0.15, kind: "ind" },
  { id: "u7", ref: "U7", x: -1.95, z: -0.9, w: 0.3, d: 0.26, h: 0.11, kind: "sot", pins: 5 },
  { id: "u8", ref: "U8", x: -2.45, z: 0.1, w: 0.34, d: 0.28, h: 0.08, kind: "sot", pins: 6 },
  { id: "d1", ref: "D1", x: -1.72, z: -1.52, w: 0.22, d: 0.17, h: 0.06, kind: "sot", pins: 6 },
  { id: "y1", ref: "Y1", x: 1.15, z: 0.5, w: 0.32, d: 0.25, h: 0.09, kind: "xtal" },
  { id: "j1", ref: "J1", x: -2.35, z: -1.5, w: 0.9, d: 0.72, h: 0.33, kind: "usbc" },
  { id: "j2", ref: "J2", x: -3.05, z: 0.35, w: 0.46, d: 0.6, h: 0.28, kind: "conn", pins: 2 },
  { id: "j3", ref: "J3", x: -3.05, z: -0.65, w: 0.44, d: 0.82, h: 0.32, kind: "conn", pins: 4 },
  { id: "j4", ref: "J4", x: 3.05, z: -0.9, w: 0.44, d: 0.82, h: 0.32, kind: "conn", pins: 4 },
  { id: "j5", ref: "J5", x: 2.15, z: 1.45, w: 0.9, d: 0.2, h: 0.24, kind: "hdr", pins: 6 },
  { id: "mk1", ref: "MK1", x: 2.75, z: 1.05, w: 0.35, d: 0.27, h: 0.12, kind: "mic" },
  { id: "mk2", ref: "MK2", x: 2.75, z: 0.15, w: 0.35, d: 0.27, h: 0.12, kind: "mic" },
  { id: "sw1", ref: "SW1", x: -0.95, z: -1.05, w: 1.2, d: 1.2, h: 0.2, kind: "sw" },
  { id: "sw2", ref: "SW2", x: 0.75, z: -1.15, w: 0.62, d: 0.62, h: 0.14, kind: "sw" },
];

export const FOOT_BY_ID: Record<string, Foot> = FOOTS.reduce((a, f) => ({ ...a, [f.id]: f }), {});

export const LED_POS: { x: number; z: number; color: string; label: string }[] = [
  { x: 1.6, z: -1.5, color: "#5cff9d", label: "PWR" },
  { x: 1.9, z: -1.5, color: "#4fd1e0", label: "PRC" },
  { x: 2.2, z: -1.5, color: "#ff4b3e", label: "SOS" },
  { x: 2.5, z: -1.5, color: "#ffb02e", label: "MRK" },
];

export const MOUNT_HOLES: [number, number][] = [
  [-3.05, 1.5],
  [3.05, 1.5],
  [-3.05, -1.5],
  [3.05, -1.5],
];

export const SHIELD_CANS = [
  { id: "shield-in", x: -2.23, z: -0.7, w: 1.05, d: 0.78, h: 0.26 },
  { id: "shield-out", x: 1.85, z: -0.85, w: 0.95, d: 0.82, h: 0.26 },
];

export const TEST_POINTS: [number, number, string][] = [
  [-3.15, -0.05, "TP1"],
  [-2.0, 0.3, "TP2"],
  [-2.05, 1.3, "TP3"],
  [-1.62, -0.3, "TP4"],
  [0.95, -0.35, "TP5"],
  [1.35, -0.35, "TP6"],
  [0.3, 1.6, "TP7"],
  [2.95, -0.1, "TP8"],
];

/** assembly fiducials — 1 mm copper dot in a 2 mm mask opening */
export const FIDUCIALS: [number, number][] = [
  [0.0, -1.62],
  [-3.18, 0.85],
  [3.18, 0.62],
];

/** thermal via fields drawn under the power devices */
export const VIA_FIELDS: { x: number; z: number; w: number; d: number; n: number }[] = [
  { x: -2.45, z: 0.75, w: 0.22, d: 0.22, n: 9 },
  { x: -3.0, z: 1.05, w: 0.14, d: 0.14, n: 4 },
  { x: 1.85, z: -0.85, w: 0.24, d: 0.24, n: 9 },
  { x: -2.45, z: -0.6, w: 0.2, d: 0.2, n: 9 },
];

/* ---------------- passive placement (deterministic) ---------------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface Passive {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: number;
  kind: "r" | "c" | "cbulk" | "fb";
}

const CLUSTERS: { x: number; z: number; w: number; d: number; n: number; kind: Passive["kind"][]; under?: boolean }[] = [
  // power island — bulk + decoupling around the charger, buck and inductor
  { x: -2.78, z: 0.05, w: 0.5, d: 0.7, n: 4, kind: ["c", "cbulk"] },
  { x: -2.12, z: 0.55, w: 0.45, d: 0.95, n: 5, kind: ["c", "r", "fb"] },
  { x: -2.75, z: 1.62, w: 1.1, d: 0.12, n: 3, kind: ["c", "r"] },
  // analogue input island — filtering around the ADC and LDO
  { x: -2.4, z: -1.15, w: 1.0, d: 0.2, n: 4, kind: ["c", "r"] },
  { x: -2.9, z: -1.15, w: 0.35, d: 0.35, n: 2, kind: ["c", "fb"] },
  // digital / processor perimeter
  { x: -0.6, z: 1.62, w: 2.3, d: 0.12, n: 6, kind: ["c", "r"] },
  { x: 0.08, z: -0.85, w: 0.55, d: 0.9, n: 5, kind: ["c", "r"] },
  { x: -1.72, z: -0.95, w: 0.16, d: 1.0, n: 3, kind: ["c", "r"] },
  // output island + codec support
  { x: 1.2, z: -0.05, w: 0.6, d: 0.65, n: 5, kind: ["c", "r", "fb"] },
  { x: 2.58, z: -0.6, w: 0.5, d: 0.85, n: 5, kind: ["c", "r"] },
  // memory + mic support
  { x: 2.25, z: 0.6, w: 0.85, d: 0.7, n: 5, kind: ["c", "r"] },
  { x: 0.85, z: 0.95, w: 0.28, d: 0.9, n: 3, kind: ["c", "r"] },
  // under the shield cans — revealed when the cans are lifted for inspection
  { x: -2.23, z: -0.7, w: 0.8, d: 0.55, n: 5, kind: ["c", "r"], under: true },
  { x: 1.85, z: -0.85, w: 0.7, d: 0.6, n: 4, kind: ["c", "r"], under: true },
];

function overlapsFoot(x: number, z: number, pad = 0.12, ignoreCans = false) {
  for (const f of FOOTS) {
    if (Math.abs(x - f.x) < f.w / 2 + pad && Math.abs(z - f.z) < f.d / 2 + pad) return true;
  }
  if (!ignoreCans) {
    for (const c of SHIELD_CANS) {
      if (Math.abs(x - c.x) < c.w / 2 + 0.06 && Math.abs(z - c.z) < c.d / 2 + 0.06) return true;
    }
  }
  for (const h of MOUNT_HOLES) if (Math.hypot(x - h[0], z - h[1]) < 0.38) return true;
  for (const t of TEST_POINTS) if (Math.hypot(x - t[0], z - t[1]) < 0.2) return true;
  for (const f of FIDUCIALS) if (Math.hypot(x - f[0], z - f[1]) < 0.18) return true;
  for (const l of LED_POS) if (Math.hypot(x - l.x, z - l.z) < 0.2) return true;
  return Math.abs(x) > 3.16 || Math.abs(z) > 1.66;
}

export const PASSIVES: Passive[] = (() => {
  const r = rng(20260218);
  const out: Passive[] = [];
  for (const c of CLUSTERS) {
    let guard = 0;
    let placed = 0;
    while (placed < c.n && guard < 400) {
      guard++;
      const x = c.x + (r() - 0.5) * c.w;
      const z = c.z + (r() - 0.5) * c.d;
      if (Math.abs(x) > 3.15 || Math.abs(z) > 1.62) continue;
      if (overlapsFoot(x, z, 0.11, c.under)) continue;
      if (out.some((p) => Math.hypot(p.x - x, p.z - z) < 0.16)) continue;
      const kind = c.kind[Math.floor(r() * c.kind.length)];
      const big = kind === "cbulk";
      out.push({
        x,
        z,
        w: big ? 0.2 : 0.1,
        d: big ? 0.125 : 0.055,
        h: big ? 0.09 : 0.045,
        rot: r() > 0.5 ? 0 : Math.PI / 2,
        kind,
      });
      placed++;
    }
  }
  return out;
})();

/* ------------------------------------------------------------------ *
 * Canvas texture helpers
 * ------------------------------------------------------------------ */
function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

function finish(c: HTMLCanvasElement, aniso = 8) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = aniso;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ---------------------------- PCB TOP ----------------------------- */
export function makePcbTexture(): THREE.CanvasTexture {
  const W = 1980;
  const H = 1020;
  const { c, g } = makeCanvas(W, H);
  const PX = (x: number) => ((x + 3.3) / 6.6) * W;
  const PZ = (z: number) => ((z + 1.7) / 3.4) * H;
  const S = W / 6.6; // px per unit

  // --- solder mask base
  g.fillStyle = "#0d3524";
  g.fillRect(0, 0, W, H);

  // subtle weave
  g.globalAlpha = 0.055;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = i % 2 ? "#1d5a3c" : "#07281a";
    const x = Math.random() * W;
    const y = Math.random() * H;
    g.fillRect(x, y, 60 + Math.random() * 180, 1.4);
  }
  g.globalAlpha = 1;

  // --- ground pour zone (slightly lighter mask over copper)
  g.fillStyle = "#114029";
  g.fillRect(PX(-3.25), PZ(-1.65), (6.5 / 6.6) * W, (3.3 / 3.4) * H);

  // analogue island (separate pour, gap around it)
  const island = (x: number, z: number, w: number, d: number) => {
    g.fillStyle = "#0b3020";
    g.fillRect(PX(x - w / 2) - 5, PZ(z - d / 2) - 5, (w / 6.6) * W + 10, (d / 3.4) * H + 10);
    g.fillStyle = "#13472e";
    g.fillRect(PX(x - w / 2), PZ(z - d / 2), (w / 6.6) * W, (d / 3.4) * H);
  };
  island(-2.3, -0.72, 1.55, 1.45);
  island(1.95, -0.8, 1.5, 1.3);

  // --- copper traces
  const trace = (pts: [number, number][], width = 0.028, col = "#1a5a38") => {
    g.strokeStyle = col;
    g.lineWidth = Math.max(1.1, width * S);
    g.lineJoin = "round";
    g.lineCap = "round";
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(PX(p[0]), PZ(p[1])) : g.moveTo(PX(p[0]), PZ(p[1]))));
    g.stroke();
    // highlight edge
    g.strokeStyle = "rgba(146,196,128,0.14)";
    g.lineWidth = Math.max(0.6, width * S * 0.35);
    g.stroke();
  };

  const bus = (pts: [number, number][], n: number, spacing = 0.05, width = 0.024) => {
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * spacing;
      trace(
        pts.map(([x, z]) => [x, z + o] as [number, number]),
        width,
      );
    }
  };

  // analogue input: J3 -> filter -> U2
  bus(
    [
      [-2.86, -0.6],
      [-2.74, -0.6],
      [-2.68, -0.6],
    ],
    2,
    0.09,
    0.032,
  );
  // U2 -> U1 (I2S in), routed up the analogue/digital boundary
  bus(
    [
      [-2.26, -0.52],
      [-2.12, -0.52],
      [-2.0, -0.4],
      [-2.0, -0.05],
      [-1.94, 0.06],
      [-1.9, 0.2],
    ],
    4,
    0.05,
  );
  // U1 -> U3 (I2S out)
  bus(
    [
      [0.68, 0.05],
      [0.95, 0.05],
      [1.08, -0.12],
      [1.42, -0.5],
      [1.55, -0.72],
      [1.62, -0.78],
    ],
    4,
    0.05,
  );
  // U3 -> J4
  bus(
    [
      [2.1, -0.92],
      [2.45, -0.92],
      [2.6, -0.9],
      [2.84, -0.9],
    ],
    2,
    0.09,
    0.034,
  );
  // PDM mics -> U1
  bus(
    [
      [2.58, 1.02],
      [2.0, 1.02],
      [1.88, 0.9],
      [0.95, 0.9],
      [0.82, 0.86],
      [0.68, 0.86],
    ],
    3,
    0.048,
  );
  bus(
    [
      [2.58, 0.18],
      [2.42, 0.18],
      [2.3, 0.3],
      [2.3, 0.78],
      [2.2, 0.9],
    ],
    3,
    0.048,
  );
  // USB -> ESD -> U1
  bus(
    [
      [-2.0, -1.4],
      [-1.9, -1.4],
      [-1.84, -1.46],
    ],
    4,
    0.045,
  );
  bus(
    [
      [-1.6, -1.5],
      [-1.5, -1.5],
      [-1.42, -1.42],
      [-1.42, -0.5],
      [-1.5, -0.4],
      [-1.5, -0.1],
      [-1.4, 0.0],
    ],
    2,
    0.055,
  );
  // USB VBUS -> charger
  trace(
    [
      [-2.7, -1.36],
      [-2.86, -1.36],
      [-2.98, -1.24],
      [-2.98, -1.14],
      [-2.7, -0.95],
      [-2.7, -0.15],
      [-2.86, -0.02],
      [-2.86, 0.12],
    ],
    0.075,
    "#1d6640",
  );
  // cell -> protection -> charger
  trace(
    [
      [-2.86, 0.6],
      [-2.7, 0.6],
      [-2.62, 0.45],
      [-2.56, 0.26],
    ],
    0.08,
    "#1d6640",
  );
  trace(
    [
      [-2.45, -0.06],
      [-2.45, 0.5],
    ],
    0.08,
    "#1d6640",
  );
  // charger -> buck -> inductor -> 3V3 spine
  trace(
    [
      [-2.62, 0.86],
      [-2.86, 0.86],
      [-2.94, 0.94],
    ],
    0.07,
    "#1d6640",
  );
  trace(
    [
      [-2.9, 1.2],
      [-2.9, 1.34],
      [-2.73, 1.34],
    ],
    0.1,
    "#1d6640",
  );
  trace(
    [
      [-2.27, 1.28],
      [-2.05, 1.28],
      [-1.94, 1.4],
      [-1.6, 1.4],
    ],
    0.09,
    "#1d6640",
  );
  // 3V3 rail spine along the top edge
  trace(
    [
      [-1.6, 1.4],
      [0.92, 1.4],
      [1.05, 1.52],
      [2.62, 1.52],
      [2.75, 1.4],
      [2.9, 1.3],
    ],
    0.065,
    "#1d6640",
  );
  // AVDD: LDO -> analogue islands
  trace(
    [
      [-1.95, -1.05],
      [-1.95, -1.2],
      [-2.3, -1.2],
      [-2.42, -1.05],
      [-2.42, -0.84],
    ],
    0.055,
  );
  trace(
    [
      [-1.8, -0.9],
      [-1.55, -0.9],
      [-1.5, -0.75],
      [-0.4, -0.75],
      [-0.2, -0.62],
      [1.5, -0.62],
      [1.62, -0.7],
    ],
    0.05,
  );
  // controls -> U1
  bus(
    [
      [-0.95, -0.42],
      [-0.95, -0.3],
      [-0.9, -0.28],
    ],
    2,
    0.07,
  );
  bus(
    [
      [0.75, -0.82],
      [0.75, -0.55],
      [0.62, -0.4],
      [0.5, -0.28],
    ],
    2,
    0.06,
  );
  // LEDs -> U1
  bus(
    [
      [1.35, -1.45],
      [1.35, -1.3],
      [1.2, -1.15],
      [0.95, -1.15],
      [0.82, -1.0],
      [0.82, -0.45],
      [0.7, -0.32],
      [0.6, -0.3],
    ],
    4,
    0.042,
  );
  // flash quad SPI + crystal
  bus(
    [
      [1.04, 1.1],
      [0.88, 1.1],
      [0.78, 1.0],
      [0.68, 1.0],
    ],
    4,
    0.048,
  );
  bus(
    [
      [0.99, 0.48],
      [0.85, 0.48],
      [0.76, 0.4],
      [0.68, 0.4],
    ],
    2,
    0.06,
  );
  // service header -> U1
  bus(
    [
      [1.72, 1.45],
      [1.6, 1.45],
      [1.5, 1.32],
      [0.9, 1.32],
      [0.78, 1.25],
      [0.68, 1.25],
    ],
    3,
    0.045,
  );

  // --- vias
  const via = (x: number, z: number, r = 0.035) => {
    const px = PX(x);
    const pz = PZ(z);
    const rr = r * S;
    g.fillStyle = "#caa24c";
    g.beginPath();
    g.arc(px, pz, rr, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#06170f";
    g.beginPath();
    g.arc(px, pz, rr * 0.45, 0, Math.PI * 2);
    g.fill();
  };
  const vr = rng(7781);
  for (let i = 0; i < 230; i++) {
    const x = (vr() - 0.5) * 6.2;
    const z = (vr() - 0.5) * 3.1;
    if (overlapsFoot(x, z, 0.02)) continue;
    via(x, z, 0.026 + vr() * 0.012);
  }
  // stitching vias along the edge
  for (let x = -3.05; x <= 3.05; x += 0.28) {
    via(x, 1.62, 0.03);
    via(x, -1.62, 0.03);
  }

  // --- serpentine matched-length meanders (high-speed differential audio & USB)
  const serpentine = (startX: number, startZ: number, len: number, turns: number, amp: number, alongX = true) => {
    g.strokeStyle = "#1b623d";
    g.lineWidth = 1.6;
    g.beginPath();
    let cx = startX;
    let cz = startZ;
    g.moveTo(PX(cx), PZ(cz));
    const step = len / (turns * 2);
    for (let i = 0; i < turns; i++) {
      if (alongX) {
        cz += amp;
        g.lineTo(PX(cx), PZ(cz));
        cx += step;
        g.lineTo(PX(cx), PZ(cz));
        cz -= amp * 2;
        g.lineTo(PX(cx), PZ(cz));
        cx += step;
        g.lineTo(PX(cx), PZ(cz));
        cz += amp;
        g.lineTo(PX(cx), PZ(cz));
      } else {
        cx += amp;
        g.lineTo(PX(cx), PZ(cz));
        cz += step;
        g.lineTo(PX(cx), PZ(cz));
        cx -= amp * 2;
        g.lineTo(PX(cx), PZ(cz));
        cz += step;
        g.lineTo(PX(cx), PZ(cz));
        cx += amp;
        g.lineTo(PX(cx), PZ(cz));
      }
    }
    g.stroke();
  };
  serpentine(-1.85, 0.28, 0.45, 3, 0.045, false);
  serpentine(1.25, -0.42, 0.4, 3, 0.04, true);

  // --- ESD spark-gap comb pattern on external interfaces (J1 & J3)
  const sparkGap = (x: number, z: number) => {
    const px = PX(x);
    const pz = PZ(z);
    g.strokeStyle = "#e0c068";
    g.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * 5;
      g.beginPath();
      g.moveTo(px + off, pz - 4);
      g.lineTo(px + off, pz - 1);
      g.stroke();
      g.beginPath();
      g.moveTo(px + off + 2.5, pz + 4);
      g.lineTo(px + off + 2.5, pz + 1);
      g.stroke();
    }
  };
  sparkGap(-2.0, -1.45);
  sparkGap(-2.7, -0.68);

  // --- antenna keepout hatched copper zone (next to module)
  const kx = PX(-0.6 - 1.275);
  const kz = PZ(0.6 - 0.85);
  const kw = 0.5 * S;
  const kh = 1.7 * (H / 3.4);
  g.fillStyle = "rgba(10, 36, 22, 0.6)";
  g.fillRect(kx - kw, kz, kw, kh);
  g.strokeStyle = "rgba(226, 232, 222, 0.25)";
  g.lineWidth = 1.2;
  g.strokeRect(kx - kw, kz, kw, kh);
  g.fillStyle = "rgba(226, 232, 222, 0.4)";
  g.font = "9px ui-monospace, monospace";
  g.textAlign = "center";
  g.fillText("RF NO-COPPER", kx - kw / 2, kz + kh / 2);

  // --- gold pads
  const pad = (x: number, z: number, w: number, d: number, r = 2) => {
    const px = PX(x) - (w / 6.6) * W * 0.5;
    const pz = PZ(z) - (d / 3.4) * H * 0.5;
    const pw = (w / 6.6) * W;
    const ph = (d / 3.4) * H;
    const grd = g.createLinearGradient(px, pz, px + pw, pz + ph);
    grd.addColorStop(0, "#e6c878");
    grd.addColorStop(1, "#b8913f");
    g.fillStyle = grd;
    g.beginPath();
    g.roundRect(px, pz, pw, ph, r);
    g.fill();
  };

  const silk = (x: number, z: number, w: number, d: number, lw = 1.6) => {
    g.strokeStyle = "rgba(226,232,222,0.72)";
    g.lineWidth = lw;
    g.strokeRect(PX(x - w / 2), PZ(z - d / 2), (w / 6.6) * W, (d / 3.4) * H);
  };

  const refText = (x: number, z: number, t: string, size = 15) => {
    g.fillStyle = "rgba(226,232,222,0.8)";
    g.font = `600 ${size}px ui-monospace, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(t, PX(x), PZ(z));
  };

  // footprints
  for (const f of FOOTS) {
    const pitchPads = (n: number, side: "x" | "z", len: number, off: number) => {
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * (len / Math.max(n, 1));
        if (side === "x") {
          pad(f.x + t, f.z + off, len / n / 2.1, 0.09, 1.5);
        } else {
          pad(f.x + off, f.z + t, 0.09, len / n / 2.1, 1.5);
        }
      }
    };
    if (f.kind === "qfn") {
      const n = Math.max(3, Math.round((f.pins ?? 16) / 4));
      pitchPads(n, "x", f.w * 0.92, -f.d / 2 - 0.02);
      pitchPads(n, "x", f.w * 0.92, f.d / 2 + 0.02);
      pitchPads(n, "z", f.d * 0.92, -f.w / 2 - 0.02);
      pitchPads(n, "z", f.d * 0.92, f.w / 2 + 0.02);
      pad(f.x, f.z, f.w * 0.5, f.d * 0.5, 2);
      silk(f.x, f.z, f.w + 0.16, f.d + 0.16, 1.4);
      g.fillStyle = "rgba(226,232,222,0.85)";
      g.beginPath();
      g.arc(PX(f.x - f.w / 2 - 0.11), PZ(f.z - f.d / 2 - 0.11), 3.2, 0, Math.PI * 2);
      g.fill();
      refText(f.x, f.z - f.d / 2 - 0.19, f.ref, 15);
    } else if (f.kind === "soic" || f.kind === "sot") {
      const n = Math.max(2, Math.floor((f.pins ?? 8) / 2));
      pitchPads(n, "x", f.w * 0.9, -f.d / 2 - 0.035);
      pitchPads(n, "x", f.w * 0.9, f.d / 2 + 0.035);
      silk(f.x, f.z, f.w + 0.06, f.d, 1.3);
      refText(f.x, f.z - f.d / 2 - 0.16, f.ref, 13);
    } else if (f.kind === "module") {
      // castellated edge pads
      const n = 15;
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * (f.w / (n + 0.5));
        pad(f.x + t, f.z - f.d / 2 + 0.035, 0.055, 0.12, 1);
        pad(f.x + t, f.z + f.d / 2 - 0.035, 0.055, 0.12, 1);
      }
      for (let i = 0; i < 9; i++) {
        const t = (i - 4) * (f.d / 10.5);
        pad(f.x - f.w / 2 + 0.035, f.z + t, 0.12, 0.055, 1);
      }
      silk(f.x, f.z, f.w + 0.08, f.d + 0.08, 2);
      refText(f.x - f.w / 2 + 0.22, f.z - f.d / 2 - 0.13, "U1", 17);
      g.fillStyle = "rgba(226,232,222,0.5)";
      g.font = "600 12px ui-monospace, monospace";
      g.textAlign = "left";
      g.fillText("ESP32-S3 / KEEP-OUT", PX(f.x - f.w / 2 + 0.5), PZ(f.z - f.d / 2 - 0.13));
    } else if (f.kind === "usbc") {
      pad(f.x, f.z + 0.12, f.w * 0.82, 0.12, 1.5);
      pad(f.x - f.w / 2 + 0.05, f.z, 0.12, f.d * 0.7, 2);
      pad(f.x + f.w / 2 - 0.05, f.z, 0.12, f.d * 0.7, 2);
      silk(f.x, f.z, f.w + 0.1, f.d, 1.6);
      refText(f.x + 0.72, f.z + 0.02, "J1", 14);
    } else if (f.kind === "conn" || f.kind === "hdr") {
      const n = f.pins ?? 4;
      const along = f.w > f.d ? "x" : "z";
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * ((along === "x" ? f.w : f.d) / (n + 0.4));
        if (along === "x") pad(f.x + t, f.z, 0.085, 0.085, 6);
        else pad(f.x, f.z + t, 0.085, 0.085, 6);
      }
      silk(f.x, f.z, f.w, f.d, 1.4);
      refText(f.x + (f.x > 0 ? -0.42 : 0.42), f.z + (f.d > f.w ? 0 : -0.22), f.ref, 14);
    } else if (f.kind === "sw") {
      const o = f.w / 2 - 0.05;
      pad(f.x - o, f.z - o, 0.16, 0.16, 3);
      pad(f.x + o, f.z - o, 0.16, 0.16, 3);
      pad(f.x - o, f.z + o, 0.16, 0.16, 3);
      pad(f.x + o, f.z + o, 0.16, 0.16, 3);
      silk(f.x, f.z, f.w, f.d, 1.6);
      refText(f.x, f.z + f.d / 2 + 0.17, f.ref, 14);
    } else if (f.kind === "mic") {
      pad(f.x, f.z, f.w * 0.75, f.d * 0.6, 3);
      silk(f.x, f.z, f.w + 0.06, f.d + 0.06, 1.3);
      refText(f.x - 0.38, f.z, f.ref, 13);
    } else {
      pad(f.x - f.w / 2 + 0.05, f.z, 0.12, f.d * 0.75, 2);
      pad(f.x + f.w / 2 - 0.05, f.z, 0.12, f.d * 0.75, 2);
      silk(f.x, f.z, f.w, f.d, 1.3);
      refText(f.x, f.z - f.d / 2 - 0.15, f.ref, 13);
    }
  }

  // passives pads + silk ticks
  for (const p of PASSIVES) {
    const w = p.rot ? p.d : p.w;
    const d = p.rot ? p.w : p.d;
    pad(p.x - w / 2, p.z, w * 0.5, d * 0.95, 1);
    pad(p.x + w / 2, p.z, w * 0.5, d * 0.95, 1);
  }

  // LEDs
  for (const l of LED_POS) {
    pad(l.x - 0.06, l.z, 0.06, 0.09, 1);
    pad(l.x + 0.06, l.z, 0.06, 0.09, 1);
  }
  refText(1.72, -1.6, "D2  D3  D4  D5", 13);

  // test points
  for (const [x, z, t] of TEST_POINTS) {
    const px = PX(x);
    const pz = PZ(z);
    g.fillStyle = "#e0bd6c";
    g.beginPath();
    g.arc(px, pz, 0.055 * S, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0d3524";
    g.beginPath();
    g.arc(px, pz, 0.02 * S, 0, Math.PI * 2);
    g.fill();
    refText(x, z + 0.14, t, 12);
  }

  // mounting holes
  for (const [x, z] of MOUNT_HOLES) {
    const px = PX(x);
    const pz = PZ(z);
    g.fillStyle = "#d8b463";
    g.beginPath();
    g.arc(px, pz, 0.2 * S, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#05120c";
    g.beginPath();
    g.arc(px, pz, 0.11 * S, 0, Math.PI * 2);
    g.fill();
  }

  // --- thermal via fields under the power / conversion devices
  for (const f of VIA_FIELDS) {
    const n = Math.round(Math.sqrt(f.n));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        via(f.x + (i - (n - 1) / 2) * (f.w / n), f.z + (j - (n - 1) / 2) * (f.d / n), 0.022);
      }
    }
  }

  // --- assembly fiducials
  for (const [fx, fz] of FIDUCIALS) {
    const px = PX(fx);
    const pz = PZ(fz);
    g.fillStyle = "#07160f";
    g.beginPath();
    g.arc(px, pz, 0.1 * S, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e3c67c";
    g.beginPath();
    g.arc(px, pz, 0.05 * S, 0, Math.PI * 2);
    g.fill();
  }

  // --- polarity / pin-1 silkscreen marks on the electrolytic-style bulk caps
  g.strokeStyle = "rgba(226,232,222,0.5)";
  g.lineWidth = 1.2;
  for (const p of PASSIVES) {
    if (p.kind !== "cbulk") continue;
    g.beginPath();
    g.moveTo(PX(p.x - 0.12), PZ(p.z - 0.085));
    g.lineTo(PX(p.x - 0.12), PZ(p.z + 0.085));
    g.stroke();
  }

  // --- board silkscreen text
  g.textAlign = "left";
  g.fillStyle = "rgba(226,232,222,0.78)";
  g.font = "700 20px ui-monospace, monospace";
  g.fillText("SHIELD-COM  ·  PCB-A  REV C", PX(-3.16), PZ(-1.18));
  g.font = "600 13px ui-monospace, monospace";
  g.fillStyle = "rgba(226,232,222,0.46)";
  g.fillText("4 LAYER · 1.6 mm · ENIG · IPC-A-610 CL2", PX(-3.16), PZ(-1.06));
  g.fillText("L1 SIG / L2 GND / L3 PWR / L4 SIG", PX(-3.16), PZ(-0.95));
  g.textAlign = "right";
  g.fillText("ANALOGUE IN", PX(-2.62), PZ(-1.62));
  g.textAlign = "left";
  g.fillText("ANALOGUE OUT", PX(2.32), PZ(-1.28));
  g.textAlign = "center";
  g.fillStyle = "rgba(226,232,222,0.34)";
  g.font = "600 12px ui-monospace, monospace";
  g.fillText("AGND ISLAND", PX(-2.24), PZ(-0.16));
  g.fillText("AGND ISLAND", PX(1.95), PZ(-1.4));
  g.fillText("PWR IN", PX(-2.78), PZ(1.52));
  g.fillText("DGND", PX(-0.6), PZ(-0.12));
  g.fillText("MIC PORT", PX(2.75), PZ(0.62));
  g.fillText("DO NOT POPULATE", PX(2.15), PZ(1.26));

  // --- 2D data-matrix style traceability label
  const dmX = PX(-0.18);
  const dmZ = PZ(-1.62);
  const dm = 0.26 * S;
  g.fillStyle = "rgba(226,232,222,0.72)";
  g.fillRect(dmX, dmZ, dm, dm);
  g.fillStyle = "#0d3524";
  const cells = 8;
  const rr = rng(4242);
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if (i === 0 || j === cells - 1) continue;
      if (rr() > 0.5) g.fillRect(dmX + (i * dm) / cells, dmZ + (j * dm) / cells, dm / cells, dm / cells);
    }
  }
  g.fillStyle = "rgba(226,232,222,0.45)";
  g.font = "600 11px ui-monospace, monospace";
  g.textAlign = "left";
  g.fillText("SN ______", PX(0.14), PZ(-1.5));
  g.fillText("YYWW", PX(0.14), PZ(-1.61));

  // layer numbers indicator block
  for (let l = 1; l <= 4; l++) {
    const lx = PX(3.15) - (5 - l) * 20;
    const lz = PZ(1.55);
    g.strokeStyle = "rgba(226,232,222,0.6)";
    g.lineWidth = 1.2;
    g.strokeRect(lx - 8, lz - 8, 16, 16);
    g.font = "bold 11px ui-monospace, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(226,232,222,0.75)";
    g.fillText(String(l), lx, lz);
  }

  // silk labels for prominent passives
  g.font = "9px ui-monospace, monospace";
  g.fillStyle = "rgba(226,232,222,0.45)";
  g.textAlign = "center";
  g.fillText("C12", PX(-2.5), PZ(0.35));
  g.fillText("C18", PX(-2.2), PZ(0.35));
  g.fillText("R8", PX(-1.7), PZ(0.85));
  g.fillText("C4", PX(-2.3), PZ(-1.28));
  g.fillText("C31", PX(1.1), PZ(0.1));
  g.fillText("R14", PX(1.3), PZ(0.1));
  g.fillText("FB1", PX(-2.0), PZ(-0.4));
  g.fillText("FB2", PX(1.55), PZ(-0.35));

  // keep-out dashed line between analogue / digital
  g.setLineDash([9, 7]);
  g.strokeStyle = "rgba(226,232,222,0.22)";
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(PX(-1.62), PZ(-1.66));
  g.lineTo(PX(-1.62), PZ(-0.05));
  g.stroke();
  g.beginPath();
  g.moveTo(PX(1.15), PZ(-1.66));
  g.lineTo(PX(1.15), PZ(0.05));
  g.stroke();
  g.setLineDash([]);

  return finish(c, 16);
}

/* --------------------------- PCB BOTTOM --------------------------- */
export function makePcbBottomTexture(): THREE.CanvasTexture {
  const W = 990;
  const H = 510;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = "#0e3826";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#12432c";
  g.fillRect(12, 12, W - 24, H - 24);
  const r = rng(991);
  g.fillStyle = "#caa24c";
  for (let i = 0; i < 400; i++) {
    const x = r() * W;
    const y = r() * H;
    g.beginPath();
    g.arc(x, y, 2 + r() * 1.6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(226,232,222,0.5)";
  g.font = "600 18px ui-monospace, monospace";
  g.textAlign = "center";
  g.fillText("SHIELD-COM  MOD-SC1   ·   MADE FOR FIELD SERVICE", W / 2, H / 2);
  return finish(c);
}

/* ---------------------------- LID ETCH ---------------------------- */
export function makeLidTexture(): THREE.CanvasTexture {
  const W = 1560;
  const H = 880;
  const { c, g } = makeCanvas(W, H);
  const PX = (x: number) => ((x + 3.9) / 7.8) * W;
  const PZ = (z: number) => ((z + 2.2) / 4.4) * H;

  g.clearRect(0, 0, W, H);

  // recessed control-panel zone (machined pocket shading)
  const px0 = PX(-1.95);
  const pz0 = PZ(-1.95);
  const pw = PX(2.7) - px0;
  const ph = PZ(-0.2) - pz0;
  g.fillStyle = "rgba(0,0,0,0.42)";
  g.beginPath();
  g.roundRect(px0, pz0, pw, ph, 22);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.08)";
  g.lineWidth = 3;
  g.stroke();
  g.strokeStyle = "rgba(0,0,0,0.5)";
  g.lineWidth = 6;
  g.beginPath();
  g.roundRect(px0 + 5, pz0 + 5, pw - 10, ph - 10, 18);
  g.stroke();

  const etch = (t: string, x: number, z: number, size: number, alpha = 0.72, weight = 600, spacing = 2) => {
    g.save();
    g.font = `${weight} ${size}px ui-monospace, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.letterSpacing = `${spacing}px`;
    g.fillStyle = `rgba(232,238,232,${alpha})`;
    g.shadowColor = "rgba(0,0,0,0.85)";
    g.shadowBlur = 2;
    g.shadowOffsetY = 1.5;
    g.fillText(t, PX(x), PZ(z));
    g.restore();
  };

  etch("SHIELD-COM", -0.7, 0.62, 58, 0.82, 700, 7);
  etch("INLINE AUDIO INTELLIGENCE MODULE", -0.7, 1.06, 17, 0.42, 500, 5);
  etch("MOD-SC1", -3.05, 1.72, 14, 0.35, 500, 3);
  etch("78 × 44 × 19 mm", 2.95, 1.78, 13, 0.3, 500, 2);
  etch("MARK", 0.75, -0.55, 15, 0.62, 600, 3);
  etch("SOS", -0.95, -0.3, 15, 0.62, 600, 3);
  etch("SERVICE", -2.35, -1.28, 11, 0.3, 500, 2);
  etch("IP67 · CE · FCC · NO USER-SERVICEABLE RF", 0.6, 1.72, 11, 0.28, 500, 2);
  etch("VENT", 2.95, 1.45, 10, 0.3, 500, 2);
  etch("HOLD 1.2 s", -0.95, -1.88, 9, 0.35, 500, 1.5);
  etch("TAP", 0.75, -1.88, 9, 0.35, 500, 1.5);

  // LED tick labels, above each light-pipe window
  for (const l of LED_POS) etch(l.label, l.x, l.z + 0.36, 11, 0.5, 600, 1.5);

  // IN / OUT arrows
  g.save();
  g.strokeStyle = "rgba(232,238,232,0.42)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(PX(-3.62), PZ(-0.95));
  g.lineTo(PX(-3.15), PZ(-0.95));
  g.stroke();
  g.beginPath();
  g.moveTo(PX(-3.15), PZ(-0.95));
  g.lineTo(PX(-3.3), PZ(-1.06));
  g.lineTo(PX(-3.3), PZ(-0.84));
  g.closePath();
  g.fillStyle = "rgba(232,238,232,0.42)";
  g.fill();
  g.beginPath();
  g.moveTo(PX(3.15), PZ(-0.95));
  g.lineTo(PX(3.62), PZ(-0.95));
  g.stroke();
  g.beginPath();
  g.moveTo(PX(3.62), PZ(-0.95));
  g.lineTo(PX(3.47), PZ(-1.06));
  g.lineTo(PX(3.47), PZ(-0.84));
  g.closePath();
  g.fill();
  g.restore();
  etch("IN", -3.42, -0.66, 13, 0.45, 600, 2);
  etch("OUT", 3.42, -0.66, 13, 0.45, 600, 2);

  // fine machined seam lines
  g.strokeStyle = "rgba(255,255,255,0.05)";
  g.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const y = (i / 90) * H;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }

  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 16;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* --------------------------- misc maps ---------------------------- */
export function makeBrushedRoughness(): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = "#9a9a9a";
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {
    const y = Math.random() * H;
    const v = 120 + Math.random() * 110;
    g.strokeStyle = `rgba(${v},${v},${v},0.16)`;
    g.lineWidth = Math.random() * 1.7;
    g.beginPath();
    g.moveTo(Math.random() * W, y);
    g.lineTo(Math.random() * W, y + (Math.random() - 0.5) * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.anisotropy = 8;
  return t;
}

export function makeBraidTexture(): THREE.CanvasTexture {
  const W = 256;
  const H = 256;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = "#23261f";
  g.fillRect(0, 0, W, H);
  const cell = 32;
  for (let y = 0; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      const up = ((x / cell + y / cell) | 0) % 2 === 0;
      g.save();
      g.translate(x + cell / 2, y + cell / 2);
      g.rotate(up ? Math.PI / 4 : -Math.PI / 4);
      const grd = g.createLinearGradient(0, -cell / 2, 0, cell / 2);
      grd.addColorStop(0, "#161811");
      grd.addColorStop(0.5, "#3c4232");
      grd.addColorStop(1, "#161811");
      g.fillStyle = grd;
      g.fillRect(-cell * 0.78, -cell * 0.30, cell * 1.56, cell * 0.60);
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeMeshTexture(): THREE.CanvasTexture {
  const S = 128;
  const { c, g } = makeCanvas(S, S);
  g.fillStyle = "#0a0c0b";
  g.fillRect(0, 0, S, S);
  g.fillStyle = "#3b423c";
  for (let y = 4; y < S; y += 9) {
    for (let x = 4; x < S; x += 9) {
      g.beginPath();
      g.arc(x + (y % 18 ? 4.5 : 0), y, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeCapTexture(label: string, color = "rgba(255,255,255,0.86)", bg = "transparent"): THREE.CanvasTexture {
  const W = 256;
  const H = 200;
  const { c, g } = makeCanvas(W, H);
  if (bg !== "transparent") {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
  }
  g.font = `800 ${label.length > 3 ? 44 : 68}px ui-monospace, monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.letterSpacing = "4px";
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.fillText(label, W / 2, H / 2 + 3);
  g.fillStyle = color;
  g.fillText(label, W / 2, H / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* -------------------- LIVE DUAL-BAND RADIO LCD -------------------- */
export interface LcdModel {
  power: boolean;
  band: "A" | "B";
  mode: "VFO" | "MR";
  freqA: number;
  freqB: number;
  chA: number;
  chB: number;
  ptt: boolean;
  monitor: boolean;
  alarm: boolean;
  scan: boolean;
  keylock: boolean;
  menu: number | null;
  entry: string;
  volume: number;
  menuItems: string[];
  menuValues: string[];
}

export class RadioLcd {
  readonly canvas: HTMLCanvasElement;
  readonly g: CanvasRenderingContext2D;
  readonly texture: THREE.CanvasTexture;
  readonly W = 512;
  readonly H = 300;

  constructor() {
    const { c, g } = makeCanvas(this.W, this.H);
    this.canvas = c;
    this.g = g;
    this.texture = new THREE.CanvasTexture(c);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  draw(s: LcdModel, blink: boolean) {
    const { g, W, H } = this;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.textBaseline = "alphabetic";
    g.letterSpacing = "0px";

    if (!s.power) {
      g.fillStyle = "#0a1220";
      g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,0.03)";
      g.font = "900 60px ui-monospace, monospace";
      g.fillText("888.888", 70, 118);
      g.fillText("888.888", 70, 236);
      this.texture.needsUpdate = true;
      return;
    }

    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0e3f8a");
    bg.addColorStop(0.5, "#175cb8");
    bg.addColorStop(1, "#0b3472");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(0,0,0,0.11)";
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H);
    g.strokeStyle = "rgba(0,0,0,0.45)";
    g.lineWidth = 6;
    g.strokeRect(3, 3, W - 6, H - 6);

    const ink = "rgba(238,246,255,0.96)";
    const dim = "rgba(238,246,255,0.32)";
    const tag = (t: string, x: number, y: number, on: boolean, invert = false) => {
      g.font = "bold 14px ui-monospace, monospace";
      g.textAlign = "left";
      const w = g.measureText(t).width + 10;
      if (on && invert) {
        g.fillStyle = ink;
        g.beginPath();
        g.roundRect(x - 5, y - 14, w, 19, 3);
        g.fill();
        g.fillStyle = "#0e3f8a";
      } else {
        g.fillStyle = on ? ink : dim;
      }
      g.fillText(t, x, y);
      return x + w + 8;
    };

    // ---- status row
    let x = 22;
    x = tag(s.mode, x, 30, true);
    x = tag("TDR", x, 30, true);
    x = tag("SCAN", x, 30, s.scan && blink);
    x = tag("N", x, 30, true);
    x = tag("TX", x, 30, s.ptt, true);
    x = tag("MON", x, 30, s.monitor, true);
    tag("ALARM", x, 30, s.alarm && blink, true);

    // padlock
    g.strokeStyle = s.keylock ? ink : dim;
    g.fillStyle = s.keylock ? ink : dim;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(W - 96, 20, 6, Math.PI, 0);
    g.stroke();
    g.fillRect(W - 104, 20, 16, 12);

    // battery
    g.strokeStyle = ink;
    g.fillStyle = ink;
    g.lineWidth = 2;
    g.strokeRect(W - 66, 14, 36, 17);
    g.fillRect(W - 30, 19, 3, 8);
    g.fillRect(W - 63, 17, 8, 11);
    g.fillRect(W - 52, 17, 8, 11);
    g.fillRect(W - 41, 17, 8, 11);

    // ---- band rows
    const row = (band: "A" | "B", y: number) => {
      const active = s.band === band;
      const f = band === "A" ? s.freqA : s.freqB;
      const ch = band === "A" ? s.chA : s.chB;
      g.fillStyle = active ? ink : dim;
      // pointer
      if (active) {
        g.beginPath();
        g.moveTo(20, y - 46);
        g.lineTo(38, y - 34);
        g.lineTo(20, y - 22);
        g.closePath();
        g.fill();
      }
      g.font = "bold 13px ui-monospace, monospace";
      g.textAlign = "left";
      g.fillText(band, 48, y - 44);
      g.font = "11px ui-monospace, monospace";
      g.fillText(f < 300 ? "VHF" : "UHF", 46, y - 28);

      // signal meter
      const bars = s.ptt && active ? 6 : s.monitor && active ? 4 : active ? 2 : 1;
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i < bars ? ink : dim;
        g.fillRect(46 + i * 7, y - 16, 5, 4 + i * 2);
      }

      // main digits
      g.fillStyle = active ? ink : dim;
      g.font = "900 56px ui-monospace, monospace";
      g.letterSpacing = "2px";
      let text: string;
      if (active && s.entry && s.menu === null) {
        const e = s.entry.padEnd(6, "_");
        text = `${e.slice(0, 3)}.${e.slice(3)}`;
        if (blink) text = text.replace("_", "▁");
      } else if (s.mode === "MR") {
        text = `CH-${String(ch).padStart(3, "0")}`;
      } else {
        text = f.toFixed(3);
      }
      g.fillText(text, 96, y);
      g.letterSpacing = "0px";

      // right column
      g.font = "bold 16px ui-monospace, monospace";
      g.textAlign = "right";
      g.fillText(s.mode === "MR" ? f.toFixed(3) : String(ch).padStart(3, "0"), W - 24, y - 30);
      g.font = "bold 13px ui-monospace, monospace";
      g.fillText(band === "A" ? "H  W" : "L  N", W - 24, y - 8);
      g.textAlign = "left";
    };

    row("A", 118);

    g.strokeStyle = "rgba(255,255,255,0.22)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(20, 152);
    g.lineTo(W - 20, 152);
    g.stroke();

    if (s.menu !== null) {
      const i = s.menu;
      g.fillStyle = ink;
      g.font = "bold 14px ui-monospace, monospace";
      g.fillText("MENU", 48, 186);
      g.font = "900 56px ui-monospace, monospace";
      g.fillText(String(i).padStart(2, "0"), 96, 236);
      g.font = "900 30px ui-monospace, monospace";
      g.fillText(s.menuItems[i] ?? "", 200, 224);
      g.font = "bold 16px ui-monospace, monospace";
      g.fillText(s.menuValues[i] ?? "", 200, 250);
      g.font = "bold 12px ui-monospace, monospace";
      g.fillStyle = dim;
      g.fillText("▲▼ SELECT · MENU CONFIRM · EXIT", 48, 276);
    } else {
      row("B", 236);
      g.font = "bold 12px ui-monospace, monospace";
      g.fillStyle = dim;
      g.textAlign = "left";
      g.fillText(`CTCSS 67.0   STEP 25K   VOL ${s.volume}   SQL 3`, 48, 276);
    }

    this.texture.needsUpdate = true;
  }
}

/* ------------------------ cached key labels ------------------------ */
const LABELS = new Map<string, THREE.CanvasTexture>();
export function makeKeyLabel(main: string, sub = "", color = "#eef2f2", subColor = "#95a7a3", size = 46): THREE.CanvasTexture {
  const key = [main, sub, color, subColor, size].join("|");
  const hit = LABELS.get(key);
  if (hit) return hit;
  const W = 192;
  const H = 128;
  const { c, g } = makeCanvas(W, H);
  g.clearRect(0, 0, W, H);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.letterSpacing = "1px";
  g.fillStyle = color;
  if (sub) {
    g.font = `800 ${size}px ui-monospace, monospace`;
    g.fillText(main, W / 2, H / 2 - 16);
    g.fillStyle = subColor;
    g.font = "700 22px ui-monospace, monospace";
    g.fillText(sub, W / 2, H / 2 + 32);
  } else {
    g.font = `800 ${Math.round(size * 0.85)}px ui-monospace, monospace`;
    g.fillText(main, W / 2, H / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  LABELS.set(key, t);
  return t;
}

/* -------------------- ESP32-S3 EMBOSSED SHIELD CAN -------------------- */
export function makeEsp32ShieldTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 360;
  const { c, g } = makeCanvas(W, H);

  // Stamped nickel-silver matte can base
  g.fillStyle = "#ccd4d6";
  g.fillRect(0, 0, W, H);

  // Brushed finish lines
  g.strokeStyle = "rgba(255,255,255,0.25)";
  g.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * H;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }

  // Dark laser etching
  g.fillStyle = "rgba(40, 48, 50, 0.85)";
  g.textAlign = "left";

  // Espressif Logo Star
  g.save();
  g.translate(50, 52);
  g.fillStyle = "#1e2224";
  g.beginPath();
  g.arc(0, 0, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ccd4d6";
  g.beginPath();
  g.arc(0, 0, 6, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.fillStyle = "rgba(35, 42, 44, 0.9)";
  g.font = "900 24px ui-monospace, monospace";
  g.fillText("ESPRESSIF", 82, 60);

  g.font = "800 28px ui-monospace, monospace";
  g.fillText("ESP32-S3", 46, 112);

  g.font = "600 18px ui-monospace, monospace";
  g.fillText("WROOM-1-N16R8", 46, 142);

  g.font = "500 13px ui-monospace, monospace";
  g.fillStyle = "rgba(60, 68, 70, 0.85)";
  g.fillText("FCC ID: 2AC7Z-ESPS3WROOM1", 46, 192);
  g.fillText("IC: 21098-ESPS3WROOM1", 46, 214);
  g.fillText("CMIIT ID: 2021DP8888", 46, 236);

  // QR Code on right
  const qrX = W - 140;
  const qrY = 40;
  const qrS = 96;
  g.fillStyle = "rgba(35, 42, 44, 0.92)";
  g.fillRect(qrX, qrY, qrS, qrS);
  g.fillStyle = "#ccd4d6";
  const cells = 7;
  const cs = qrS / cells;
  for (let r = 0; r < cells; r++) {
    for (let col = 0; col < cells; col++) {
      if ((r + col) % 2 === 0 && !(r < 2 && col < 2)) {
        g.fillRect(qrX + col * cs, qrY + r * cs, cs, cs);
      }
    }
  }

  // CE Mark
  g.font = "bold 28px ui-monospace, monospace";
  g.fillStyle = "rgba(40, 48, 50, 0.85)";
  g.fillText("CE", W - 110, 210);

  // Pin 1 dot
  g.fillStyle = "rgba(30, 36, 38, 0.9)";
  g.beginPath();
  g.arc(W - 45, H - 45, 12, 0, Math.PI * 2);
  g.fill();

  return finish(c, 8);
}
