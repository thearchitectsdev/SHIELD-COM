import PptxGenJS from "pptxgenjs";
import {
  CHAIN,
  FEASIBILITY,
  HONESTY,
  IMPACT,
  IMPACT_GAPS,
  INTERFACES,
  PROBLEM,
  PS,
  RAILS,
  REF_GAPS,
  REFERENCES,
  SCALE,
  SOLUTION,
  STACK,
  TEAM,
  VIABILITY_GAPS,
  WHY_FEASIBLE,
} from "@/data/sih";

/* ==================================================================
 * SHIELD-COM · SIH26052 — real .pptx generator
 *
 * Six slides, exact SIH idea-submission order. 16:9. Editable shapes
 * and text (not images), so the team can fill NEEDS INPUT fields
 * directly in PowerPoint / Google Slides.
 * ================================================================== */

const C = {
  bg: "080A0B",
  panel: "111517",
  panel2: "161B1D",
  line: "26302F",
  text: "DFE6E4",
  dim: "8D9A97",
  faint: "5F6B69",
  cyan: "4FD1E0",
  amber: "F0A93B",
  green: "7EE787",
  red: "D8453C",
  blue: "63B3ED",
  white: "FFFFFF",
};

const MONO = "Consolas";
const SANS = "Segoe UI";

type Pptx = InstanceType<typeof PptxGenJS>;
type Slide = ReturnType<Pptx["addSlide"]>;

const STATUS_COLOR: Record<string, string> = {
  BUILT: C.green,
  "IN DEVELOPMENT": C.cyan,
  "DESIGN TARGET": C.amber,
  PLANNED: C.blue,
  "NEEDS INPUT": C.red,
};

/* ------------------------------ helpers ------------------------------ */

/** dark page background + faint grid feel */
function base(s: Slide) {
  s.background = { color: C.bg };
}

/** thin rule */
function rule(s: Slide, x: number, y: number, w: number, color = C.line) {
  s.addShape("rect", { x, y, w, h: 0.012, fill: { color } });
}

/** panel card */
function panel(s: Slide, x: number, y: number, w: number, h: number, opts?: { border?: string; fill?: string }) {
  s.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: opts?.fill ?? C.panel },
    line: { color: opts?.border ?? C.line, width: 0.75 },
  });
}

/** mono label */
function label(s: Slide, t: string, x: number, y: number, w: number, color = C.faint, size = 7.5) {
  s.addText(t, {
    x,
    y,
    w,
    h: 0.2,
    fontFace: MONO,
    fontSize: size,
    color,
    charSpacing: 1.6,
    valign: "middle",
  });
}

/** status chip */
function chip(s: Slide, status: string, x: number, y: number, w = 1.25) {
  const col = STATUS_COLOR[status] ?? C.faint;
  s.addShape("roundRect", {
    x,
    y,
    w,
    h: 0.2,
    rectRadius: 0.02,
    fill: { color: C.bg },
    line: { color: col, width: 0.75 },
  });
  s.addText(status, {
    x,
    y,
    w,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: col,
    align: "center",
    valign: "middle",
    charSpacing: 1.2,
  });
}

/** standard slide header used on slides 2–6 */
function header(s: Slide, n: number, eyebrow: string, title: string) {
  base(s);
  s.addText(eyebrow, {
    x: 0.5,
    y: 0.3,
    w: 8,
    h: 0.22,
    fontFace: MONO,
    fontSize: 9,
    color: C.cyan,
    charSpacing: 3,
  });
  s.addText(title, {
    x: 0.5,
    y: 0.52,
    w: 9.4,
    h: 0.42,
    fontFace: SANS,
    fontSize: 21,
    bold: true,
    color: C.text,
  });
  s.addText(`SHIELD-COM · MOD-SC1   |   ${PS.id}`, {
    x: 10.2,
    y: 0.3,
    w: 2.6,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7.5,
    color: C.faint,
    align: "right",
    charSpacing: 1.2,
  });
  s.addText(String(n).padStart(2, "0"), {
    x: 12.15,
    y: 0.5,
    w: 0.7,
    h: 0.4,
    fontFace: SANS,
    fontSize: 20,
    bold: true,
    color: C.amber,
    align: "right",
  });
  rule(s, 0.5, 1.02, 12.33);
  // footer
  rule(s, 0.5, 6.95, 12.33);
  s.addText("SMART INDIA HACKATHON · IDEA PRESENTATION", {
    x: 0.5,
    y: 7.0,
    w: 6,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.6,
  });
  s.addText(PS.edition.toUpperCase(), {
    x: 8.5,
    y: 7.0,
    w: 4.33,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    align: "right",
    charSpacing: 1.6,
  });
}

