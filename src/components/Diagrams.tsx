type Kind = "io" | "proc" | "audio" | "power" | "mem" | "accent" | "ghost";

const KIND: Record<Kind, { c: string; fill: string }> = {
  io: { c: "#8fa268", fill: "#0d1210" },
  proc: { c: "#4fd1e0", fill: "#0b1214" },
  audio: { c: "#63b3ed", fill: "#0b1114" },
  power: { c: "#f0a93b", fill: "#12100b" },
  mem: { c: "#c084fc", fill: "#100d14" },
  accent: { c: "#f0a93b", fill: "#0e1213" },
  ghost: { c: "#6b7574", fill: "transparent" },
};

export interface DNode {
  x: number;
  y: number;
  w: number;
  h: number;
  t: string[];
  s?: string;
  kind?: Kind;
  chips?: string[];
  dashed?: boolean;
}

export interface DLink {
  d: string;
  color?: string;
  label?: { x: number; y: number; t: string; anchor?: "start" | "middle" | "end" };
  both?: boolean;
  delay?: number;
}

function Node({ n }: { n: DNode }) {
  const k = KIND[n.kind ?? "proc"];
  const titleY = n.y + (n.s ? 26 : n.h / 2 + 4);
  return (
    <g>
      <rect
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        rx={3}
        fill={k.fill}
        stroke={k.c}
        strokeOpacity={n.dashed ? 0.35 : 0.5}
        strokeWidth={1}
        strokeDasharray={n.dashed ? "5 5" : undefined}
      />
      {!n.dashed && <rect x={n.x} y={n.y} width={n.w} height={2} fill={k.c} opacity={0.75} />}
      {n.t.map((line, i) => (
        <text
          key={i}
          x={n.x + 12}
          y={titleY + i * 15}
          fill="#dbe3e0"
          fontSize={11.5}
          fontFamily="ui-monospace, monospace"
          letterSpacing="1.2"
        >
          {line}
        </text>
      ))}
      {n.s && (
        <text
          x={n.x + 12}
          y={titleY + n.t.length * 15 + 4}
          fill="#8b9693"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.4"
        >
          {n.s}
        </text>
      )}
      {n.chips?.map((c, i) => {
        const cw = (n.w - 30) / 2;
        const cx = n.x + 12 + (i % 2) * (cw + 6);
        const cy = n.y + n.h - 62 + Math.floor(i / 2) * 28;
        return (
          <g key={c}>
            <rect x={cx} y={cy} width={cw} height={22} rx={2} fill="#0a0f10" stroke={k.c} strokeOpacity={0.3} />
            <text x={cx + cw / 2} y={cy + 15} fill="#aab6b3" fontSize={9.5} fontFamily="ui-monospace, monospace" textAnchor="middle" letterSpacing="0.6">
              {c}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Link({ l }: { l: DLink }) {
  const color = l.color ?? "#4fd1e0";
  const marker = color === "#f0a93b" ? "url(#ar-a)" : color === "#8fa268" ? "url(#ar-o)" : "url(#ar-c)";
  return (
    <g>
      <path d={l.d} fill="none" stroke="#5c6a68" strokeOpacity={0.45} strokeWidth={1.2} markerEnd={marker} markerStart={l.both ? marker : undefined} />
      <path
        d={l.d}
        fill="none"
        stroke={color}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        className="flow-line"
        style={{ animationDelay: `${l.delay ?? 0}s` }}
      />
      {l.label && (
        <text
          x={l.label.x}
          y={l.label.y}
          fill="#7d8886"
          fontSize={9.5}
          fontFamily="ui-monospace, monospace"
          letterSpacing="1"
          textAnchor={l.label.anchor ?? "middle"}
        >
          {l.label.t}
        </text>
      )}
    </g>
  );
}

export function Diagram({
  nodes,
  links,
  viewBox,
  steps,
  className = "",
}: {
  nodes: DNode[];
  links: DLink[];
  viewBox: string;
  steps: { t: string; s?: string; c?: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <svg viewBox={viewBox} className="hidden h-auto w-full md:block" role="img">
        <defs>
          {[
            ["ar-c", "#4fd1e0"],
            ["ar-a", "#f0a93b"],
            ["ar-o", "#8fa268"],
          ].map(([id, c]) => (
            <marker key={id} id={id} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={c} opacity={0.9} />
            </marker>
          ))}
        </defs>
        {links.map((l, i) => (
          <Link key={i} l={l} />
        ))}
        {nodes.map((n, i) => (
          <Node key={i} n={n} />
        ))}
      </svg>

      {/* stacked equivalent for small screens */}
      <ol className="space-y-1.5 md:hidden">
        {steps.map((s, i) => (
          <li key={i} className="relative rounded-sm border border-graphite-700 bg-graphite-900/60 p-2.5 pl-9">
            <span
              className="absolute left-2.5 top-3 h-2 w-2 rounded-full"
              style={{ background: s.c ?? "#4fd1e0", boxShadow: `0 0 10px ${s.c ?? "#4fd1e0"}55` }}
            />
            <div className="font-mono text-[11px] tracking-widest text-graphite-200">{s.t}</div>
            {s.s && <div className="mt-0.5 font-mono text-[10px] text-graphite-500">{s.s}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* OVERVIEW — radio → SHIELD-COM → radio                              */
/* ----------------------------------------------------------------- */
export function OverviewDiagram() {
  const nodes: DNode[] = [
    { x: 10, y: 52, w: 268, h: 116, t: ["HOST FIELD RADIO"], s: "the set the operator already carries", kind: "io" },
    {
      x: 430,
      y: 30,
      w: 340,
      h: 160,
      t: ["SHIELD-COM"],
      s: "inline voice cleaning + audio intelligence",
      kind: "accent",
      chips: ["AUDIO ADC", "ESP32-S3 DSP", "BUFFER + EVENTS", "AUDIO DAC"],
    },
    { x: 922, y: 52, w: 288, h: 116, t: ["HOST RADIO AUDIO", "INTERFACE / ACCESSORY"], s: "cleaned voice returned", kind: "io" },
    { x: 430, y: 206, w: 340, h: 34, t: ["NO RF · NO ANTENNA · NO CHANNEL CONTROL"], kind: "ghost", dashed: true },
  ];
  const links: DLink[] = [
    { d: "M278,110 H424", color: "#8fa268", label: { x: 351, y: 98, t: "AUDIO IN · SHIELDED" } },
    { d: "M770,110 H916", color: "#8fa268", label: { x: 843, y: 98, t: "AUDIO OUT · SHIELDED" }, delay: 1.2 },
  ];
  const steps = [
    { t: "HOST FIELD RADIO", s: "RF stays entirely with the radio", c: "#8fa268" },
    { t: "SHIELD-COM", s: "ADC → ESP32-S3 pipeline → DAC", c: "#f0a93b" },
    { t: "RADIO AUDIO INTERFACE / ACCESSORY", s: "cleaned voice returned", c: "#8fa268" },
  ];
  return <Diagram nodes={nodes} links={links} viewBox="0 0 1220 250" steps={steps} />;
}

/* ----------------------------------------------------------------- */
/* SIGNAL CHAIN                                                       */
/* ----------------------------------------------------------------- */
export function SignalDiagram() {
  const nodes: DNode[] = [
    { x: 8, y: 120, w: 140, h: 84, t: ["RADIO / MIC", "AUDIO IN"], s: "accessory path", kind: "io" },
    { x: 164, y: 120, w: 128, h: 84, t: ["PROTECTED", "INPUT"], s: "TVS · series R", kind: "audio" },
    { x: 308, y: 120, w: 128, h: 84, t: ["ANALOGUE", "FILTER"], s: "RC · CM choke", kind: "audio" },
    { x: 452, y: 120, w: 140, h: 84, t: ["AUDIO ADC", "U2 · QFN-16"], s: "24-bit → I²S", kind: "audio" },
    {
      x: 608,
      y: 62,
      w: 280,
      h: 200,
      t: ["ESP32-S3", "VOICE PIPELINE"],
      s: "U1 · dual core, 240 MHz",
      kind: "proc",
      chips: ["NOISE SUPPRESSION", "AGC / LEVEL", "VOICE ACTIVITY", "POP + CLICK"],
    },
    { x: 904, y: 120, w: 136, h: 84, t: ["BUFFER +", "EVENT LOGIC"], s: "MARK ring · SOS", kind: "proc" },
    { x: 1056, y: 120, w: 136, h: 84, t: ["AUDIO DAC", "U3 + DRIVER"], s: "pop/click ramped", kind: "audio" },
    { x: 1208, y: 120, w: 104, h: 84, t: ["PROTECTED", "OUTPUT"], s: "to host", kind: "io" },
    { x: 452, y: 268, w: 140, h: 52, t: ["MEMS PAIR"], s: "MK1 / MK2 · PDM", kind: "audio" },
    { x: 904, y: 268, w: 136, h: 52, t: ["NOR FLASH U4"], s: "MARK clips", kind: "mem" },
  ];
  const links: DLink[] = [
    { d: "M148,162 H158", color: "#8fa268" },
    { d: "M292,162 H302", color: "#63b3ed" },
    { d: "M436,162 H446", color: "#63b3ed" },
    { d: "M592,162 H602", color: "#63b3ed", label: { x: 597, y: 150, t: "I²S" } },
    { d: "M888,162 H898", color: "#4fd1e0" },
    { d: "M1040,162 H1050", color: "#4fd1e0", label: { x: 1045, y: 150, t: "I²S" } },
    { d: "M1192,162 H1202", color: "#8fa268" },
    { d: "M592,294 H600 V240 H602", color: "#63b3ed", label: { x: 560, y: 262, t: "PDM", anchor: "end" } },
    { d: "M972,268 V208", color: "#c084fc", both: true, label: { x: 1030, y: 246, t: "CLIP STORE", anchor: "end" } },
  ];
  const steps = [
    { t: "RADIO / MIC AUDIO IN", s: "from the host accessory path", c: "#8fa268" },
    { t: "PROTECTED INPUT", s: "TVS + series protection", c: "#63b3ed" },
    { t: "ANALOGUE FILTER", s: "RC anti-alias, common mode", c: "#63b3ed" },
    { t: "AUDIO ADC · U2", s: "24-bit conversion → I²S", c: "#63b3ed" },
    { t: "ESP32-S3 VOICE PIPELINE", s: "suppression · AGC · VAD · pop/click", c: "#4fd1e0" },
    { t: "BUFFER + EVENT LOGIC", s: "MARK ring buffer, SOS events", c: "#4fd1e0" },
    { t: "AUDIO DAC · U3 + DRIVER", s: "ramped enable, soft mute", c: "#63b3ed" },
    { t: "PROTECTED AUDIO OUTPUT", s: "back to the host radio path", c: "#8fa268" },
  ];
  return <Diagram nodes={nodes} links={links} viewBox="0 0 1324 332" steps={steps} />;
}

/* ----------------------------------------------------------------- */
/* POWER CHAIN                                                        */
/* ----------------------------------------------------------------- */
export function PowerDiagram() {
  const nodes: DNode[] = [
    { x: 8, y: 40, w: 140, h: 100, t: ["USB-C 5 V"], s: "charge · service", kind: "power" },
    { x: 176, y: 40, w: 120, h: 100, t: ["ESD / TVS"], s: "D1 array", kind: "power" },
    { x: 332, y: 40, w: 180, h: 100, t: ["CHARGER +", "POWER PATH"], s: "U5 · 1 A, folded", kind: "power" },
    { x: 548, y: 40, w: 160, h: 100, t: ["BUCK 3V3"], s: "U6 + L1 · 2.2 MHz", kind: "power" },
    { x: 744, y: 40, w: 170, h: 100, t: ["LOW-NOISE LDO"], s: "U7 · 3.0 V AVDD", kind: "power" },
    { x: 332, y: 190, w: 180, h: 86, t: ["CELL PROTECTION"], s: "U8 · OV/UV/OC/SC", kind: "power" },
    { x: 548, y: 190, w: 160, h: 86, t: ["Li-ion 1S CELL"], s: "BT1 + pack PCM", kind: "power" },
    { x: 960, y: 8, w: 352, h: 74, t: ["DIGITAL PROCESSOR"], s: "U1 · flash · logic — 3V3", kind: "proc" },
    { x: 960, y: 100, w: 352, h: 74, t: ["AUDIO CHAIN"], s: "U2 · U3 · front end — AVDD", kind: "audio" },
    { x: 960, y: 192, w: 352, h: 74, t: ["STATUS LEDS + CONTROL LOGIC"], s: "3V3, current limited", kind: "io" },
  ];
  const links: DLink[] = [
    { d: "M148,90 H170", color: "#f0a93b" },
    { d: "M296,90 H326", color: "#f0a93b" },
    { d: "M512,90 H542", color: "#f0a93b" },
    { d: "M708,90 H738", color: "#f0a93b", delay: 0.6 },
    { d: "M548,233 H518", color: "#f0a93b" },
    { d: "M422,190 V146", color: "#f0a93b", both: true, label: { x: 436, y: 172, t: "CHARGE / DISCHARGE", anchor: "start" } },
    { d: "M708,90 H726 V45 H954", color: "#4fd1e0", delay: 0.3 },
    { d: "M914,137 H954", color: "#63b3ed", delay: 0.9 },
    { d: "M708,90 H726 V229 H954", color: "#8fa268", delay: 1.4 },
  ];
  const steps = [
    { t: "USB-C 5 V INPUT", s: "charge and service, ESD clamped", c: "#f0a93b" },
    { t: "CELL PROTECTION", s: "U8 — OV / UV / OC / SC", c: "#f0a93b" },
    { t: "CHARGER + POWER PATH", s: "U5 — cell or USB, seamless", c: "#f0a93b" },
    { t: "BUCK 3V3", s: "U6 + L1, switching out of band", c: "#f0a93b" },
    { t: "LOW-NOISE LDO 3V0", s: "U7 — analogue island only", c: "#f0a93b" },
    { t: "LOADS", s: "processor · audio chain · status LEDs", c: "#4fd1e0" },
  ];
  return <Diagram nodes={nodes} links={links} viewBox="0 0 1324 290" steps={steps} />;
}
