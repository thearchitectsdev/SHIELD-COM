import { useEffect, useRef, useState } from "react";
import heroImg from "@/assets/hero-studio.jpg";
import fieldImg from "@/assets/field-use.jpg";
import { OverviewDiagram, PowerDiagram, SignalDiagram } from "@/components/Diagrams";
import { requestViewer } from "@/components/Viewer";
import {
  CLAIM_GROUPS,
  ENG_COMPONENTS,
  ENG_INTERFACES,
  ENG_MATERIALS,
  ENG_RAILS,
  ENG_SERVICE,
  ENV_CONCEPTS,
  FIELD_POINTS,
  PCB_CARDS,
  STORY,
} from "@/data/content";
import { cn } from "@/utils/cn";

/* ----------------------------- primitives ----------------------------- */
export function Eyebrow({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "amber" | "olive" }) {
  const c = tone === "amber" ? "text-amber-glow border-amber-glow/30" : tone === "olive" ? "text-olive-400 border-olive-500/30" : "text-cyan-tech border-cyan-tech/30";
  return <span className={cn("mono-label inline-flex items-center gap-2 border-l-2 pl-2", c)}>{children}</span>;
}

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "cyan",
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  tone?: "cyan" | "amber" | "olive";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={cn("relative scroll-mt-16 border-t border-graphite-800 px-5 py-16 md:px-8 md:py-24", className)}>
      <div className={cn("mx-auto max-w-[1400px]", seen && "rise")}>
        <header className="mb-8 max-w-3xl md:mb-12">
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
          <h2 className="mt-4 text-2xl font-light tracking-tight text-graphite-200 md:text-[34px]">{title}</h2>
          {lead && <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-graphite-400 md:text-[15px]">{lead}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Panel({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={cn("relative rounded-sm border border-graphite-700 bg-graphite-900/55", className)}>
      {label && (
        <div className="flex items-center justify-between border-b border-graphite-700 px-4 py-2.5">
          <span className="mono-label text-graphite-400">{label}</span>
          <span className="h-1 w-8 bg-gradient-to-r from-transparent to-cyan-tech/50" />
        </div>
      )}
      {children}
    </div>
  );
}

function Corners() {
  return (
    <>
      {[
        "left-0 top-0 border-l border-t",
        "right-0 top-0 border-r border-t",
        "left-0 bottom-0 border-l border-b",
        "right-0 bottom-0 border-r border-b",
      ].map((c) => (
        <span key={c} className={cn("pointer-events-none absolute h-4 w-4 border-cyan-tech/40", c)} />
      ))}
    </>
  );
}