/** bullet list inside a region */
function bullets(
  s: Slide,
  items: string[],
  x: number,
  y: number,
  w: number,
  opts?: { color?: string; bullet?: string; size?: number; lineH?: number },
) {
  const size = opts?.size ?? 9;
  const lh = opts?.lineH ?? 0.205;
  items.forEach((t, i) => {
    s.addText(
      [
        { text: `${opts?.bullet ?? "·"}  `, options: { color: opts?.color ?? C.cyan, fontFace: MONO, fontSize: size } },
        { text: t, options: { color: C.dim, fontFace: SANS, fontSize: size } },
      ],
      { x, y: y + i * lh, w, h: lh, valign: "top" },
    );
  });
}

/** arrow-connected flow row */
function flow(
  s: Slide,
  items: { title: string; ref?: string; detail?: string; spec?: string }[],
  x: number,
  y: number,
  totalW: number,
  h = 0.86,
) {
  const gap = 0.22;
  const bw = (totalW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const bx = x + i * (bw + gap);
    panel(s, bx, y, bw, h);
    s.addText(it.ref ?? `0${i + 1}`, {
      x: bx + 0.1,
      y: y + 0.06,
      w: bw - 0.2,
      h: 0.16,
      fontFace: MONO,
      fontSize: 7,
      color: C.cyan,
      charSpacing: 1.2,
    });
    s.addText(it.title, {
      x: bx + 0.1,
      y: y + 0.21,
      w: bw - 0.2,
      h: 0.2,
      fontFace: SANS,
      fontSize: 10,
      bold: true,
      color: C.text,
    });
    if (it.detail) {
      s.addText(it.detail, {
        x: bx + 0.1,
        y: y + 0.4,
        w: bw - 0.2,
        h: 0.3,
        fontFace: SANS,
        fontSize: 7.5,
        color: C.dim,
        valign: "top",
      });
    }
    if (it.spec) {
      s.addText(it.spec, {
        x: bx + 0.1,
        y: y + h - 0.2,
        w: bw - 0.2,
        h: 0.16,
        fontFace: MONO,
        fontSize: 6.5,
        color: C.faint,
      });
    }
    if (i < items.length - 1) {
      s.addText("→", {
        x: bx + bw,
        y: y + h / 2 - 0.12,
        w: gap,
        h: 0.24,
        fontFace: SANS,
        fontSize: 13,
        color: C.cyan,
        align: "center",
        valign: "middle",
      });
    }
  });
}

