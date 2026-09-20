import { useEffect, useRef, useState } from "react";
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
  type Status,
} from "@/data/sih";
import { downloadPptx } from "@/utils/pptx";
import { cn } from "@/utils/cn";

/* ================================================================== *
 * SIH26052 IDEA-DECK RENDERER
 * Six slides, exact SIH template order, 16:9, printable to PDF.
 * Visual identity is taken from the SHIELD-COM site (graphite + cyan +
 * amber, mono labels, hairline rules) — nothing new is invented.
 * ================================================================== */

const C = {
  bg: "#080a0b",
  panel: "#111517",
  panel2: "#161b1d",
  line: "#26302f",
  text: "#dfe6e4",
  dim: "#8d9a97",
  faint: "#5f6b69",
  cyan: "#4fd1e0",
  amber: "#f0a93b",
  green: "#7ee787",
  red: "#d8453c",
};

const STATUS_TONE: Record<Status, string> = {
  BUILT: "#7ee787",
  "IN DEVELOPMENT": "#4fd1e0",
  "DESIGN TARGET": "#f0a93b",
  PLANNED: "#63b3ed",
  "NEEDS INPUT": "#d8453c",
};

/* ------------------------------- chrome ------------------------------- */
function StatusTag({ s, small }: { s: Status; small?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono tracking-[0.18em]", small ? "text-[9px]" : "text-[10px]")}
      style={{ color: STATUS_TONE[s], borderColor: `${STATUS_TONE[s]}55`, background: `${STATUS_TONE[s]}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_TONE[s] }} />
      {s}
    </span>
  );
}

function Slide({
  n,
  title,
  eyebrow,
  children,
}: {
  n: number;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="deck-slide relative flex flex-col overflow-hidden" style={{ background: C.bg, color: C.text }}>
      {/* header band */}
      <header className="flex items-end justify-between gap-6 border-b px-14 pb-4 pt-9" style={{ borderColor: C.line }}>
        <div className="min-w-0">
          <div className="font-mono text-[11px] tracking-[0.42em]" style={{ color: C.cyan }}>
            {eyebrow}
          </div>
          <h2 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-4 font-mono text-[10px] tracking-[0.24em]" style={{ color: C.faint }}>
          <span>SHIELD-COM · MOD-SC1</span>
          <span style={{ color: C.line }}>|</span>
          <span>{PS.id}</span>
          <span className="text-[19px] font-semibold tabular-nums" style={{ color: C.amber }}>
            {String(n).padStart(2, "0")}
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-hidden px-14 py-7">{children}</div>
      <footer className="flex items-center justify-between border-t px-14 py-3 font-mono text-[9px] tracking-[0.24em]" style={{ borderColor: C.line, color: C.faint }}>
        <span>SMART INDIA HACKATHON · IDEA PRESENTATION</span>
        <span>{PS.edition.toUpperCase()}</span>
      </footer>
    </section>
  );
}

const NeedInput = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono" style={{ color: C.red }}>
    {children}
  </span>
);

/* ------------------------------ visuals ------------------------------ */
/** product block — drawn from the site's model geometry, not a screenshot */
function ProductMark({ scale = 1 }: { scale?: number }) {
  return (
    <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto" }} aria-label="SHIELD-COM module and host radio">
      {/* enclosure */}
      <rect x="14" y="34" width="150" height="62" rx="6" fill={C.panel2} stroke={C.line} strokeWidth="1.5" />
      <rect x="14" y="34" width="150" height="12" rx="6" fill="#1d2325" stroke={C.line} strokeWidth="1" />
      {/* SOS + MARK */}
      <rect x="26" y="60" width="30" height="20" rx="3" fill={C.red} opacity="0.9" />
      <rect x="22" y="55" width="38" height="30" rx="4" fill="none" stroke={C.red} strokeWidth="1.4" opacity="0.75" />
      <circle cx="84" cy="70" r="10" fill="#454f36" stroke="#2c3323" strokeWidth="1.4" />
      {/* LEDs */}
      {[
        [C.green, 118],
        [C.cyan, 130],
        [C.red, 142],
        [C.amber, 154],
      ].map(([col, x], i) => (
        <circle key={i} cx={x as number} cy="70" r="3.4" fill={col as string} opacity="0.9" />
      ))}
      {/* cables */}
      <path d="M14 78 C4 78 2 66 8 58" fill="none" stroke="#6a7159" strokeWidth="5" strokeLinecap="round" />
      <path d="M164 66 C182 66 190 52 200 46" fill="none" stroke="#6a7159" strokeWidth="5" strokeLinecap="round" />
      {/* host radio, standing */}
      <g transform="translate(206 6)">
        <rect x="26" y="18" width="56" height="98" rx="9" fill="#1a1c1e" stroke={C.line} strokeWidth="1.5" />
        <rect x="33" y="30" width="42" height="20" rx="2" fill="#1557b0" stroke="#0d2a5c" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={35 + (i % 3) * 13} y={56 + Math.floor(i / 3) * 12} width="10" height="9" rx="1.5" fill="#2a2e30" />
        ))}
        {/* antenna on the TOP end */}
        <path d="M40 18 L40 -6" stroke="#17191a" strokeWidth="6" strokeLinecap="round" />
        <rect x="36" y="8" width="9" height="10" rx="2" fill="#c89d38" />
        {/* knob on the TOP end */}
        <circle cx="66" cy="8" r="8" fill="#1e2124" stroke="#3a4143" strokeWidth="1.2" />
      </g>
      <text x="160" y="126" textAnchor="middle" className="font-mono" fontSize="9" fill={C.faint} letterSpacing="2">
        HOST RADIO → SHIELD-COM → HOST RADIO
      </text>
      <g transform={`scale(${scale})`} />
    </svg>
  );
}

/** signal-flow arrow chain used on slide 2 and 3 */
function Flow({ items }: { items: { title: string; ref?: string; detail?: string; spec?: string }[] }) {
  return (
    <div className="flex items-stretch gap-0">
      {items.map((it, i) => (
        <div key={it.title} className="flex flex-1 items-center">
          <div className="flex-1 rounded-sm border px-3 py-2.5" style={{ borderColor: C.line, background: C.panel }}>
            <div className="font-mono text-[9px] tracking-[0.2em]" style={{ color: C.cyan }}>
              {it.ref ?? `0${i + 1}`}
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium leading-tight">{it.title}</div>
            {it.detail && (
              <div className="mt-1 text-[10px] leading-snug" style={{ color: C.dim }}>
                {it.detail}
              </div>
            )}
            {it.spec && (
              <div className="mt-1 font-mono text-[9px] leading-snug" style={{ color: C.faint }}>
                {it.spec}
              </div>
            )}
          </div>
          {i < items.length - 1 && (
            <div className="px-1.5 font-mono text-[13px]" style={{ color: C.cyan }}>
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- slides ------------------------------- */
function Slide1() {
  return (
    <section className="deck-slide relative flex flex-col overflow-hidden" style={{ background: C.bg, color: C.text }}>
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="relative flex flex-1 items-center gap-12 px-16">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ background: C.cyan }} />
            <span className="font-mono text-[11px] tracking-[0.4em]" style={{ color: C.cyan }}>
              SMART INDIA HACKATHON · {PS.edition.toUpperCase()}
            </span>
          </div>

          <h1 className="mt-6 text-[54px] font-semibold leading-[1.02] tracking-tight">
            SHIELD<span style={{ color: C.amber }}>-</span>COM
          </h1>
          <p className="mt-3 text-[19px] leading-snug" style={{ color: C.dim }}>
            An inline voice-intelligibility module for radio communication in loud field environments.
          </p>

          <div className="mt-7 grid max-w-[560px] gap-px overflow-hidden rounded-sm border" style={{ borderColor: C.line, background: C.line }}>
            {[
              ["Problem statement ID", PS.id],
              ["Problem statement title", <NeedInput key="t">{PS.title}</NeedInput>],
              ["Theme", <NeedInput key="th">{PS.theme}</NeedInput>],
              ["Ministry / organisation", <NeedInput key="o">{PS.org}</NeedInput>],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-start gap-6 px-4 py-2.5" style={{ background: C.panel }}>
                <span className="w-[190px] shrink-0 font-mono text-[10px] tracking-[0.18em]" style={{ color: C.faint }}>
                  {k as string}
                </span>
                <span className="text-[13px] leading-snug">{v as React.ReactNode}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em]" style={{ borderColor: "#7ee78755", color: C.green, background: "#7ee78714" }}>
              3D MODEL BUILT
            </span>
            <span className="rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em]" style={{ borderColor: "#4fd1e055", color: C.cyan, background: "#4fd1e014" }}>
              FIRMWARE IN DEVELOPMENT
            </span>
          </div>
        </div>

        <div className="w-[420px] shrink-0">
          <div className="rounded-sm border p-6" style={{ borderColor: C.line, background: C.panel }}>
            <ProductMark />
            <div className="mt-5 border-t pt-4" style={{ borderColor: C.line }}>
              <div className="font-mono text-[10px] tracking-[0.24em]" style={{ color: C.faint }}>
                TEAM · {TEAM.name}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1.5">
                {TEAM.members.map(([n, d], i) => (
                  <div key={i} className="text-[11px] leading-tight">
                    <span style={{ color: C.faint }}>{i + 1}. </span>
                    <NeedInput>{n}</NeedInput>
                    <div className="font-mono text-[9px]" style={{ color: C.faint }}>
                      {d}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3 text-[11px]" style={{ borderColor: C.line }}>
                <div>
                  <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: C.faint }}>
                    INSTITUTE ·{" "}
                  </span>
                  <NeedInput>{TEAM.institute}</NeedInput>
                </div>
                <div>
                  <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: C.faint }}>
                    TEAM LEADER ·{" "}
                  </span>
                  <NeedInput>{TEAM.leader}</NeedInput>
                </div>
                <div>
                  <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: C.faint }}>
                    MENTOR ·{" "}
                  </span>
                  <NeedInput>{TEAM.mentor}</NeedInput>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="flex items-center justify-between border-t px-16 py-3 font-mono text-[9px] tracking-[0.24em]" style={{ borderColor: C.line, color: C.faint }}>
        <span>SLIDE 01 / 06</span>
        <span>IDEA PRESENTATION</span>
      </footer>
    </section>
  );
}

function Slide2() {
  return (
    <Slide n={2} eyebrow="PROPOSED SOLUTION" title="Fix the voice on the path that already exists">
      <div className="grid h-full grid-cols-[1.15fr_1fr] gap-8">
        <div className="flex flex-col gap-5">
          <div className="rounded-sm border-l-4 px-4 py-3" style={{ borderColor: C.amber, background: `${C.amber}12` }}>
            <div className="text-[16px] font-medium leading-snug">{PROBLEM.headline}</div>
            <div className="mt-1.5 text-[12px] leading-snug" style={{ color: C.dim }}>
              {PROBLEM.consequence}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[0.22em]" style={{ color: C.faint }}>
              WHY IT HAPPENS
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROBLEM.causes.map((c) => (
                <span key={c} className="rounded-sm border px-2.5 py-1 text-[11px]" style={{ borderColor: C.line, background: C.panel, color: C.dim }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2 font-mono text-[10px] tracking-[0.22em]" style={{ color: C.faint }}>
              WHAT PEOPLE DO TODAY — AND WHY IT IS NOT ENOUGH
            </div>
            <ul className="space-y-1.5">
              {PROBLEM.today.map((t) => (
                <li key={t} className="flex gap-2 text-[12px] leading-snug">
                  <span style={{ color: C.red }}>—</span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t pt-2.5 text-[12.5px] font-medium leading-snug" style={{ borderColor: C.line }}>
              {PROBLEM.gap}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[0.22em]" style={{ color: C.faint }}>
              SIGNAL PATH · THE MODULE INSERTS ITSELF, THEN STEPS BACK OUT
            </div>
            <Flow
              items={[
                { title: "Host radio", ref: "EXISTING", detail: "Operator's own set, unchanged" },
                { title: "SHIELD-COM", ref: "MOD-SC1", detail: "Cleans voice, manages level" },
                { title: "Accessory / earpiece", ref: "EXISTING", detail: "Handed back untouched" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
            <ProductMark />
          </div>

          <div className="rounded-sm border px-4 py-3" style={{ borderColor: "#4fd1e055", background: "#4fd1e010" }}>
            <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: C.cyan }}>
              THE SOLUTION IN ONE LINE
            </div>
            <p className="mt-1.5 text-[13px] leading-snug">{SOLUTION.oneLiner}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border p-3" style={{ borderColor: "#7ee78744", background: "#7ee7870c" }}>
              <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.green }}>
                IT DOES
              </div>
              {SOLUTION.does.map((d) => (
                <div key={d} className="text-[11.5px] leading-snug">
                  · {d}
                </div>
              ))}
            </div>
            <div className="rounded-sm border p-3" style={{ borderColor: "#d8453c44", background: "#d8453c0c" }}>
              <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.red }}>
                IT DOES NOT
              </div>
              {SOLUTION.doesNot.map((d) => (
                <div key={d} className="text-[11.5px] leading-snug">
                  · {d}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border p-3" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
              WHAT IS DIFFERENT ABOUT IT
            </div>
            <div className="space-y-2">
              {SOLUTION.differentiators.map(([t, d]) => (
                <div key={t}>
                  <span className="text-[12px] font-medium" style={{ color: C.amber }}>
                    {t}
                  </span>
                  <span className="text-[11.5px] leading-snug" style={{ color: C.dim }}>
                    {" "}
                    — {d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Slide3() {
  return (
    <Slide n={3} eyebrow="TECHNICAL APPROACH" title="Analogue in, digital processing, analogue out — kept apart on purpose">
      <div className="flex h-full flex-col gap-5">
        <Flow items={CHAIN} />

        <div className="grid flex-1 grid-cols-[1.1fr_1fr] gap-5">
          <div className="flex flex-col gap-3">
            <div className="rounded-sm border p-3.5" style={{ borderColor: C.line, background: C.panel }}>
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                HARDWARE STACK · ALL CATALOGUE PARTS
              </div>
              <div className="space-y-1">
                {STACK.map((s) => (
                  <div key={s.label} className="flex items-start gap-3 border-b pb-1 last:border-0" style={{ borderColor: C.line }}>
                    <span className="w-[110px] shrink-0 font-mono text-[10px]" style={{ color: C.cyan }}>
                      {s.label}
                    </span>
                    <span className="flex-1 text-[11px] leading-snug" style={{ color: C.dim }}>
                      {s.value}
                    </span>
                    {s.status && <StatusTag s={s.status} small />}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border p-3.5" style={{ borderColor: C.line, background: C.panel }}>
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                POWER RAILS · ANALOGUE KEPT SEPARATE FROM DIGITAL
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {RAILS.map(([n, v, d]) => (
                  <div key={n} className="flex items-baseline gap-2">
                    <span className="w-[42px] font-mono text-[11px]" style={{ color: C.amber }}>
                      {n}
                    </span>
                    <span className="w-[62px] font-mono text-[10px]">{v}</span>
                    <span className="flex-1 text-[10px] leading-snug" style={{ color: C.faint }}>
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-sm border p-3.5" style={{ borderColor: C.line, background: C.panel }}>
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                INTERFACES
              </div>
              <div className="space-y-1">
                {INTERFACES.map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3">
                    <span className="w-[92px] shrink-0 font-mono text-[10px]" style={{ color: C.cyan }}>
                      {k}
                    </span>
                    <span className="flex-1 text-[11px] leading-snug" style={{ color: C.dim }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border p-3.5" style={{ borderColor: C.line, background: C.panel }}>
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                BOARD PRACTICE
              </div>
              <ul className="space-y-1 text-[11px] leading-snug" style={{ color: C.dim }}>
                <li>· Analogue island on its own low-noise rail, behind its own shield can</li>
                <li>· Shielded RF module with a no-copper keep-out at the board edge</li>
                <li>· ESD spark-gap combs at both external connectors</li>
                <li>· Thermal via fields under every power and conversion device</li>
                <li>· Gold test points TP1–TP8 on every rail plus audio in / out</li>
                <li>· Two clip-on EMI cans, single-point shield bonding</li>
              </ul>
            </div>

            <div className="rounded-sm border p-3.5" style={{ borderColor: "#d8453c44", background: "#d8453c0c" }}>
              <div className="flex items-center gap-2">
                <StatusTag s="IN DEVELOPMENT" />
                <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: C.faint }}>
                  VOICE PIPELINE
                </span>
              </div>
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: C.dim }}>
                The interactive model, board layout and demo UI are built. The voice-cleaning firmware that runs on U1 is not finished — that is the
                remaining engineering work, and we are not claiming measured performance for it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Slide4() {
  return (
    <Slide n={4} eyebrow="FEASIBILITY & VIABILITY" title="What is built, what is left, and what we will not claim">
      <div className="grid h-full grid-cols-2 gap-x-6 gap-y-4">
        {FEASIBILITY.map((f) => (
          <div key={f.status} className="rounded-sm border p-4" style={{ borderColor: `${f.tone}44`, background: `${f.tone}0a` }}>
            <div className="mb-2 flex items-center gap-2.5">
              <StatusTag s={f.status} />
              <span className="text-[12.5px] font-medium">{f.title}</span>
            </div>
            <ul className="space-y-1">
              {f.items.map((it) => (
                <li key={it} className="flex gap-2 text-[11.5px] leading-snug" style={{ color: C.dim }}>
                  <span style={{ color: f.tone }}>·</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="col-span-2 grid grid-cols-[1fr_1fr] gap-5">
          <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
              WHY IT IS BUILDABLE
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1">
              {WHY_FEASIBLE.map((w) => (
                <div key={w} className="flex gap-2 text-[11px] leading-snug" style={{ color: C.dim }}>
                  <span style={{ color: C.green }}>·</span>
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-3 border-t pt-2 text-[11.5px] italic leading-snug" style={{ borderColor: C.line, color: C.amber }}>
              {HONESTY}
            </div>
          </div>

          <div className="rounded-sm border p-4" style={{ borderColor: "#d8453c44", background: "#d8453c0a" }}>
            <div className="mb-2 flex items-center gap-2">
              <StatusTag s="NEEDS INPUT" />
              <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                NOT YET ANSWERED — WE WILL NOT GUESS THESE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1">
              {VIABILITY_GAPS.map((row) => (
                <div key={row[0]} className="flex items-start gap-2 text-[11px] leading-snug">
                  <span style={{ color: C.red }}>·</span>
                  <span style={{ color: C.dim }}>{row[0]}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px]" style={{ color: C.red }}>
                    OPEN
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Slide5() {
  return (
    <Slide n={5} eyebrow="IMPACT & BENEFITS" title="Capability added to inventory that is already in service">
      <div className="grid h-full grid-cols-[1.25fr_1fr] gap-6">
        <div className="flex flex-col gap-3">
          {IMPACT.map((r) => (
            <div key={r.who} className="grid grid-cols-[124px_1fr] items-start gap-4 rounded-sm border px-4 py-2.5" style={{ borderColor: C.line, background: C.panel }}>
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: C.cyan }}>
                  {r.who.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium leading-tight">{r.benefit}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.dim }}>
                  {r.detail}
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-sm border p-3.5" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
              SCALING — ONE BOARD, SEVERAL USERS
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1">
              {SCALE.map(([k, v]) => (
                <div key={k} className="text-[11px] leading-snug">
                  <span className="font-medium" style={{ color: C.amber }}>
                    {k}
                  </span>
                  <span style={{ color: C.dim }}> — {v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
              BENEFIT CHAIN
            </div>
            <div className="space-y-2">
              {[
                ["Noise reaches the mic", "rotor, wind, vehicles"],
                ["Voice is separated", "reference mic + suppression on U1"],
                ["Level is held", "automatic, no operator action"],
                ["The far end hears words", "not a shout buried in wash"],
              ].map(([a, b], i) => (
                <div key={a}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px]" style={{ color: C.cyan }}>
                      {i + 1}
                    </span>
                    <span className="text-[12px] font-medium">{a}</span>
                  </div>
                  <div className="ml-6 text-[10.5px]" style={{ color: C.faint }}>
                    {b}
                  </div>
                  {i < 3 && (
                    <div className="ml-1.5 mt-0.5 font-mono text-[10px]" style={{ color: C.line }}>
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border p-4" style={{ borderColor: "#d8453c44", background: "#d8453c0a" }}>
            <div className="mb-2 flex items-center gap-2">
              <StatusTag s="NEEDS INPUT" />
              <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                IMPACT NUMBERS WE OWE THE JURY
              </span>
            </div>
            <div className="space-y-1">
              {IMPACT_GAPS.map(([k]) => (
                <div key={k} className="flex items-start gap-2 text-[11px] leading-snug">
                  <span style={{ color: C.red }}>·</span>
                  <span style={{ color: C.dim }}>{k}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px]" style={{ color: C.red }}>
                    OPEN
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 border-t pt-2 text-[11px] leading-snug" style={{ borderColor: C.line, color: C.dim }}>
              Every number on this list needs hardware before it can be written down. We would rather show the gap than invent a figure.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Slide6() {
  return (
    <Slide n={6} eyebrow="RESEARCH & REFERENCES" title="Standards we are designing to, and the methods we will measure with">
      <div className="grid h-full grid-cols-[1.3fr_1fr] gap-6">
        <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
          <div className="mb-2.5 grid grid-cols-[128px_1fr_150px] gap-3 border-b pb-1.5 font-mono text-[9px] tracking-[0.18em]" style={{ borderColor: C.line, color: C.faint }}>
            <span>REFERENCE</span>
            <span>TITLE</span>
            <span>WHY IT MATTERS HERE</span>
          </div>
          <div className="space-y-1.5">
            {REFERENCES.map(([ref, title, why]) => (
              <div key={ref} className="grid grid-cols-[128px_1fr_150px] gap-3 border-b pb-1.5 last:border-0" style={{ borderColor: C.line }}>
                <span className="font-mono text-[10.5px] leading-snug" style={{ color: C.amber }}>
                  {ref}
                </span>
                <span className="text-[11px] leading-snug">{title}</span>
                <span className="text-[10px] leading-snug" style={{ color: C.dim }}>
                  {why}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-sm border p-4" style={{ borderColor: C.line, background: C.panel }}>
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
              METHOD WE WILL REPORT AGAINST
            </div>
            <ul className="space-y-1.5 text-[11px] leading-snug" style={{ color: C.dim }}>
              <li>
                · <span style={{ color: C.text }}>Intelligibility</span> — subjective scoring per ITU-T P.800 against recorded field noise
              </li>
              <li>
                · <span style={{ color: C.text }}>Objective quality</span> — POLQA (ITU-T P.863) on the processed output
              </li>
              <li>
                · <span style={{ color: C.text }}>Environment</span> — MIL-STD-810H style drop and vibration test planning
              </li>
              <li>
                · <span style={{ color: C.text }}>Interfaces</span> — IEC 61000-4-2 ESD on USB-C and both audio connectors
              </li>
              <li>
                · <span style={{ color: C.text }}>Sealing</span> — IEC 60529 IP code verification against the IP67 target
              </li>
            </ul>
          </div>

          <div className="rounded-sm border p-4" style={{ borderColor: "#d8453c44", background: "#d8453c0a" }}>
            <div className="mb-2 flex items-center gap-2">
              <StatusTag s="NEEDS INPUT" />
              <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: C.faint }}>
                REFERENCES STILL TO ADD
              </span>
            </div>
            <div className="space-y-1">
              {REF_GAPS.map(([k]) => (
                <div key={k} className="flex items-start gap-2 text-[11px] leading-snug">
                  <span style={{ color: C.red }}>·</span>
                  <span style={{ color: C.dim }}>{k}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 border-t pt-2 text-[11px] leading-snug" style={{ borderColor: C.line, color: C.dim }}>
              No dataset was supplied with the problem statement. Where live field data needs permission, we will say so plainly rather than call a
              synthetic set "real".
            </p>
          </div>

          <div className="rounded-sm border px-4 py-3" style={{ borderColor: C.line, background: C.panel }}>
            <div className="font-mono text-[9px] tracking-[0.24em]" style={{ color: C.faint }}>
              LIVE MODEL & DEMO
            </div>
            <div className="mt-1 font-mono text-[11px]" style={{ color: C.cyan }}>
              NEEDS INPUT — deployed link + 2–3 min walkthrough recording
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------- shell ------------------------------- */
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];

export default function Deck() {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [printAll, setPrintAll] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const el = wrap.current;
      if (!el) return;
      const w = el.clientWidth;
      setScale(Math.min(1, w / 1280));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") setI((v) => Math.min(SLIDES.length - 1, v + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const Current = SLIDES[i];

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* toolbar — hidden when printing */}
      <div className="deck-toolbar sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: C.line, background: "#0d1112" }}>
        <span className="font-mono text-[11px] tracking-[0.3em]" style={{ color: C.cyan }}>
          SIH DECK · {PS.id}
        </span>
        <span className="font-mono text-[10px]" style={{ color: C.faint }}>
          6 slides · SIH idea template · export to PDF for submission
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            className="rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-widest"
            style={{ borderColor: C.line, color: C.dim }}
          >
            ← PREV
          </button>
          <span className="px-1 font-mono text-[11px]" style={{ color: C.text }}>
            {i + 1} / {SLIDES.length}
          </span>
          <button
            onClick={() => setI((v) => Math.min(SLIDES.length - 1, v + 1))}
            className="rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-widest"
            style={{ borderColor: C.line, color: C.dim }}
          >
            NEXT →
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await downloadPptx();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-widest disabled:opacity-50"
            style={{ borderColor: `${C.amber}88`, background: `${C.amber}22`, color: C.amber }}
          >
            {busy ? "BUILDING…" : "⤓ DOWNLOAD .PPTX"}
          </button>
          <button
            onClick={() => {
              setPrintAll(true);
              window.setTimeout(() => {
                window.print();
                window.setTimeout(() => setPrintAll(false), 400);
              }, 120);
            }}
            className="rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-widest"
            style={{ borderColor: C.line, color: C.dim }}
          >
            ⤓ PDF
          </button>
          <button
            onClick={() => {
              window.location.hash = "";
            }}
            className="rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-widest"
            style={{ borderColor: C.line, color: C.dim }}
          >
            ← SITE
          </button>
        </div>
      </div>

      {/* slide stage */}
      <div ref={wrap} className="px-4 py-6">
        {/* on screen: the current slide, scaled to fit */}
        <div
          className="deck-stage mx-auto overflow-hidden rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.6)] print:hidden"
          style={{ width: 1280 * scale, height: 720 * scale }}
        >
          <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <Current />
          </div>
        </div>

        {/* when printing: every slide, in SIH order, one per page */}
        {printAll && (
          <div className="hidden print:block">
            {SLIDES.map((S, n) => (
              <div key={n} className="deck-stage" style={{ width: 1280, height: 720 }}>
                <S />
              </div>
            ))}
          </div>
        )}

        {/* thumbnails */}
        <div className="mx-auto mt-5 flex max-w-[1280px] flex-wrap justify-center gap-2">
          {SLIDES.map((_S, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              className={cn("rounded-sm border px-3 py-2 font-mono text-[10px] tracking-widest transition-colors")}
              style={{
                borderColor: n === i ? C.cyan : C.line,
                background: n === i ? `${C.cyan}18` : "transparent",
                color: n === i ? C.cyan : C.faint,
              }}
            >
              {String(n + 1).padStart(2, "0")}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-5 max-w-[900px] rounded-sm border px-4 py-3" style={{ borderColor: C.line, background: C.panel }}>
          <div className="font-mono text-[10px] tracking-[0.2em]" style={{ color: C.amber }}>
            HOW TO USE THIS
          </div>
          <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed" style={{ color: C.dim }}>
            <li>
              · <b style={{ color: C.text }}>DOWNLOAD .PPTX</b> gives you a real, fully editable PowerPoint — every text box, shape and colour is
              native, so you can type straight into the red <span style={{ color: C.red }}>NEEDS INPUT</span> fields.
            </li>
            <li>
              · Fill the title slide first: PS title, theme, ministry, institute, all six members, leader and mentor.
            </li>
            <li>
              · SIH submits as <b style={{ color: C.text }}>PDF</b> — use PowerPoint's own “Save as PDF”, or the PDF button here for a quick proof.
            </li>
            <li>
              · Six slides is the fixed SIH idea-submission format. If something spills, cut it — do not add a seventh page.
            </li>
            <li>
              · Placeholder text left on a slide is one of the most common reasons decks lose marks. Search for “NEEDS INPUT” before you submit.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