/* -------------------------------- NAV -------------------------------- */
export function Nav() {
  const [solid, setSolid] = useState(false);
  const [dl, setDl] = useState(false);
  useEffect(() => {
    const h = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  const links = [
    ["Overview", "#overview"],
    ["3D Viewer", "#viewer"],
    ["Demo", "#demo"],
    ["Architecture", "#architecture"],
    ["PCB", "#pcb-systems"],
    ["Controls", "#controls"],
    ["Engineering", "#engineering"],
  ];
  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        solid ? "border-graphite-800 bg-graphite-950/90 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative flex h-6 w-6 items-center justify-center border border-cyan-tech/50">
            <span className="h-1.5 w-1.5 bg-cyan-tech pulse-soft" />
          </span>
          <span className="font-mono text-[13px] tracking-[0.3em] text-graphite-200">SHIELD-COM</span>
          <span className="mono-label hidden text-graphite-500 sm:inline">MOD-SC1</span>
        </a>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([t, h]) => (
            <a key={h} href={h} className="mono-label rounded-sm px-3 py-2 text-graphite-400 transition-colors hover:bg-graphite-800 hover:text-graphite-200">
              {t}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setDl(true);
              try {
                const { downloadPptx } = await import("@/utils/pptx");
                await downloadPptx();
              } finally {
                setDl(false);
              }
            }}
            disabled={dl}
            className="mono-label rounded-sm border border-amber-glow bg-amber-glow/25 px-3.5 py-2 font-bold text-amber-glow shadow-[0_0_18px_rgba(240,169,59,0.25)] transition-colors hover:bg-amber-glow/35 disabled:opacity-60"
          >
            {dl ? "BUILDING…" : "⤓ Download SIH PPT"}
          </button>
          <a
            href="#/deck"
            className="mono-label hidden rounded-sm border border-cyan-tech/40 bg-cyan-tech/10 px-3 py-2 text-cyan-tech transition-colors hover:bg-cyan-tech/20 sm:inline-block"
          >
            View deck
          </a>
          <button
            onClick={() => requestViewer("assembled")}
            className="mono-label hidden rounded-sm border border-graphite-600 px-3 py-2 text-graphite-300 transition-colors hover:border-graphite-400 lg:inline-block"
          >
            3D model
          </button>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------- HERO -------------------------------- */
export function Hero() {
  return (
    <header id="top" className="relative overflow-hidden px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-cyan-deep/12 blur-[130px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[460px] w-[460px] rounded-full bg-amber-deep/12 blur-[130px]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="rise">
          <Eyebrow tone="amber">Inline voice-cleaning &amp; audio-intelligence module</Eyebrow>
          <h1 className="mt-5 text-[38px] font-light leading-[1.05] tracking-tight text-graphite-200 md:text-[62px]">
            Clean voice.
            <br />
            <span className="text-white">Clear decisions.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-graphite-400 md:text-[17px]">
            An inline audio intelligence module for field communications. It sits between an existing field radio and its audio path — cleaning,
            buffering and tagging voice without touching the RF chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => requestViewer("exploded")}
              className="mono-label group relative overflow-hidden rounded-sm border border-cyan-tech/50 bg-cyan-tech/10 px-5 py-3.5 text-cyan-tech transition-colors hover:bg-cyan-tech/20"
            >
              Explore the assembly →
            </button>
            <button
              onClick={() => requestViewer("pcb")}
              className="mono-label rounded-sm border border-graphite-600 px-5 py-3.5 text-graphite-300 transition-colors hover:border-graphite-400 hover:text-graphite-200"
            >
              Inspect the PCB
            </button>
            <a
              href="#demo"
              className="mono-label rounded-sm border border-amber-glow/50 bg-amber-glow/10 px-5 py-3.5 text-amber-glow transition-colors hover:bg-amber-glow/20"
            >
              ▶ Try the live demo
            </a>
            <a
              href="#/deck"
              className="mono-label rounded-sm border border-graphite-600 px-5 py-3.5 text-graphite-300 transition-colors hover:border-graphite-400 hover:text-graphite-100"
            >
              SIH26052 deck →
            </a>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-4">
            {[
              ["78 × 44 × 19", "mm envelope"],
              ["4 layer", "ENIG board"],
              ["2", "physical controls"],
              ["4", "status LEDs"],
            ].map(([a, b]) => (
              <div key={b} className="bg-graphite-950 px-3 py-3">
                <dt className="font-mono text-[15px] text-graphite-200">{a}</dt>
                <dd className="mono-label mt-1 text-graphite-500">{b}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative rise">
          <div className="relative overflow-hidden rounded-sm border border-graphite-700 bg-graphite-900">
            <img src={heroImg} alt="SHIELD-COM inline module connected to a dual-band walkie-talkie field radio" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-950/70 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-30" />
            <Corners />
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
              <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-graphite-300">Studio reference · MOD-SC1</span>
              <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-alert">SOS</span>
              <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-olive-400">MARK</span>
              <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-cyan-tech">Dual-band context</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="mono-label text-graphite-500">Host walkie-talkie shown for context — Kenwood 2-pin accessory link</span>
            <span className="mono-label text-graphite-500">01 / 09</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ OVERVIEW ------------------------------ */
export function Overview() {
  return (
    <Section
      id="overview"
      eyebrow="Product overview"
      title="One module, inserted into an audio path that already exists"
      lead="SHIELD-COM never becomes the radio. It borrows the audio accessory path, improves what travels through it, and hands it straight back."
    >
      <Panel label="Signal flow · host radio → SHIELD-COM → host radio" className="p-4 md:p-7">
        <OverviewDiagram />
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          { t: "What it does", c: "#4fd1e0", items: ["Cleans and enhances voice", "Manages level automatically", "Buffers short audio events", "Tags transmissions with MARK", "Raises a deliberate SOS event"] },
          { t: "What it never does", c: "#d8453c", items: ["No transmitter or receiver", "No antenna of any kind", "No channel or tuning control", "No volume, mute or PTT", "No screen and no menus"] },
          { t: "What the operator sees", c: "#f0a93b", items: ["One raised SOS control", "One smaller MARK control", "Four status LEDs", "Two sealed cable exits", "One sealed USB-C service port"] },
        ].map((b) => (
          <div key={b.t} className="rounded-sm border border-graphite-700 bg-graphite-900/55 p-5">
            <div className="mono-label flex items-center gap-2 text-graphite-300">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.c }} />
              {b.t}
            </div>
            <ul className="mt-3 space-y-1.5">
              {b.items.map((i) => (
                <li key={i} className="flex gap-2 text-[13px] text-graphite-400">
                  <span className="mt-[7px] h-px w-3 shrink-0" style={{ background: b.c, opacity: 0.6 }} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2 lg:grid-cols-4">
        {STORY.map((s) => (
          <div key={s.k} className="group bg-graphite-950 p-5 transition-colors hover:bg-graphite-900">
            <span className="mono-label text-cyan-tech/70">{s.k}</span>
            <h4 className="mt-2 text-[14px] text-graphite-200">{s.t}</h4>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite-400">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------- ARCHITECTURE ---------------------------- */
export function Architecture() {
  return (
    <Section
      id="architecture"
      eyebrow="Architecture"
      title="Audio chain and power chain, drawn the way the board is laid out"
      lead="Analogue capture, digital processing and analogue drive are kept apart on the board, on separate rails and behind separate shields."
      tone="amber"
    >
      <Panel label="Audio signal chain · analogue in → DSP → analogue out" className="p-4 md:p-7">
        <SignalDiagram />
        <div className="mt-6 grid gap-3 border-t border-graphite-800 pt-5 md:grid-cols-4">
          {[
            ["Input conversion", "Protected, filtered and converted next to the input connector, inside its own shield can."],
            ["Voice pipeline", "Suppression, level management, voice activity and pop/click handling run on U1."],
            ["Event buffer", "A rolling buffer lets MARK keep the seconds before and after the press."],
            ["Output drive", "The DAC and driver sit in a second shielded island next to the output cable exit."],
          ].map(([t, d]) => (
            <div key={t}>
              <div className="mono-label text-cyan-tech/80">{t}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite-400">{d}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel label="Power chain · USB-C or cell → rails → loads" className="mt-4 p-4 md:p-7">
        <PowerDiagram />
        <div className="mt-6 grid gap-3 border-t border-graphite-800 pt-5 md:grid-cols-4">
          {[
            ["Two sources", "USB-C and the cell are arbitrated by the power path so audio never drops on changeover."],
            ["Two protections", "Pack protection and a board-side cut-off operate independently of the charger."],
            ["Quiet analogue", "A ferrite and a low-noise LDO separate AVDD from the switching rail."],
            ["No power switch", "There is no exterior power control — the module follows the state of the audio path."],
          ].map(([t, d]) => (
            <div key={t}>
              <div className="mono-label text-amber-glow/80">{t}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite-400">{d}</p>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

/* ---------------------------- PCB SYSTEMS ----------------------------- */
export function PcbSystems() {
  return (
    <Section
      id="pcb-systems"
      eyebrow="PCB systems"
      title="Eight systems on one four-layer board"
      lead="Every card below maps to real placement on the 66 × 34 mm board. Open any of them directly in the 3D inspection view."
    >
      <div className="grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2 lg:grid-cols-4">
        {PCB_CARDS.map((c) => (
          <button
            key={c.id}
            onClick={() => requestViewer("pcb", c.part)}
            className="group relative bg-graphite-950 p-5 text-left transition-colors hover:bg-graphite-900"
          >
            <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: c.color }} />
            <div className="flex items-start justify-between">
              <span className="mono-label text-graphite-500">{c.tag}</span>
              <span className="mono-label opacity-0 transition-opacity group-hover:opacity-100" style={{ color: c.color }}>
                Inspect →
              </span>
            </div>
            <h3 className="mt-3 text-[16px] text-graphite-200">{c.title}</h3>
            <div className="mt-1 font-mono text-[10px] tracking-wider" style={{ color: c.color }}>
              {c.ref}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-graphite-400">{c.body}</p>
            <ul className="mt-3 space-y-1">
              {c.points.map((p) => (
                <li key={p} className="flex gap-2 font-mono text-[10.5px] text-graphite-500">
                  <span className="mt-[6px] h-px w-2.5 shrink-0" style={{ background: c.color, opacity: 0.7 }} />
                  {p}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ CONTROLS ------------------------------ */
function SosArt() {
  return (
    <div className="relative flex h-40 items-center justify-center rounded-sm border border-graphite-700 bg-gradient-to-b from-graphite-800 to-graphite-900">
      <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-40" />
      <div className="relative flex h-24 w-36 items-center justify-center rounded-[6px] border-2 border-graphite-500/80 bg-graphite-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex h-[70px] w-[118px] items-center justify-center rounded-[4px] bg-gradient-to-b from-[#c93f33] to-[#8e2a22] shadow-[0_2px_10px_rgba(200,60,45,0.28)]">
          <span className="font-mono text-[17px] font-bold tracking-[0.28em] text-white/90">SOS</span>
        </div>
      </div>
      <span className="mono-label absolute bottom-2 right-3 text-graphite-500">Guard +1.4 mm over cap</span>
    </div>
  );
}

function MarkArt() {
  return (
    <div className="relative flex h-40 items-center justify-center rounded-sm border border-graphite-700 bg-gradient-to-b from-graphite-800 to-graphite-900">
      <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-40" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-graphite-500/80 bg-graphite-900/60">
        <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-b from-olive-600 to-olive-800 shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          <div className="h-[42px] w-[42px] rounded-full border border-olive-400/40 bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.08)_0deg_12deg,transparent_12deg_24deg)]" />
        </div>
      </div>
      <span className="mono-label absolute bottom-2 right-3 text-graphite-500">Ridged crown · Ø8.4 mm</span>
    </div>
  );
}

export function Controls() {
  const cards = [
    {
      id: "sos",
      name: "SOS",
      art: <SosArt />,
      color: "#d8453c",
      sub: "Emergency event control",
      body: "Large, raised and guarded. A long deliberate press raises an emergency event in the embedded control system and drives the SOS status indication.",
      specs: [
        ["Cap", "15 × 12 mm rectangular, red"],
        ["Switch", "12 mm sealed tactile, IP67"],
        ["Actuation", "Long press, deliberate"],
        ["Force", "3.5 N target, glove rated"],
        ["Guard", "Raised frame, anti-snag"],
        ["Result", "SOS event + red indication"],
      ],
      part: "sos-control",
    },
    {
      id: "mark",
      name: "MARK",
      art: <MarkArt />,
      color: "#8fa268",
      sub: "Event marking control",
      body: "Smaller, round and ridged so it can never be confused with SOS by feel. A short press tags the communication and freezes a short pre- and post-event audio buffer for later review or transmission.",
      specs: [
        ["Cap", "Ø8.4 mm round, ridged crown"],
        ["Switch", "6 mm sealed tactile"],
        ["Actuation", "Short press"],
        ["Force", "2.2 N target"],
        ["Buffer", "Pre + post event clip"],
        ["Result", "Clip stored to flash, amber LED"],
      ],
      part: "mark-control",
    },
  ];
  return (
    <Section
      id="controls"
      eyebrow="Controls"
      title="Two controls. Nothing else to find."
      lead="Every other function is configured over the service port or handled automatically, so the body of the module stays free of anything an operator could press by mistake."
      tone="amber"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="relative overflow-hidden rounded-sm border border-graphite-700 bg-graphite-900/55 p-5 md:p-7">
            <span className="absolute inset-x-0 top-0 h-px" style={{ background: c.color, opacity: 0.7 }} />
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[26px] tracking-[0.2em]" style={{ color: c.color }}>
                {c.name}
              </h3>
              <span className="mono-label text-graphite-500">{c.sub}</span>
            </div>
            <div className="mt-5">{c.art}</div>
            <p className="mt-5 text-[13.5px] leading-relaxed text-graphite-300">{c.body}</p>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2">
              {c.specs.map(([k, v]) => (
                <div key={k} className="bg-graphite-950 px-3 py-2.5">
                  <dt className="mono-label text-graphite-500">{k}</dt>
                  <dd className="mt-1 font-mono text-[11.5px] text-graphite-200">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => requestViewer("assembled", c.part)}
              className="mono-label mt-4 rounded-sm border border-graphite-600 px-3 py-2 text-graphite-300 transition-colors hover:border-graphite-400 hover:text-graphite-100"
            >
              Show on the model →
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-sm border border-alert/30 bg-alert/[0.06] p-5 md:p-6">
        <div className="mono-label mb-2 text-alert">Control policy</div>
        <p className="text-[15px] leading-relaxed text-graphite-200 md:text-[17px]">
          No mute button. No headphone button. No PTT button. No tuning controls. No menus.{" "}
          <span className="text-white">Only two deliberate field controls.</span>
        </p>
        <p className="mt-2 text-[12.5px] text-graphite-400">
          The enclosure carries no power switch, no volume control, no channel selector, no mode selector and no antenna. Status is reported by four
          LEDs, which are indicators only.
        </p>
      </div>
    </Section>
  );
}

/* ---------------------------- ENGINEERING ----------------------------- */
function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="mono-label border-b border-graphite-700 px-4 py-2.5 text-left text-graphite-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="transition-colors hover:bg-graphite-900/60">
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "border-b border-graphite-800 px-4 py-2.5 align-top text-[12.5px]",
                    j === 0 ? "font-mono text-[11px] text-cyan-tech/85" : "text-graphite-300",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Engineering() {
  return (
    <Section
      id="engineering"
      eyebrow="Engineering details"
      title="The register behind the render"
      lead="Component classes, package types, interfaces, rails and materials are stated as design intent for the MOD-SC1 build. Nothing here is presented as a measured field result."
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel label="Component register · main PCB">
          <Table
            head={["Ref", "Device", "Package", "Function"]}
            rows={ENG_COMPONENTS.map(([a, b, c, d]) => [a, b, <span className="font-mono text-[11px] text-graphite-400">{c}</span>, d])}
          />
        </Panel>

        <div className="grid gap-3">
          <Panel label="Power rails">
            <Table head={["Rail", "Nominal", "Notes"]} rows={ENG_RAILS.map(([a, b, c]) => [a, b, c])} />
          </Panel>
          <Panel label="Board & cable interfaces">
            <div className="divide-y divide-graphite-800">
              {ENG_INTERFACES.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <span className="mono-label pt-0.5 text-graphite-500">{k}</span>
                  <span className="text-right text-[12.5px] text-graphite-300">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel label="Materials & finishes">
          <div className="divide-y divide-graphite-800">
            {ENG_MATERIALS.map(([k, v]) => (
              <div key={k} className="px-4 py-2.5">
                <div className="mono-label text-graphite-500">{k}</div>
                <div className="mt-1 text-[12.5px] text-graphite-300">{v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-3">
          <Panel label="Approximate dimensions">
            <div className="grid grid-cols-2 gap-px bg-graphite-700">
              {[
                ["78.0 mm", "Length"],
                ["44.0 mm", "Width"],
                ["19.2 mm", "Height (body)"],
                ["22.0 mm", "Over SOS guard"],
                ["66 × 34 mm", "PCB outline"],
                ["1.6 mm", "Board thickness"],
                ["50 × 27 × 5.8", "Cell (mm)"],
                ["9.0 mm", "Mic spacing"],
              ].map(([a, b]) => (
                <div key={b} className="bg-graphite-950 px-4 py-3">
                  <div className="font-mono text-[13px] text-graphite-200">{a}</div>
                  <div className="mono-label mt-1 text-graphite-500">{b}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel label="Service points">
            <ul className="divide-y divide-graphite-800">
              {ENG_SERVICE.map((s) => (
                <li key={s} className="flex gap-2.5 px-4 py-2.5 text-[12.5px] text-graphite-300">
                  <span className="mt-[9px] h-px w-3 shrink-0 bg-amber-glow/60" />
                  {s}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-3">
          <Panel label="Environmental protection concepts">
            <div className="divide-y divide-graphite-800">
              {ENV_CONCEPTS.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5">
                  <div className="mono-label text-graphite-500">{k}</div>
                  <div className="mt-1 text-[12.5px] text-graphite-300">{v}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel label="Claim status">
            <div className="space-y-3 p-4">
              {CLAIM_GROUPS.map((g) => (
                <div key={g.kind}>
                  <div className="mono-label flex items-center gap-2" style={{ color: g.tone }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.tone }} />
                    {g.kind}
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {g.items.map((i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-graphite-400">
                        · {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ FIELD USE ----------------------------- */
export function FieldUse() {
  return (
    <Section
      id="field"
      eyebrow="Field use"
      title="Worn on the audio path, operated by feel"
      lead="The module is carried where the cable already runs. Nothing about the way it is used adds a control to its body."
      tone="olive"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-sm border border-graphite-700">
          <img src={fieldImg} alt="Operator with SHIELD-COM inline on the radio audio path" className="h-full min-h-[320px] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/20 to-transparent" />
          <Corners />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
            <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-graphite-300">Chest-strap carry</span>
            <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-graphite-300">Gloved operation</span>
            <span className="mono-label rounded-sm bg-graphite-950/85 px-2 py-1.5 text-graphite-300">Inline on the accessory cable</span>
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2">
          {FIELD_POINTS.map((p, i) => (
            <div key={p.t} className="bg-graphite-950 p-5">
              <span className="mono-label text-olive-400">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="mt-2 text-[14px] text-graphite-200">{p.t}</h4>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite-400">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------- FOOTER ------------------------------ */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-graphite-800 px-5 py-20 md:px-8 md:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-deep/10 blur-[120px]" />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="cyan">Open the model</Eyebrow>
          <h2 className="mt-5 text-[30px] font-light leading-tight tracking-tight text-graphite-200 md:text-[46px]">
            Inspect every part.
            <br />
            <span className="text-white">Understand every signal.</span>
          </h2>
          <button
            onClick={() => requestViewer("exploded")}
            className="mono-label mt-8 rounded-sm border border-amber-glow/50 bg-amber-glow/10 px-7 py-4 text-amber-glow transition-colors hover:bg-amber-glow/20"
          >
            Open the live 3D model →
          </button>
        </div>

        <div className="mt-16 grid gap-6 border-t border-graphite-800 pt-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-6 w-6 items-center justify-center border border-cyan-tech/50">
                <span className="h-1.5 w-1.5 bg-cyan-tech" />
              </span>
              <span className="font-mono text-[13px] tracking-[0.3em] text-graphite-300">SHIELD-COM</span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-graphite-500">
              Inline voice-cleaning and audio-intelligence module. Designation MOD-SC1. Host radio shown throughout for context only.
            </p>
          </div>
          {[
            { t: "Product", l: [["Overview", "#overview"], ["3D viewer", "#viewer"], ["Controls", "#controls"], ["Field use", "#field"]] },
            { t: "Engineering", l: [["Architecture", "#architecture"], ["PCB systems", "#pcb-systems"], ["Component register", "#engineering"]] },
          ].map((col) => (
            <div key={col.t}>
              <div className="mono-label text-graphite-400">{col.t}</div>
              <ul className="mt-3 space-y-1.5">
                {col.l.map(([t, h]) => (
                  <li key={h}>
                    <a href={h} className="text-[12.5px] text-graphite-500 transition-colors hover:text-graphite-200">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="mono-label text-graphite-400">Claim discipline</div>
            <p className="mt-3 text-[12px] leading-relaxed text-graphite-500">
              Figures on this site are design targets and intended validation activities. Measured results will be published with the test method and
              build state attached.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-graphite-800 pt-6 text-graphite-600 md:flex-row md:items-center md:justify-between">
          <span className="mono-label">© MOD-SC1 · Engineering concept site</span>
          <span className="mono-label">Audio processing separated from radio transmission</span>
        </div>
      </div>
    </footer>
  );
}