/** SHIELD-COM product + host radio, drawn as native shapes */
function productMark(s: Slide, x: number, y: number, scale = 1) {
  const S = (v: number) => v * scale;
  // enclosure
  s.addShape("roundRect", {
    x: x + S(0.1),
    y: y + S(0.45),
    w: S(2.1),
    h: S(0.86),
    rectRadius: 0.05,
    fill: { color: C.panel2 },
    line: { color: C.line, width: 1 },
  });
  // lid band
  s.addShape("rect", {
    x: x + S(0.1),
    y: y + S(0.45),
    w: S(2.1),
    h: S(0.17),
    fill: { color: "1D2325" },
    line: { color: C.line, width: 0.5 },
  });
  // SOS guard + cap
  s.addShape("rect", {
    x: x + S(0.22),
    y: y + S(0.74),
    w: S(0.52),
    h: S(0.4),
    fill: { color: C.bg },
    line: { color: C.red, width: 1 },
  });
  s.addShape("roundRect", {
    x: x + S(0.28),
    y: y + S(0.8),
    w: S(0.4),
    h: S(0.27),
    rectRadius: 0.1,
    fill: { color: C.red },
    line: { color: "7A2A22", width: 1 },
  });
  s.addText("SOS", {
    x: x + S(0.28),
    y: y + S(0.8),
    w: S(0.4),
    h: S(0.27),
    fontFace: MONO,
    fontSize: 6 * scale,
    color: C.white,
    align: "center",
    valign: "middle",
  });
  // MARK
  s.addShape("ellipse", {
    x: x + S(0.85),
    y: y + S(0.8),
    w: S(0.27),
    h: S(0.27),
    fill: { color: "454F36" },
    line: { color: "2C3323", width: 1 },
  });
  s.addText("MK", {
    x: x + S(0.85),
    y: y + S(0.8),
    w: S(0.27),
    h: S(0.27),
    fontFace: MONO,
    fontSize: 5 * scale,
    color: "C9D2C4",
    align: "center",
    valign: "middle",
  });
  // LEDs
  [C.green, C.cyan, C.red, C.amber].forEach((col, i) => {
    s.addShape("ellipse", {
      x: x + S(1.35 + i * 0.17),
      y: y + S(0.88),
      w: S(0.1),
      h: S(0.1),
      fill: { color: col },
      line: { color: col, width: 0.5 },
    });
  });
  s.addText("PWR   PRC   SOS   MRK", {
    x: x + S(1.28),
    y: y + S(1.0),
    w: S(0.95),
    h: S(0.14),
    fontFace: MONO,
    fontSize: 4.6 * scale,
    color: C.faint,
    align: "center",
  });
  // cables — drawn as thin filled bars so they render identically everywhere
  s.addShape("rect", {
    x: x,
    y: y + S(0.93),
    w: S(0.1),
    h: S(0.05),
    fill: { color: "6A7159" },
    line: { color: "6A7159", width: 0.25 },
  });
  s.addShape("rect", {
    x: x + S(2.2),
    y: y + S(0.78),
    w: S(0.62),
    h: S(0.05),
    fill: { color: "6A7159" },
    line: { color: "6A7159", width: 0.25 },
  });
  // host radio — standing, antenna + knob on TOP
  const rx = x + S(2.82);
  const ry = y + S(0.1);
  s.addShape("roundRect", {
    x: rx,
    y: ry + S(0.34),
    w: S(0.78),
    h: S(1.36),
    rectRadius: 0.08,
    fill: { color: "1A1C1E" },
    line: { color: C.line, width: 1 },
  });
  // LCD
  s.addShape("rect", {
    x: rx + S(0.1),
    y: ry + S(0.46),
    w: S(0.58),
    h: S(0.28),
    fill: { color: "1557B0" },
    line: { color: "0D2A5C", width: 0.5 },
  });
  // keypad
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      s.addShape("rect", {
        x: rx + S(0.12 + c * 0.19),
        y: ry + S(0.84 + r * 0.16),
        w: S(0.15),
        h: S(0.12),
        fill: { color: "2A2E30" },
        line: { color: "1A1C1E", width: 0.3 },
      });
    }
  }
  // antenna — stands UP from the top end of the standing radio
  s.addShape("rect", {
    x: rx + S(0.13),
    y: ry,
    w: S(0.06),
    h: S(0.34),
    fill: { color: "17191A" },
    line: { color: "17191A", width: 0.25 },
  });
  s.addShape("rect", {
    x: rx + S(0.1),
    y: ry + S(0.25),
    w: S(0.13),
    h: S(0.12),
    fill: { color: "C89D38" },
    line: { color: "A67F28", width: 0.4 },
  });
  // knob (top)
  s.addShape("ellipse", {
    x: rx + S(0.5),
    y: ry + S(0.18),
    w: S(0.2),
    h: S(0.2),
    fill: { color: "1E2124" },
    line: { color: "3A4143", width: 1 },
  });
  s.addText("HOST RADIO   →   SHIELD-COM   →   HOST RADIO", {
    x,
    y: y + S(1.82),
    w: S(3.9),
    h: S(0.18),
    fontFace: MONO,
    fontSize: 6.5 * scale,
    color: C.faint,
    align: "center",
    charSpacing: 1.2,
  });
}



/* =============================== SLIDES =============================== */

function slide1(p: Pptx) {
  const s = p.addSlide();
  base(s);

  s.addShape("ellipse", { x: 0.5, y: 0.62, w: 0.1, h: 0.1, fill: { color: C.cyan } });
  s.addText(`SMART INDIA HACKATHON · ${PS.edition.toUpperCase()}`, {
    x: 0.72,
    y: 0.58,
    w: 6,
    h: 0.22,
    fontFace: MONO,
    fontSize: 9,
    color: C.cyan,
    charSpacing: 3,
  });

  s.addText(
    [
      { text: "SHIELD", options: { color: C.text } },
      { text: "-", options: { color: C.amber } },
      { text: "COM", options: { color: C.text } },
    ],
    { x: 0.5, y: 0.95, w: 7, h: 0.95, fontFace: SANS, fontSize: 48, bold: true },
  );
  s.addText("An inline voice-intelligibility module for radio communication in loud field environments.", {
    x: 0.52,
    y: 1.88,
    w: 6.9,
    h: 0.5,
    fontFace: SANS,
    fontSize: 13.5,
    color: C.dim,
  });

  // fact table
  const rows: [string, string, boolean][] = [
    ["Problem statement ID", PS.id, false],
    ["Problem statement title", PS.title, true],
    ["Theme", PS.theme, true],
    ["Ministry / organisation", PS.org, true],
  ];
  rows.forEach(([k, v, need], i) => {
    const y = 2.52 + i * 0.36;
    panel(s, 0.5, y, 6.9, 0.33);
    label(s, k, 0.62, y + 0.06, 2.1);
    s.addText(v, {
      x: 2.8,
      y: y + 0.05,
      w: 4.5,
      h: 0.24,
      fontFace: need ? MONO : SANS,
      fontSize: 9,
      color: need ? C.red : C.text,
      valign: "middle",
    });
  });

  // status chips
  chip(s, "BUILT", 0.5, 4.12, 0.85);
  s.addText("3D engineering model + interactive demo", {
    x: 1.42,
    y: 4.12,
    w: 3,
    h: 0.2,
    fontFace: SANS,
    fontSize: 8.5,
    color: C.dim,
    valign: "middle",
  });
  chip(s, "IN DEVELOPMENT", 4.45, 4.12, 1.35);
  s.addText("voice-cleaning firmware", {
    x: 5.88,
    y: 4.12,
    w: 2,
    h: 0.2,
    fontFace: SANS,
    fontSize: 8.5,
    color: C.dim,
    valign: "middle",
  });

  // right column
  panel(s, 7.75, 0.55, 5.1, 6.1);
  productMark(s, 8.05, 0.75, 1.15);
  rule(s, 8.0, 3.1, 4.6);

  label(s, `TEAM · ${TEAM.name}`, 8.0, 3.2, 4.6, C.faint, 8);
  TEAM.members.forEach(([n, d], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 8.0 + col * 2.35;
    const y = 3.48 + row * 0.44;
    s.addText(`${i + 1}. ${n}`, {
      x,
      y,
      w: 2.2,
      h: 0.18,
      fontFace: MONO,
      fontSize: 8.5,
      color: C.red,
    });
    s.addText(d, { x, y: y + 0.17, w: 2.2, h: 0.16, fontFace: MONO, fontSize: 6.8, color: C.faint });
  });

  rule(s, 8.0, 4.92, 4.6);
  const meta: [string, string][] = [
    ["INSTITUTE", TEAM.institute],
    ["TEAM LEADER", TEAM.leader],
    ["MENTOR", TEAM.mentor],
  ];
  meta.forEach(([k, v], i) => {
    const y = 5.05 + i * 0.3;
    s.addText(k, { x: 8.0, y, w: 1.3, h: 0.2, fontFace: MONO, fontSize: 7, color: C.faint, charSpacing: 1.2 });
    s.addText(v, { x: 9.3, y, w: 3.3, h: 0.2, fontFace: MONO, fontSize: 8, color: C.red });
  });

  rule(s, 8.0, 6.05, 4.6);
  s.addText("Live 3D model, interactive teardown and audio demo available on the project site.", {
    x: 8.0,
    y: 6.16,
    w: 4.6,
    h: 0.38,
    fontFace: SANS,
    fontSize: 8,
    color: C.dim,
  });

  rule(s, 0.5, 6.95, 12.33);
  s.addText("SLIDE 01 / 06", {
    x: 0.5,
    y: 7.0,
    w: 4,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.6,
  });
  s.addText("IDEA PRESENTATION", {
    x: 8.5,
    y: 7.0,
    w: 4.33,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    align: "right",
    charSpacing: 1.6,
  });
}

function slide2(p: Pptx) {
  const s = p.addSlide();
  header(s, 2, "PROPOSED SOLUTION", "Fix the voice on the path that already exists");

  /* ---- left column ---- */
  // problem headline
  s.addShape("rect", { x: 0.5, y: 1.2, w: 0.05, h: 0.78, fill: { color: C.amber } });
  s.addShape("rect", { x: 0.55, y: 1.2, w: 6.45, h: 0.78, fill: { color: "1A1611" }, line: { color: "1A1611", width: 0 } });
  s.addText(PROBLEM.headline, {
    x: 0.68,
    y: 1.26,
    w: 6.2,
    h: 0.26,
    fontFace: SANS,
    fontSize: 12,
    bold: true,
    color: C.text,
  });
  s.addText(PROBLEM.consequence, {
    x: 0.68,
    y: 1.53,
    w: 6.2,
    h: 0.4,
    fontFace: SANS,
    fontSize: 8.5,
    color: C.dim,
    valign: "top",
  });

  // causes
  label(s, "WHY IT HAPPENS", 0.5, 2.1, 4);
  PROBLEM.causes.forEach((c, i) => {
    const w = 1.62;
    s.addShape("roundRect", {
      x: 0.5 + i * (w + 0.1),
      y: 2.33,
      w,
      h: 0.26,
      rectRadius: 0.02,
      fill: { color: C.panel },
      line: { color: C.line, width: 0.6 },
    });
    s.addText(c, {
      x: 0.5 + i * (w + 0.1),
      y: 2.33,
      w,
      h: 0.26,
      fontFace: SANS,
      fontSize: 7.6,
      color: C.dim,
      align: "center",
      valign: "middle",
    });
  });

  // today
  panel(s, 0.5, 2.72, 6.5, 1.5);
  label(s, "WHAT PEOPLE DO TODAY — AND WHY IT IS NOT ENOUGH", 0.65, 2.8, 6.2);
  bullets(s, PROBLEM.today, 0.65, 3.04, 6.2, { color: C.red, bullet: "—", size: 8.6, lineH: 0.29 });
  rule(s, 0.65, 3.93, 6.2);
  s.addText(PROBLEM.gap, {
    x: 0.65,
    y: 3.99,
    w: 6.2,
    h: 0.2,
    fontFace: SANS,
    fontSize: 9.5,
    bold: true,
    color: C.text,
  });

  // insert / step out flow
  label(s, "SIGNAL PATH · THE MODULE INSERTS ITSELF, THEN STEPS BACK OUT", 0.5, 4.38, 6.5);
  flow(
    s,
    [
      { title: "Host radio", ref: "EXISTING", detail: "Operator's own set, unchanged" },
      { title: "SHIELD-COM", ref: "MOD-SC1", detail: "Cleans voice, manages level" },
      { title: "Accessory", ref: "EXISTING", detail: "Handed back untouched" },
    ],
    0.5,
    4.6,
    6.5,
    0.8,
  );

  // product
  panel(s, 0.5, 5.56, 6.5, 1.28);
  productMark(s, 1.85, 5.58, 0.92);

  /* ---- right column ---- */
  // one-liner
  s.addShape("rect", { x: 7.3, y: 1.2, w: 5.53, h: 0.82, fill: { color: "0E2428" }, line: { color: "2A6672", width: 0.75 } });
  label(s, "THE SOLUTION IN ONE LINE", 7.45, 1.26, 5.2, C.cyan);
  s.addText(SOLUTION.oneLiner, {
    x: 7.45,
    y: 1.46,
    w: 5.25,
    h: 0.5,
    fontFace: SANS,
    fontSize: 9.5,
    color: C.text,
    valign: "top",
  });

  // does / does not
  panel(s, 7.3, 2.14, 2.68, 1.52, { border: "3C6B45", fill: "0D1610" });
  label(s, "IT DOES", 7.44, 2.2, 2.4, C.green);
  bullets(s, SOLUTION.does, 7.44, 2.42, 2.45, { color: C.green, size: 8.2, lineH: 0.22 });

  panel(s, 10.15, 2.14, 2.68, 1.52, { border: "6B3430", fill: "16100F" });
  label(s, "IT DOES NOT", 10.29, 2.2, 2.4, C.red);
  bullets(s, SOLUTION.doesNot, 10.29, 2.42, 2.45, { color: C.red, size: 8.2, lineH: 0.22 });

  // differentiators
  panel(s, 7.3, 3.78, 5.53, 3.06);
  label(s, "WHAT IS DIFFERENT ABOUT IT", 7.45, 3.86, 5.2);
  SOLUTION.differentiators.forEach(([t, d], i) => {
    const y = 4.1 + i * 0.55;
    s.addText(t, { x: 7.45, y, w: 5.2, h: 0.2, fontFace: SANS, fontSize: 9.5, bold: true, color: C.amber });
    s.addText(d, { x: 7.45, y: y + 0.19, w: 5.2, h: 0.32, fontFace: SANS, fontSize: 8.2, color: C.dim, valign: "top" });
  });
}

function slide3(p: Pptx) {
  const s = p.addSlide();
  header(s, 3, "TECHNICAL APPROACH", "Analogue in, digital processing, analogue out — kept apart on purpose");

  flow(s, CHAIN, 0.5, 1.2, 12.33, 0.98);

  /* left */
  panel(s, 0.5, 2.36, 6.55, 2.62);
  label(s, "HARDWARE STACK · ALL CATALOGUE PARTS", 0.65, 2.44, 6.2);
  STACK.forEach((it, i) => {
    const y = 2.68 + i * 0.245;
    s.addText(it.label, { x: 0.65, y, w: 1.25, h: 0.2, fontFace: MONO, fontSize: 7.8, color: C.cyan, valign: "top" });
    s.addText(it.value, {
      x: 1.92,
      y,
      w: it.status ? 3.25 : 5.0,
      h: 0.23,
      fontFace: SANS,
      fontSize: 7.8,
      color: C.dim,
      valign: "top",
    });
    if (it.status) chip(s, it.status, 5.72, y, 1.2);
  });

  panel(s, 0.5, 5.08, 6.55, 1.76);
  label(s, "POWER RAILS · ANALOGUE KEPT SEPARATE FROM DIGITAL", 0.65, 5.16, 6.2);
  RAILS.forEach(([n, v, d], i) => {
    const y = 5.42 + i * 0.33;
    s.addText(n, { x: 0.65, y, w: 0.65, h: 0.2, fontFace: MONO, fontSize: 9, color: C.amber });
    s.addText(v, { x: 1.32, y, w: 1.0, h: 0.2, fontFace: MONO, fontSize: 8, color: C.text });
    s.addText(d, { x: 2.38, y, w: 4.5, h: 0.2, fontFace: SANS, fontSize: 8, color: C.faint });
  });

  /* right */
  panel(s, 7.3, 2.36, 5.53, 1.98);
  label(s, "INTERFACES", 7.45, 2.44, 5.2);
  INTERFACES.forEach(([k, v], i) => {
    const y = 2.68 + i * 0.225;
    s.addText(k, { x: 7.45, y, w: 1.15, h: 0.2, fontFace: MONO, fontSize: 7.8, color: C.cyan });
    s.addText(v, { x: 8.62, y, w: 4.1, h: 0.2, fontFace: SANS, fontSize: 7.8, color: C.dim });
  });

  panel(s, 7.3, 4.44, 5.53, 1.56);
  label(s, "BOARD PRACTICE", 7.45, 4.52, 5.2);
  bullets(
    s,
    [
      "Analogue island on its own low-noise rail, behind its own shield can",
      "Shielded RF module with a no-copper keep-out at the board edge",
      "ESD spark-gap combs at both external connectors",
      "Thermal via fields under every power and conversion device",
      "Gold test points TP1–TP8 on every rail plus audio in / out",
    ],
    7.45,
    4.74,
    5.2,
    { size: 8, lineH: 0.235 },
  );

  panel(s, 7.3, 6.1, 5.53, 0.74, { border: "6B3430", fill: "16100F" });
  chip(s, "IN DEVELOPMENT", 7.45, 6.18, 1.35);
  s.addText("VOICE PIPELINE", {
    x: 8.9,
    y: 6.18,
    w: 2,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.4,
    valign: "middle",
  });
  s.addText(
    "Model, board layout and demo UI are built. The voice-cleaning firmware on U1 is not finished — we are not claiming measured performance for it.",
    { x: 7.45, y: 6.42, w: 5.2, h: 0.38, fontFace: SANS, fontSize: 8, color: C.dim, valign: "top" },
  );
}

function slide4(p: Pptx) {
  const s = p.addSlide();
  header(s, 4, "FEASIBILITY & VIABILITY", "What is built, what is left, and what we will not claim");

  const tone: Record<string, { b: string; f: string }> = {
    BUILT: { b: "3C6B45", f: "0D1610" },
    "IN DEVELOPMENT": { b: "2A6672", f: "0C1A1D" },
    "DESIGN TARGET": { b: "6E5527", f: "17130C" },
    PLANNED: { b: "35536E", f: "0C1219" },
  };

  FEASIBILITY.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.33;
    const y = 1.2 + row * 1.76;
    const t = tone[f.status] ?? { b: C.line, f: C.panel };
    panel(s, x, y, 6.0, 1.6, { border: t.b, fill: t.f });
    chip(s, f.status, x + 0.14, y + 0.12, 1.35);
    s.addText(f.title, {
      x: x + 1.58,
      y: y + 0.12,
      w: 4.3,
      h: 0.2,
      fontFace: SANS,
      fontSize: 9.5,
      bold: true,
      color: C.text,
      valign: "middle",
    });
    bullets(s, f.items, x + 0.16, y + 0.4, 5.7, {
      color: STATUS_COLOR[f.status],
      size: 8,
      lineH: f.items.length > 4 ? 0.225 : 0.26,
    });
  });

  // why feasible
  panel(s, 0.5, 4.78, 6.0, 2.06);
  label(s, "WHY IT IS BUILDABLE", 0.65, 4.86, 5.7);
  bullets(s, WHY_FEASIBLE, 0.65, 5.1, 5.7, { color: C.green, size: 8.2, lineH: 0.32 });
  rule(s, 0.65, 6.42, 5.7);
  s.addText(HONESTY, {
    x: 0.65,
    y: 6.5,
    w: 5.7,
    h: 0.3,
    fontFace: SANS,
    fontSize: 8.2,
    italic: true,
    color: C.amber,
    valign: "top",
  });

  // open questions
  panel(s, 6.83, 4.78, 6.0, 2.06, { border: "6B3430", fill: "16100F" });
  chip(s, "NEEDS INPUT", 6.97, 4.86, 1.2);
  s.addText("NOT YET ANSWERED — WE WILL NOT GUESS THESE", {
    x: 8.27,
    y: 4.86,
    w: 4.4,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.2,
    valign: "middle",
  });
  VIABILITY_GAPS.forEach(([k], i) => {
    const y = 5.16 + i * 0.3;
    s.addText("·", { x: 6.97, y, w: 0.15, h: 0.2, fontFace: MONO, fontSize: 9, color: C.red });
    s.addText(k, { x: 7.14, y, w: 4.5, h: 0.2, fontFace: SANS, fontSize: 8.4, color: C.dim, valign: "middle" });
    s.addText("OPEN", {
      x: 11.9,
      y,
      w: 0.8,
      h: 0.2,
      fontFace: MONO,
      fontSize: 7,
      color: C.red,
      align: "right",
      valign: "middle",
    });
  });
}

function slide5(p: Pptx) {
  const s = p.addSlide();
  header(s, 5, "IMPACT & BENEFITS", "Capability added to inventory that is already in service");

  /* left: who benefits */
  IMPACT.forEach((r, i) => {
    const y = 1.2 + i * 0.64;
    panel(s, 0.5, y, 7.2, 0.58);
    s.addText(r.who.toUpperCase(), {
      x: 0.64,
      y: y + 0.07,
      w: 1.5,
      h: 0.2,
      fontFace: MONO,
      fontSize: 7.4,
      color: C.cyan,
      charSpacing: 1.2,
    });
    s.addText(r.benefit, {
      x: 2.2,
      y: y + 0.06,
      w: 5.3,
      h: 0.2,
      fontFace: SANS,
      fontSize: 10,
      bold: true,
      color: C.text,
    });
    s.addText(r.detail, {
      x: 2.2,
      y: y + 0.26,
      w: 5.35,
      h: 0.28,
      fontFace: SANS,
      fontSize: 8,
      color: C.dim,
      valign: "top",
    });
  });

  // scaling
  panel(s, 0.5, 4.44, 7.2, 1.42);
  label(s, "SCALING — ONE BOARD, SEVERAL USERS", 0.64, 4.52, 6.9);
  SCALE.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.64 + col * 3.55;
    const y = 4.76 + row * 0.52;
    s.addText(k, { x, y, w: 3.4, h: 0.18, fontFace: SANS, fontSize: 8.6, bold: true, color: C.amber });
    s.addText(v, { x, y: y + 0.17, w: 3.4, h: 0.32, fontFace: SANS, fontSize: 7.6, color: C.dim, valign: "top" });
  });

  // benefit chain
  panel(s, 0.5, 5.96, 7.2, 0.88);
  label(s, "BENEFIT CHAIN", 0.64, 6.02, 6.9);
  const chainSteps = [
    ["Noise reaches the mic", "rotor, wind, vehicles"],
    ["Voice is separated", "reference mic + suppression on U1"],
    ["Level is held", "automatic, no operator action"],
    ["The far end hears words", "not a shout buried in wash"],
  ];
  chainSteps.forEach(([a, b], i) => {
    const x = 0.64 + i * 1.78;
    s.addText(`${i + 1}  ${a}`, { x, y: 6.26, w: 1.62, h: 0.2, fontFace: SANS, fontSize: 8.4, bold: true, color: C.text });
    s.addText(b, { x: x + 0.16, y: 6.46, w: 1.5, h: 0.3, fontFace: SANS, fontSize: 7.2, color: C.faint, valign: "top" });
    if (i < 3) {
      s.addText("→", { x: x + 1.6, y: 6.28, w: 0.2, h: 0.2, fontFace: SANS, fontSize: 11, color: C.cyan });
    }
  });

  /* right: honest gaps */
  panel(s, 7.95, 1.2, 4.88, 2.7, { border: "6B3430", fill: "16100F" });
  chip(s, "NEEDS INPUT", 8.1, 1.3, 1.2);
  s.addText("IMPACT NUMBERS WE OWE THE JURY", {
    x: 9.4,
    y: 1.3,
    w: 3.3,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.1,
    valign: "middle",
  });
  IMPACT_GAPS.forEach(([k], i) => {
    const y = 1.62 + i * 0.32;
    s.addText("·", { x: 8.1, y, w: 0.15, h: 0.2, fontFace: MONO, fontSize: 9, color: C.red });
    s.addText(k, { x: 8.28, y, w: 3.5, h: 0.2, fontFace: SANS, fontSize: 8.4, color: C.dim, valign: "middle" });
    s.addText("OPEN", { x: 11.9, y, w: 0.8, h: 0.2, fontFace: MONO, fontSize: 7, color: C.red, align: "right", valign: "middle" });
  });
  rule(s, 8.1, 3.32, 4.58);
  s.addText(
    "Every number on this list needs hardware before it can be written down. We would rather show the gap than invent a figure.",
    { x: 8.1, y: 3.42, w: 4.58, h: 0.42, fontFace: SANS, fontSize: 8.2, color: C.dim, valign: "top" },
  );

  // product visual
  panel(s, 7.95, 4.0, 4.88, 2.84);
  productMark(s, 8.2, 4.55, 1.1);
  s.addText("Two controls. Four indicators. Nothing else to find in the dark.", {
    x: 8.2,
    y: 6.42,
    w: 4.4,
    h: 0.3,
    fontFace: SANS,
    fontSize: 8.4,
    color: C.dim,
    align: "center",
  });
}

function slide6(p: Pptx) {
  const s = p.addSlide();
  header(s, 6, "RESEARCH & REFERENCES", "Standards we are designing to, and the methods we will measure with");

  // reference table
  panel(s, 0.5, 1.2, 7.55, 5.64);
  const cols = [0.65, 2.3, 6.15];
  ["REFERENCE", "TITLE", "WHY IT MATTERS HERE"].forEach((h, i) => {
    s.addText(h, {
      x: cols[i],
      y: 1.3,
      w: i === 2 ? 1.78 : i === 1 ? 3.7 : 1.5,
      h: 0.2,
      fontFace: MONO,
      fontSize: 6.8,
      color: C.faint,
      charSpacing: 1.2,
    });
  });
  rule(s, 0.65, 1.52, 7.25);
  REFERENCES.forEach(([ref, title, why], i) => {
    const y = 1.62 + i * 0.57;
    s.addText(ref, { x: cols[0], y, w: 1.55, h: 0.44, fontFace: MONO, fontSize: 8, color: C.amber, valign: "top" });
    s.addText(title, { x: cols[1], y, w: 3.75, h: 0.44, fontFace: SANS, fontSize: 8, color: C.text, valign: "top" });
    s.addText(why, { x: cols[2], y, w: 1.78, h: 0.48, fontFace: SANS, fontSize: 7.2, color: C.dim, valign: "top" });
    if (i < REFERENCES.length - 1) rule(s, 0.65, y + 0.5, 7.25, "1D2523");
  });

  // method
  panel(s, 8.35, 1.2, 4.48, 2.28);
  label(s, "METHOD WE WILL REPORT AGAINST", 8.5, 1.28, 4.2);
  const methods: [string, string][] = [
    ["Intelligibility", "subjective scoring per ITU-T P.800 against recorded field noise"],
    ["Objective quality", "POLQA (ITU-T P.863) on the processed output"],
    ["Environment", "MIL-STD-810H style drop and vibration test planning"],
    ["Interfaces", "IEC 61000-4-2 ESD on USB-C and both audio connectors"],
    ["Sealing", "IEC 60529 IP code verification against the IP67 target"],
  ];
  methods.forEach(([k, v], i) => {
    const y = 1.52 + i * 0.37;
    s.addText(
      [
        { text: "·  ", options: { color: C.cyan, fontFace: MONO, fontSize: 8 } },
        { text: `${k} `, options: { color: C.text, fontFace: SANS, fontSize: 8, bold: true } },
        { text: `— ${v}`, options: { color: C.dim, fontFace: SANS, fontSize: 8 } },
      ],
      { x: 8.5, y, w: 4.2, h: 0.34, valign: "top" },
    );
  });

  // refs still to add
  panel(s, 8.35, 3.6, 4.48, 1.86, { border: "6B3430", fill: "16100F" });
  chip(s, "NEEDS INPUT", 8.5, 3.7, 1.2);
  s.addText("REFERENCES STILL TO ADD", {
    x: 9.8,
    y: 3.7,
    w: 2.9,
    h: 0.2,
    fontFace: MONO,
    fontSize: 7,
    color: C.faint,
    charSpacing: 1.1,
    valign: "middle",
  });
  REF_GAPS.forEach(([k], i) => {
    const y = 4.0 + i * 0.36;
    s.addText("·", { x: 8.5, y, w: 0.15, h: 0.2, fontFace: MONO, fontSize: 9, color: C.red });
    s.addText(k, { x: 8.68, y, w: 4.0, h: 0.34, fontFace: SANS, fontSize: 8, color: C.dim, valign: "top" });
  });
  rule(s, 8.5, 5.12, 4.18);
  s.addText(
    'No dataset was supplied with the problem statement. Where live field data needs permission, we will say so plainly rather than call a synthetic set "real".',
    { x: 8.5, y: 5.2, w: 4.18, h: 0.4, fontFace: SANS, fontSize: 7.6, color: C.dim, valign: "top" },
  );

  // live link
  panel(s, 8.35, 5.58, 4.48, 1.26);
  label(s, "LIVE MODEL & DEMO", 8.5, 5.68, 4.2);
  s.addText("NEEDS INPUT — deployed link + 2–3 min walkthrough recording", {
    x: 8.5,
    y: 5.92,
    w: 4.2,
    h: 0.4,
    fontFace: MONO,
    fontSize: 8,
    color: C.red,
    valign: "top",
  });
  s.addText("Interactive teardown · exploded assembly · populated PCB · live audio chain", {
    x: 8.5,
    y: 6.36,
    w: 4.2,
    h: 0.38,
    fontFace: SANS,
    fontSize: 7.6,
    color: C.faint,
    valign: "top",
  });
}

/* ------------------------------ export ------------------------------ */
export async function downloadPptx() {
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in, 16:9
  p.author = "SHIELD-COM";
  p.company = TEAM.institute;
  p.subject = `${PS.id} — SHIELD-COM idea submission`;
  p.title = `SHIELD-COM · ${PS.id}`;

  slide1(p);
  slide2(p);
  slide3(p);
  slide4(p);
  slide5(p);
  slide6(p);

  await p.writeFile({ fileName: `SHIELD-COM_${PS.id}_SIH-Idea-Submission.pptx` });
}
